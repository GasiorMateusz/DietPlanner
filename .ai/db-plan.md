# Database Plan

## Required Extensions and Custom Types

### Extensions
```sql
-- Włączenie rozszerzenia do wyszukiwania trygramowego (dla US-006)
-- Umożliwia szybkie wyszukiwanie częściowe w nazwach planów.
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
```

### Custom Types
```sql
-- Niestandardowy typ ENUM dla poziomu aktywności (PRD 3.3.1, Decyzja 6)
-- Zapewnia spójność danych wejściowych dla poziomu aktywności.
CREATE TYPE "public"."activity_level_enum" AS ENUM (
  'sedentary',
  'light',
  'moderate',
  'high'
);
```

## Table Definitions

### AI Chat Sessions Table
```sql
-- Tabela do przechowywania danych telemetrycznych AI (PRD 3.5, Decyzja 2)
-- Przechowuje historię konwersacji do celów analitycznych, niedostępną dla użytkownika.
CREATE TABLE "public"."ai_chat_sessions" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "message_history" jsonb,
  "final_prompt_count" integer NOT NULL DEFAULT 1,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "ai_chat_sessions_pkey" PRIMARY KEY ("id"),
  -- Relacja do użytkownika Supabase (Decyzja 4)
  CONSTRAINT "ai_chat_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE
);
```

### Meal Plans Table
```sql
-- Tabela przechowująca zapisane plany dietetyczne (PRD 3.2, Decyzja 1)
-- Główna tabela robocza dla dietetyków.
CREATE TABLE "public"."meal_plans" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "source_chat_session_id" uuid,
  "name" text NOT NULL,
  "plan_content" jsonb NOT NULL,
  -- Kolumny z formularza startowego (PRD 3.3.1, Decyzja 8)
  "patient_age" integer,
  "patient_weight" numeric(5, 2), -- Przykładowa precyzja: 0.00 do 999.99
  "patient_height" numeric(5, 1), -- Przykładowa precyzja: 0.0 do 999.9
  "activity_level" public.activity_level_enum,
  "target_kcal" integer,
  "target_macro_distribution" jsonb,
  "meal_names" text, -- Przechowuje listę nazw posiłków, np. "Śniadanie, II Śniadanie..."
  "exclusions_guidelines" text,
  -- Kolumny do sortowania i śledzenia (Decyzja 9, US-011)
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "meal_plans_pkey" PRIMARY KEY ("id"),
  -- Relacja do użytkownika Supabase (Decyzja 4)
  CONSTRAINT "meal_plans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE,
  -- Relacja do sesji AI (Decyzja 3)
  CONSTRAINT "meal_plans_source_chat_session_id_fkey" FOREIGN KEY ("source_chat_session_id") REFERENCES "public"."ai_chat_sessions"("id") ON DELETE SET NULL
);
```

## Table Relationships

### auth.users (1) -> (N) public.meal_plans (One-to-Many)
- **Description**: Jeden użytkownik (dietetyk) może posiadać wiele planów dietetycznych.
- **Implementation**: Klucz obcy `user_id` w tabeli `meal_plans`.
- **Delete Behavior**: `ON DELETE CASCADE` (Decyzja 4) – usunięcie użytkownika powoduje usunięcie wszystkich jego planów dietetycznych (zgodnie z US-004).

### auth.users (1) -> (N) public.ai_chat_sessions (One-to-Many)
- **Description**: Jeden użytkownik może mieć wiele sesji czatu AI.
- **Implementation**: Klucz obcy `user_id` w tabeli `ai_chat_sessions`.
- **Delete Behavior**: `ON DELETE CASCADE` (Decyzja 4) – usunięcie użytkownika powoduje usunięcie wszystkich jego danych telemetrycznych.

### public.ai_chat_sessions (1) -> (N) public.meal_plans (One-to-Many)
- **Description**: Jedna sesja czatu AI może być źródłem dla wielu planów dietetycznych (chociaż w logice MVP będzie to zazwyczaj relacja 1:1, schemat pozwala na 1:N).
- **Implementation**: Klucz obcy `source_chat_session_id` w tabeli `meal_plans`.
- **Delete Behavior**: `ON DELETE SET NULL` (Decyzja 3) – usunięcie sesji czatu (np. w celach administracyjnych lub anonimizacji) nie usuwa planu dietetycznego; plan po prostu traci odniesienie do swojego źródła.

## Indexes

```sql
-- Indeksy dla kluczy obcych (poprawa wydajności złączeń i zapytań filtrowania)
CREATE INDEX "idx_meal_plans_user_id" ON "public"."meal_plans" USING btree ("user_id");
CREATE INDEX "idx_meal_plans_source_chat_session_id" ON "public"."meal_plans" USING btree ("source_chat_session_id");
CREATE INDEX "idx_ai_chat_sessions_user_id" ON "public"."ai_chat_sessions" USING btree ("user_id");

-- Indeks GIN z pg_trgm dla wyszukiwania "na żywo" (US-006, Decyzja 7)
-- Niezbędny do wydajnego działania zapytań ILIKE '%query%' na kolumnie 'name'.
CREATE INDEX "idx_meal_plans_name_trgm" ON "public"."meal_plans" USING gin ("name" public.gin_trgm_ops);
```

## Row-Level Security (RLS) Policies

### Enable RLS
```sql
-- Włączenie RLS na obu tabelach
ALTER TABLE "public"."meal_plans" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ai_chat_sessions" ENABLE ROW LEVEL SECURITY;
```

### Meal Plans Policies
```sql
-- Polityki dla tabeli 'meal_plans' (Decyzja 5)
-- Użytkownik ma pełen dostęp (CRUD) tylko do swoich własnych zasobów.
CREATE POLICY "Dietetycy mogą zarządzać własnymi planami dietetycznymi"
ON "public"."meal_plans" FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

### AI Chat Sessions Policies
```sql
-- Polityki dla tabeli 'ai_chat_sessions' (Decyzja 5, PRD 3.5)
-- Użytkownik może tylko tworzyć nowe sesje (zapis telemetryczny).
CREATE POLICY "Dietetycy mogą tworzyć nowe sesje czatu"
ON "public"."ai_chat_sessions" FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Użytkownik nie może odczytywać, modyfikować ani usuwać żadnych sesji (ani swoich, ani cudzych).
CREATE POLICY "Sesje czatu są prywatne i nie mogą być odczytywane ani modyfikowane"
ON "public"."ai_chat_sessions" FOR SELECT, UPDATE, DELETE
USING (false);
```

## Additional Features

### Automatic updated_at Trigger
**Purpose**: Automatyczna aktualizacja `updated_at` (Decyzja 9 / US-011)

Aby kolumna `updated_at` w tabeli `meal_plans` była automatycznie aktualizowana przy każdej zmianie (co jest potrzebne do sortowania na Dashboardzie, US-011), wymagana jest funkcja triggera.

```sql
-- Funkcja do aktualizacji znacznika czasu 'updated_at'
CREATE OR REPLACE FUNCTION "public"."handle_updated_at"()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger wywoływany przy każdej aktualizacji wiersza w 'meal_plans'
CREATE TRIGGER "on_meal_plan_update"
BEFORE UPDATE ON "public"."meal_plans"
FOR EACH ROW
EXECUTE PROCEDURE "public"."handle_updated_at"();
```
