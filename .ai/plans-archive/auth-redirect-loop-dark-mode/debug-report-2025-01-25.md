# Technical Report: Auth Redirect Loop with Dark Mode Analysis

**Report Date**: 2025-01-25  
**Project**: Diet Planner MVP  
**Issue**: Auth Redirect Loop with Dark Mode  
**Status**: ✅ Resolved  
**Severity**: Critical

---

## Executive Summary

This report documents the investigation and resolution of a critical redirect loop issue that occurred when users attempted to access authentication pages (login, register) after logging out with dark mode enabled. The issue completely blocked access to the application for users who had set dark mode and logged out.

**Key Findings**:
- Root cause: ThemeProvider attempted to sync theme preferences to the API when user was not authenticated
- The sync triggered `getAuthHeaders()` which redirected to `/auth/login`, creating an infinite loop
- Fix: Added authentication checks before attempting API sync operations
- Impact: Critical - application was unusable for affected users

**Solution**: Added authentication guards in ThemeProvider to prevent API calls when user is not authenticated, while maintaining localStorage as the source of truth for UI theme.

---

## 1. Problem Statement

### 1.1 Symptom Description

After setting dark mode and logging out, the login form kept redirecting to itself in an infinite loop. The page kept refreshing continuously, making it impossible to access authentication pages. The same issue occurred with the "create account" link.

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
- Local Development (`localhost:3000`): ❌ Issue occurred
- Production: ❌ Issue occurred

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

## 2. Investigation Methodology

### 2.1 Debugging Approach

The investigation followed a systematic, multi-phase approach:

1. **Code Analysis**: Reviewed ThemeProvider, API clients, middleware, and login page code
2. **Root Cause Identification**: Traced the redirect loop through the call stack
3. **Fix Implementation**: Added authentication guards to prevent unauthenticated API calls
4. **Testing**: Verified fix works in all scenarios

### 2.2 Logging Strategy

No additional logging was required as the root cause was identified through code analysis. The issue was clear from the code structure and flow.

### 2.3 Verification Points

- ThemeProvider sync logic
- API client redirect behavior
- Middleware redirect logic
- Login page server-side redirect
- Authentication state checking

---

## 3. Root Cause Analysis

### 3.1 Root Cause

**The redirect loop is caused by ThemeProvider attempting to sync theme preferences to the API when the user is not authenticated.**

### 3.2 Why It Happens

ThemeProvider assumes user is authenticated when syncing localStorage to API, but doesn't verify this before making the API call.

### 3.3 Evidence

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

### 3.4 Technical Explanation

The issue occurs because:

1. **ThemeProvider sync logic** (`src/lib/theme/ThemeProvider.tsx` line 185): When localStorage theme differs from API theme, it calls `updateThemePreference()` to sync without checking authentication status.

2. **API client redirect behavior** (`src/lib/api/base.client.ts` line 8-18): `getAuthHeaders()` checks for auth token and redirects to `/auth/login` if no token exists. This redirect happens BEFORE throwing an error, so try-catch blocks can't prevent it.

3. **No authentication guard**: ThemeProvider doesn't verify if user is authenticated before attempting to sync theme preferences to the API.

---

## 4. Detailed Findings

### 4.1 Verified Working Components

- **Middleware** (`src/middleware/index.ts`): Correctly handles auth pages and doesn't cause redirect loops
- **Login Page** (`src/pages/auth/login.astro`): Server-side redirect only redirects if user is authenticated
- **API Client - getAllPreferences()** (`src/lib/api/user-preferences.client.ts`): Correctly handles unauthenticated users and returns defaults
- **getAuthToken()** (`src/lib/auth/get-auth-token.ts`): Safely checks auth status without redirecting

### 4.2 Verified Broken Component

**ThemeProvider** (`src/lib/theme/ThemeProvider.tsx`):
- Line 185: Calls `updateThemePreference()` without checking if user is authenticated
- Line 107: `setTheme()` function also calls `updateThemePreference()` without auth check
- Both locations trigger redirect loops when called on auth pages with unauthenticated users

### 4.3 Local vs Production Comparison

Issue occurred in both environments, confirming it's a code-level issue rather than environment-specific.

---

## 5. Solution Implementation

### 5.1 Solution Description

Added authentication checks using `getAuthToken()` before calling `updateThemePreference()` in both `fetchThemePreference()` and `setTheme()` functions. This prevents API calls when user is not authenticated, while maintaining localStorage as the source of truth for UI theme.

### 5.2 Changes Made

**File Modified**: `src/lib/theme/ThemeProvider.tsx`

**Changes**:

1. **Added import**:
   ```typescript
   import { getAuthToken } from "@/lib/auth/get-auth-token";
   ```

2. **Fixed `fetchThemePreference()` useEffect** (lines 185-195):
   ```typescript
   // Check if user is authenticated before attempting to sync
   const token = await getAuthToken();
   if (token) {
     // Sync localStorage to API in background (don't block UI)
     userPreferencesApi.updateThemePreference({ theme: currentLocalTheme }).catch(() => {
       // Silent fail - localStorage is source of truth
     });
   }
   // If not authenticated, skip API sync (localStorage is source of truth)
   ```

3. **Fixed `setTheme()` function** (lines 107-112):
   ```typescript
   // Only sync to API if user is authenticated (prevents redirect loops on auth pages)
   const token = await getAuthToken();
   if (token) {
     await userPreferencesApi.updateThemePreference({ theme: newTheme });
   }
   // If not authenticated, skip API sync (localStorage is source of truth)
   ```

### 5.3 Files Modified

- `src/lib/theme/ThemeProvider.tsx` - Added auth guards to prevent API calls when unauthenticated

### 5.4 Testing Performed

**Test Scenarios**:
- ✅ Logout with dark mode set → navigate to login page (no redirect loop)
- ✅ Logout with light mode set → navigate to login page (no redirect loop)
- ✅ Navigate to register page after logout (no redirect loop)
- ✅ Toggle theme on auth pages (works without redirects)
- ✅ Theme persists correctly in localStorage
- ✅ Theme syncs to API when user logs in (if localStorage differs from database)

**Results**: All test scenarios passed. User confirmed fix works correctly.

---

## 6. Verification

### 6.1 Local Testing

- All test scenarios passed
- No redirect loops occur on auth pages
- Theme functionality works correctly
- No regressions observed

### 6.2 Production Testing

- Fix ready for production deployment
- Same code changes apply to both environments

### 6.3 Regression Testing

- Theme toggle works correctly on authenticated pages
- Theme persists correctly after logout
- Theme syncs to API when user logs in
- No impact on other features

---

## 7. Lessons Learned

### 7.1 What Went Well

- Systematic code analysis quickly identified the root cause
- Clear understanding of the call stack and redirect flow
- Fix was straightforward once root cause was identified
- No additional logging was needed

### 7.2 What Could Be Improved

- Could have added authentication guards proactively during initial ThemeProvider implementation
- Could have added unit tests to catch this scenario
- Could have documented the assumption that API sync requires authentication

### 7.3 Prevention Strategies

1. **Code Review**: Always verify authentication status before making API calls that require auth
2. **Testing**: Add test cases for unauthenticated user scenarios
3. **Documentation**: Document assumptions about authentication requirements for API calls
4. **Type Safety**: Consider adding TypeScript types or guards to prevent unauthenticated API calls

---

## 8. Recommendations

### 8.1 Immediate Actions

- ✅ Fix implemented and tested
- ✅ Ready for production deployment

### 8.2 Short-Term Improvements

1. **Add Unit Tests**: Create tests for ThemeProvider that verify no API calls are made when user is not authenticated
2. **Code Review**: Review other components for similar unguarded API calls
3. **Documentation**: Document authentication requirements for API sync operations

### 8.3 Long-Term Improvements

1. **API Client Enhancement**: Consider adding a parameter to `getAuthHeaders()` to prevent redirects on auth pages (though current fix is sufficient)
2. **Theme Sync Strategy**: Consider implementing a queue system for theme sync that only processes when user is authenticated
3. **Error Handling**: Add more robust error handling for theme sync failures

---

## 9. Appendices

### Appendix A: Code Changes Summary

**File**: `src/lib/theme/ThemeProvider.tsx`

**Lines Modified**:
- Line 4: Added import for `getAuthToken`
- Lines 185-195: Added auth check in `fetchThemePreference()` useEffect
- Lines 107-112: Added auth check in `setTheme()` function

**Total Lines Changed**: ~15 lines

### Appendix B: Related Files

**Files Reviewed** (not modified):
- `src/lib/api/base.client.ts` - API client redirect logic
- `src/lib/api/user-preferences.client.ts` - Theme preference API
- `src/middleware/index.ts` - Authentication middleware
- `src/pages/auth/login.astro` - Login page
- `src/lib/auth/get-auth-token.ts` - Auth token retrieval

### Appendix C: Testing Checklist

- [x] Logout with dark mode → navigate to login (no loop)
- [x] Logout with light mode → navigate to login (no loop)
- [x] Navigate to register after logout (no loop)
- [x] Toggle theme on auth pages (works)
- [x] Theme persists in localStorage
- [x] Theme syncs to API on login
- [x] No regressions in other features

---

**Report Prepared By**: AI Agent  
**Review Status**: ✅ Complete  
**Resolution Confirmed**: 2025-01-25 by User



