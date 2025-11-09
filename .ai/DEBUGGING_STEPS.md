# Kroki Debugowania Problemu [object Object]

## Status Debugowania

**Data**: 2025-01-11
**Status**: Problem zidentyfikowany - Astro Cloudflare adapter serializuje response niepoprawnie w produkcji
**Wersje testowane**: 
- Astro 5.15.4 (najnowsza) - problem występuje
- Astro 5.14.8 (testowana) - build successful, czeka na deploy test

## Krok 1: Sprawdź i zaktualizuj wersje pakietów

✅ **WYKONANE (2025-01-11)**

```bash
# Sprawdź aktualne wersje
npm list astro @astrojs/cloudflare

# Sprawdź dostępne aktualizacje
npm outdated astro @astrojs/cloudflare

# Zaktualizuj do najnowszych wersji
npm install astro@latest @astrojs/cloudflare@latest

# Lub przetestuj starszą wersję
npm install astro@5.14.8 @astrojs/cloudflare@12.6.10
```

**Co sprawdzić:**
- Czy `@astrojs/cloudflare` jest kompatybilny z Astro 5.13.7
- Czy są znane problemy w changelog adaptera

**Wyniki (2025-01-11)**:
- ✅ Sprawdzono wersje: Astro 5.15.4 (najnowsza), @astrojs/cloudflare 12.6.10
- ✅ Przetestowano downgrade: Astro 5.14.8 (build successful)
- ⚠️ **Następny krok**: Deploy z Astro 5.14.8 aby sprawdzić czy starsza wersja rozwiązuje problem

## Krok 2: Przetestuj lokalnie z Wrangler

```bash
# Zbuduj aplikację
npm run build:cloudflare

# Uruchom lokalnie z Wrangler
npm run preview:cloudflare

# W osobnym terminalu sprawdź response
curl.exe http://localhost:8788/
```

**Co sprawdzić:**
- Czy lokalnie działa poprawnie (HTML zamiast [object Object])
- Jeśli lokalnie działa, problem jest specyficzny dla Cloudflare Pages
- Jeśli lokalnie też nie działa, problem jest w konfiguracji adaptera

**Wyniki (2025-01-11)**:
- ✅ **Lokalnie działa poprawnie**: `curl http://localhost:8788/` zwraca pełny HTML
- ✅ **Build successful**: Wszystkie pliki generowane poprawnie
- ✅ **Struktura dist/ poprawna**: `_routes.json` i `_worker.js/` istnieją
- ❌ **Production nadal nie działa**: Mimo że lokalnie działa, production zwraca `[object Object]`
- **Wniosek**: Problem jest specyficzny dla środowiska Cloudflare Pages production, nie dla kodu

## Krok 3: Sprawdź zawartość dist/ po buildzie

```bash
# Zbuduj aplikację
npm run build:cloudflare

# Sprawdź strukturę dist/
ls -la dist/  # Linux/Mac
dir dist\     # Windows

# Sprawdź czy są pliki HTML w dist/
find dist -name "*.html"  # Linux/Mac
dir /s dist\*.html        # Windows

# Sprawdź zawartość _worker.js lub podobnych plików
cat dist/_worker.js | head -50  # Linux/Mac
Get-Content dist\_worker.js -Head 50  # Windows PowerShell
```

**Co sprawdzić:**
- Czy Astro generuje pliki HTML
- Czy są pliki worker (._worker.js, functions/, etc.)
- Jaka jest struktura dist/

## Krok 4: Dodaj dodatkowe logowanie

✅ **WYKONANE (2025-01-11)**: Dodano szczegółowe logowanie w middleware

Dodano logowanie w middleware, aby zobaczyć co jest zwracane:

```typescript
// src/middleware/index.ts
const response = await next();

// Additional logging to debug [object Object] issue
console.log(`[Middleware] Response received for ${pathname}:`, {
  type: typeof response,
  constructor: response?.constructor?.name,
  isResponse: response instanceof Response,
  isString: typeof response === 'string',
  isObject: typeof response === 'object' && response !== null,
});

if (response instanceof Response) {
  const cloned = response.clone();
  try {
    const text = await cloned.text();
    console.log(`[Middleware] Response body preview (first 200 chars):`, text.substring(0, 200));
    console.log(`[Middleware] Response body length:`, text.length);
    console.log(`[Middleware] Response headers:`, Object.fromEntries(response.headers.entries()));
    console.log(`[Middleware] Response status:`, response.status);
    console.log(`[Middleware] Response statusText:`, response.statusText);
  } catch (error) {
    console.error(`[Middleware] Error reading response body:`, error);
  }
} else {
  console.error(`[Middleware] Response is not a Response object! Type: ${typeof response}, Value:`, response);
}
```

**Co to pokaże:**
- Typ obiektu zwracanego przez `next()`
- Czy to jest Response object
- Preview zawartości response body
- Nagłówki i status response
- Jeśli response nie jest Response object, zobaczymy co to jest

**Następny krok**: Po deploy, sprawdź logi Cloudflare aby zobaczyć co middleware loguje.

**Wyniki (2025-01-11)**:
- ✅ **Response IS a Response object**: `isResponse: true`, `constructor: "Response"`
- ✅ **Headers are correct**: `content-type: text/html`, `x-astro-route-type: page`
- ✅ **Status is correct**: `200 OK`
- ❌ **BUT Response body is already `[object Object]`**: The body contains the string `[object Object]` (15 bytes) when middleware receives it

**Critical Discovery**: The problem occurs BEFORE middleware receives the response. The Response object from `next()` already has `[object Object]` as its body content. This means:
- ✅ Middleware is working correctly
- ✅ Response object structure is correct
- ❌ **The problem is in Astro's Cloudflare adapter** - the HTML is being converted to `[object Object]` string somewhere between page render and middleware
- The conversion happens in the adapter layer, not in our code

**Root Cause**: The Astro Cloudflare adapter is serializing the response incorrectly in production (but works correctly locally).

## Krok 5: Sprawdź konfigurację adaptera

Sprawdź czy adapter jest poprawnie skonfigurowany:

```javascript
// astro.config.mjs
export default defineConfig({
  output: "server",  // ✅ Musi być "server" dla SSR
  adapter: isCloudflare ? cloudflare() : node({ mode: "standalone" }),
  // ...
});
```

**Sprawdź:**
- Czy `output: "server"` jest ustawione
- Czy adapter jest poprawnie wybrany (sprawdź `isCloudflare`)
- Czy nie ma konfliktów z innymi adapterami

## Krok 6: Sprawdź znane problemy

```bash
# Sprawdź issues na GitHub
# https://github.com/withastro/astro/issues
# Szukaj: "cloudflare" "object Object" "response serialization"

# Sprawdź dokumentację adaptera
# https://docs.astro.build/en/guides/integrations-guide/cloudflare/
```

## Krok 7: Test z minimalnym przykładem

Stwórz minimalną stronę testową:

```astro
<!-- src/pages/test.astro -->
---
// Minimalna strona bez Supabase, bez middleware
---
<!doctype html>
<html>
<head>
  <title>Test</title>
</head>
<body>
  <h1>Test Page</h1>
</body>
</html>
```

Sprawdź czy `/test` działa poprawnie.

## Krok 8: Sprawdź _routes.json

```bash
# Sprawdź czy _routes.json istnieje w dist/
cat dist/_routes.json  # Linux/Mac
Get-Content dist\_routes.json  # Windows
```

Powinien zawierać:
```json
{
  "version": 1,
  "include": ["/*"],
  "exclude": ["/_astro/*", "/favicon.*"]
}
```

## Krok 9: Sprawdź logi builda

```bash
# Zbuduj z verbose output
npm run build:cloudflare -- --verbose

# Sprawdź czy są błędy lub ostrzeżenia
```

## Krok 10: Porównaj z działającą konfiguracją

Jeśli masz dostęp do działającej aplikacji Astro na Cloudflare:
- Porównaj wersje pakietów
- Porównaj konfigurację astro.config.mjs
- Porównaj strukturę dist/

## GitHub Issues Research

✅ **WYKONANE (2025-01-11)**

**Znalezione Issues**:
- [#6516](https://github.com/withastro/astro/issues/6516) - Problems with large `exclude` in `_routes.json` causing deployment failures
- [#6130](https://github.com/withastro/astro/issues/6130) - Problems with environment variables access in SSR mode on Cloudflare Pages
- [#67 (adapters repo)](https://github.com/withastro/adapters/issues/67) - Problems with 404 page rendering on Cloudflare

**Wyniki**:
- ❌ **Nie znaleziono bezpośredniego bug report** dla `[object Object]` response body
- ⚠️ Znalezione powiązane problemy z Cloudflare Pages, ale nie identyczny bug
- **Wniosek**: Może to być nowy bug lub rzadki edge case

**Rekomendacja**: Zgłosić nowy issue na GitHubie z:
- Szczegółowymi logami (już mamy z middleware)
- Informacją że lokalnie działa (`wrangler pages dev`), produkcja nie
- Wersjami pakietów: Astro 5.15.4, @astrojs/cloudflare 12.6.10
- Konfiguracją adaptera i astro.config.mjs
- Przykładowymi logami z Cloudflare

## Najczęstsze rozwiązania:

1. **Aktualizacja adaptera**: `npm install @astrojs/cloudflare@latest`
2. **Sprawdzenie output mode**: Musi być `"server"` nie `"static"`
3. **Sprawdzenie _routes.json**: Musi być w dist/
4. **Problem z middleware**: Middleware może zwracać obiekt zamiast Response
5. **Testowanie różnych wersji**: Przetestuj starsze wersje Astro (np. 5.14.8)

