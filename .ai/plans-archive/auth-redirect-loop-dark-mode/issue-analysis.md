# Issue Analysis: Auth Redirect Loop with Dark Mode

**Date**: 2025-01-25  
**Reported By**: User  
**Status**: ✅ Resolved  
**Environment**: Local Development, Production

---

## 1. Problem Statement

### 1.1 Symptom Description

After setting dark mode and logging out, the login form keeps redirecting to itself in an infinite loop. The page keeps refreshing continuously. The same issue occurs with the "create account" link. The problem appears to be related to dark mode functionality.

**Observed Behavior**:
- Login form initially works fine
- User sets dark mode
- User logs out
- Login page redirects to itself in a loop
- Page keeps refreshing too quickly to see errors
- Same issue occurs when navigating to register page
- Terminal logs show repeated requests: `[200] /auth/login` with `[TranslationProvider] Context value updated, language: en`

**Expected Behavior**:
- Login page should display normally without redirecting to itself
- Auth pages should be accessible without redirect loops
- Dark mode should not interfere with authentication flow

### 1.2 Environment Details

**Affected Environments**:
- Local Development (`localhost:3000`): ❌ Issue occurs
- Production: ❌ Issue occurs

**Technical Stack**:
- Framework: Astro 5
- Adapter: Node.js (local), Cloudflare (production)
- Runtime: Node.js / Cloudflare Workers
- Database: Supabase
- Build Tool: Astro Build System

### 1.3 Error Details

**Error Messages**:
- No error messages visible in console (page refreshes too quickly)
- No server-side errors logged
- Terminal shows repeated successful requests: `[200] /auth/login` with `[TranslationProvider] Context value updated, language: en`

**Console/Log Output**:
```
11:09:43 [307] / 4ms
11:09:43 [200] /auth/login 10ms
[TranslationProvider] Context value updated, language: en
11:09:45 [200] /auth/login 9ms
[TranslationProvider] Context value updated, language: en
... (repeated many times)
```

### 1.4 Impact Assessment

**User Impact**: Critical - Users cannot access authentication pages (login, register) after logging out with dark mode enabled. This completely blocks access to the application.

**Business Impact**: Critical - Application is unusable for users who have set dark mode and logged out. This affects all users who use dark mode.

**Affected Features**:
- Login page (`/auth/login`)
- Register page (`/auth/register`)
- Any navigation to auth pages after logout with dark mode set

---

## 2. Initial Investigation

### 2.1 Timeline

- **First Occurrence**: Issue has persisted since the beginning of the project
- **Last Known Good State**: Unknown - issue has been partially solved multiple times but not fully resolved
- **Recent Changes**: Unknown - user cannot recall specific changes that triggered this occurrence
- **Related Issues**: May have occurred when account was removed (user cannot recall if dark mode was set during account removal)

### 2.2 Reproduction Steps

1. User logs into the application
2. User sets dark mode (via theme toggle)
3. User logs out
4. User is redirected to home page (`/`)
5. User navigates to login page (`/auth/login`)
6. **Issue**: Login page immediately redirects to itself in a loop
7. Same issue occurs when navigating to register page (`/auth/register`)

### 2.3 Affected Components

Based on initial analysis, the following components may be involved:

- `src/lib/theme/ThemeProvider.tsx` - Theme management and API sync
- `src/lib/api/user-preferences.client.ts` - Theme preference API calls
- `src/lib/api/base.client.ts` - Authentication header handling (redirects on 401)
- `src/middleware/index.ts` - Authentication middleware redirects
- `src/pages/auth/login.astro` - Login page server-side redirect
- `src/components/AppWithTranslations.tsx` - Wraps all pages with ThemeProvider
- `src/layouts/Layout.astro` - Public layout that includes AppWithTranslations

---

## 3. Root Cause Hypothesis

### 3.1 Initial Hypothesis

**Primary Hypothesis**: The `ThemeProvider` component is attempting to sync theme preferences to the API when the user is not authenticated, causing a redirect loop.

**Theory**:
1. User sets dark mode (stored in localStorage and database)
2. User logs out (session cleared, but localStorage still has "dark" theme)
3. User navigates to `/auth/login`
4. `ThemeProvider` mounts and calls `fetchThemePreference()` in `useEffect`
5. `fetchThemePreference()` calls `userPreferencesApi.getThemePreference()`
6. If localStorage theme differs from API response (or API fails), ThemeProvider tries to sync
7. Sync calls `userPreferencesApi.updateThemePreference()` which calls `updatePreferences()`
8. `updatePreferences()` calls `getAuthHeaders()` from `base.client.ts`
9. `getAuthHeaders()` checks for auth token, finds none, and redirects to `/auth/login`
10. This causes an infinite redirect loop

**Secondary Hypothesis**: The middleware or login page server-side redirect logic may be incorrectly detecting an authenticated user when dark mode is set, causing redirect loops.

### 3.2 Areas to Investigate

1. **ThemeProvider API Sync Logic** (`src/lib/theme/ThemeProvider.tsx`):
   - Check if `updateThemePreference()` is called when user is not authenticated
   - Verify if API sync is guarded for unauthenticated users
   - Check if localStorage sync triggers API calls unnecessarily

2. **API Client Redirect Logic** (`src/lib/api/base.client.ts`):
   - Verify `getAuthHeaders()` redirect behavior
   - Check if redirect happens during theme preference updates
   - Ensure redirects don't occur on auth pages

3. **Middleware Redirect Logic** (`src/middleware/index.ts`):
   - Verify auth page redirect conditions
   - Check if dark mode or localStorage affects session detection
   - Ensure redirect logic doesn't conflict with theme provider

4. **Login Page Server-Side Redirect** (`src/pages/auth/login.astro`):
   - Verify server-side redirect conditions
   - Check if it conflicts with client-side redirects

5. **Theme Storage and Sync**:
   - Check localStorage vs database sync behavior
   - Verify theme persistence after logout
   - Check if theme changes trigger unnecessary API calls

### 3.3 Related Issues

- Issue has been partially solved multiple times but not fully resolved
- May be related to account removal flow (if dark mode was set during removal)
- Similar redirect loop issues may have occurred in the past

---

## 4. Investigation Plan

### 4.1 Verification Steps

- [ ] Verify ThemeProvider doesn't call updateThemePreference when user is not authenticated
- [ ] Check if getAuthHeaders redirects occur during theme sync
- [ ] Verify middleware redirect logic doesn't conflict with theme provider
- [ ] Check localStorage theme persistence after logout
- [ ] Verify API sync logic guards for unauthenticated users
- [ ] Test theme toggle behavior on auth pages
- [ ] Check if theme changes trigger redirects

### 4.2 Debugging Strategy

1. **Add Logging**: Add comprehensive logging to ThemeProvider, API clients, and middleware to trace the redirect loop
2. **Test Scenarios**: Test various scenarios (logout with light mode, logout with dark mode, theme change on auth pages)
3. **Code Review**: Review ThemeProvider sync logic and API client redirect logic
4. **Fix Implementation**: Implement guards to prevent API calls when user is not authenticated

### 4.3 Logging Plan

Add debug logs to:
- ThemeProvider: Theme sync attempts, API calls, localStorage operations
- API clients: Auth header checks, redirect triggers
- Middleware: Redirect decisions, session checks
- Login page: Server-side redirect conditions

---

## 5. Root Cause Analysis

### 5.1 Root Cause Identified

**Root Cause**: ThemeProvider attempts to sync theme preferences to the API when the user is not authenticated, causing a redirect loop.

**Exact Sequence**:
1. User sets dark mode (stored in localStorage and database)
2. User logs out (session cleared, but localStorage still has "dark" theme)
3. User navigates to `/auth/login`
4. `ThemeProvider` mounts and runs `fetchThemePreference()` useEffect (line 163)
5. `getThemePreference()` is called, which calls `getAllPreferences()` 
6. `getAllPreferences()` correctly handles unauthenticated users and returns defaults: `{ theme: "light" }`
7. localStorage has "dark" but API returns "light" (default)
8. ThemeProvider detects mismatch and attempts to sync (line 185)
9. Calls `updateThemePreference({ theme: "dark" })` without checking if user is authenticated
10. `updateThemePreference()` → `updatePreferences()` → `getAuthHeaders()`
11. `getAuthHeaders()` finds no token and redirects to `/auth/login` (line 11)
12. This causes an infinite redirect loop

**Why it happens**: ThemeProvider assumes user is authenticated when syncing localStorage to API, but doesn't verify this before making the API call.

### 5.2 Solution Implemented

**Fix**: Added authentication checks using `getAuthToken()` before calling `updateThemePreference()` in both `fetchThemePreference()` and `setTheme()` functions.

**Files Modified**:
- `src/lib/theme/ThemeProvider.tsx` - Added auth guards to prevent API calls when unauthenticated

**Changes**:
1. Added import: `import { getAuthToken } from "@/lib/auth/get-auth-token";`
2. In `fetchThemePreference()` useEffect: Check `await getAuthToken()` before syncing to API
3. In `setTheme()` function: Check `await getAuthToken()` before syncing to API

**Result**: Theme sync only occurs when user is authenticated, preventing redirect loops on auth pages.

---

## 6. Resolution

**Status**: ✅ Resolved  
**Resolution Date**: 2025-01-25  
**Verified By**: User  
**Testing**: All scenarios tested and confirmed working

---

**Analysis Created**: 2025-01-25  
**Resolution Confirmed**: 2025-01-25

