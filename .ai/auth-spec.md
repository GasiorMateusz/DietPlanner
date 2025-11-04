Diet Planner – Authentication Module Architecture (US-001 – US-004)

Scope: Registration, Login, Logout, Password Recovery, Account Management (change password, delete account) built on Supabase Auth, Astro 5 SSR, React 19, Tailwind 4, shadcn/ui, Zod.

Compatibility: This design preserves existing pages and API behavior. Meal plan APIs remain unchanged until the phased migration toggles are enabled. No breaking UI changes to `app/*` routes; auth is introduced in parallel and can be rolled out in phases.

Tech Stack Reference: Astro 5 (server output with Node adapter), React 19, TypeScript 5, Tailwind 4, shadcn/ui, Zod, Supabase Auth.

1. USER INTERFACE ARCHITECTURE

1.1 New and updated routes/pages

- Public (non-auth) pages (Layout: `src/layouts/Layout.astro`):
  - `src/pages/auth/login.astro`: Login screen
  - `src/pages/auth/register.astro`: Registration screen (with T&C checkbox)
  - `src/pages/auth/forgot-password.astro`: Request reset link
  - `src/pages/auth/reset-password.astro`: Set new password after magic-link (recovery)

- Private (auth) pages (Layout: `src/layouts/PrivateLayout.astro`):
  - `src/pages/app/account.astro`: My Account – change password, delete account
  - Existing: `src/pages/app/dashboard.astro`, `src/pages/app/create.astro`, `src/pages/app/editor*.astro` remain private

    1.2 Components (React – interactivity; shadcn/ui primitives)

- Forms:
  - `src/components/auth/LoginForm.tsx` (email, password)
  - `src/components/auth/RegisterForm.tsx` (email, password, confirmPassword, termsAccepted)
  - `src/components/auth/ForgotPasswordForm.tsx` (email)
  - `src/components/auth/ResetPasswordForm.tsx` (newPassword, confirmPassword)
  - `src/components/auth/AccountSettings.tsx` (oldPassword, newPassword, confirmNewPassword, danger zone for delete)

- UI primitives reused: `src/components/ui/{input,label,button,alert,dialog}`. Existing `DeleteConfirmationDialog.tsx` is reused from `components` for the account delete confirmation flow.

- Header integration:
  - Extend `src/components/DashboardHeader.tsx` consumers or parent layout areas to include a user menu with “My Account” and “Logout”. Keep `DashboardHeader` focused on search/create; add a separate user menu component:
    - `src/components/auth/UserMenu.tsx` (shows email initial/avatar, links to /app/account, Logout action)

    1.3 Astro pages vs React components – separation of concerns

- Astro pages:
  - Provide SSR shells, SEO metadata, and route-level guards/redirects.
  - Public auth pages use `Layout.astro`; private pages use `PrivateLayout.astro`.
  - On server: attempt to detect session (see 3.4). If a user is already authenticated, redirect away from auth pages to `/app/dashboard`. If unauthenticated on `/app/*`, redirect to `/auth/login` (once SSR guards are enabled in middleware).

- React forms/components:
  - Handle input state, client-side validation (Zod), supabase-js calls (signUp, signInWithPassword, resetPasswordForEmail, updateUser), success/error messaging, and navigation (via `window.location.assign` for full page transitions).
  - For API calls that must be server-authenticated (delete account), include `Authorization: Bearer <JWT>` header using `src/lib/auth/get-auth-token.ts`.

    1.4 Client-side validation and error messages

- Validation schemas (Zod) in `src/lib/validation/auth.schemas.ts`:
  - Email: required, valid email format.
  - Password: required, min 8 chars, must include at least one letter and one number (configurable), error: “Password must be at least 8 characters and include letters and numbers.”
  - Confirm password: must match password, error: “Passwords do not match.”
  - Terms checkbox: required, error: “You must accept the terms to continue.”

- Login errors:
  - Invalid credentials: “Invalid email or password.” (generic)
  - Rate limiting/unknown errors: “Unable to log in right now. Please try again later.”

- Registration errors:
  - Email already registered: “An account with this email already exists.”
  - Weak password: “Password does not meet security requirements.”

- Forgot password:
  - Success: “If an account exists for this email, we sent a password reset link.” (privacy-preserving)
  - Invalid/unknown: same generic success message; log details to console/server.

- Reset password:
  - Missing/expired link: “Reset link is invalid or expired. Request a new link.”
  - Success: “Password updated. You can now log in.” (or auto-redirect to dashboard if a session exists)

- Account settings:
  - Change password requires oldPassword, newPassword, confirmNewPassword. Client re-authenticates with oldPassword, then updates password. Errors:
    - Old password invalid: “Current password is incorrect.”
    - New password invalid: “New password does not meet security requirements.”
  - Delete account confirmation dialog explains irreversibility; success navigates to `/` with logout.

    1.5 Key scenarios & flows

- Registration (US-001):
  - User completes form; on submit, Zod validates; `supabase.auth.signUp({ email, password })` is called.
  - Terms checkbox must be checked. For MVP, email confirmation is disabled to satisfy PRD US-001 auto-login; Supabase returns a session and the user is redirected to `/app/dashboard`.
  - If email confirmation is enabled in a later phase, show a confirmation message and redirect to login upon confirmation.

- Login (US-002):
  - User submits email/password; on success, redirect `/app/dashboard`.
  - On failure, show “Invalid email or password.”

- Forgot password (US-003 – request):
  - User enters email; `supabase.auth.resetPasswordForEmail(email, { redirectTo: <APP_URL>/auth/reset-password })`.
  - Show generic success message regardless of existence.

- Reset password (US-003 – set new):
  - On landing, Supabase provides a recovery session. The page renders `ResetPasswordForm`; upon submit, call `supabase.auth.updateUser({ password })`; then redirect to login or dashboard per session state.

- My Account (US-004):
  - Change password: verify `oldPassword` via `supabase.auth.signInWithPassword({ email, password: oldPassword })` (reauth), then `supabase.auth.updateUser({ password: newPassword })`.
  - Delete account: call `DELETE /api/account` with `Authorization` header; on success also call `supabase.auth.signOut()`; redirect to `/`.

2. BACKEND LOGIC

2.1 API surface (Astro server endpoints in `src/pages/api`)

- New endpoints:
  - `GET /api/auth/session` (optional helper): returns `{ userId, email }` when `Authorization: Bearer <JWT>` present; 401 otherwise. Useful for client to confirm server-visible auth state.
  - `DELETE /api/account`: server-side deletion of user-owned data and auth user. Authn via `Authorization: Bearer <JWT>`.

- Existing meal plan endpoints:
  - Phase 1: unchanged (placeholder user).
  - Phase 2: switch to authenticated mode: extract `Authorization` header and resolve `userId` via Supabase (see 2.3). Replace placeholder `userId` with the authenticated user ID. This preserves DTOs and behavior while enforcing real auth.

    2.2 DTOs/contracts

- AuthSessionResponse (200): `{ userId: string; email: string }`
- Error response: `{ error: string; details?: unknown }`
- AccountDeleteResponse (200): `{ success: true }` (204 is acceptable as well)

  2.3 Authentication extraction in API routes

- All authenticated endpoints accept `Authorization: Bearer <JWT>`.
- Implement a small helper (spec only): `src/lib/auth/session.service.ts`
  - `getUserFromRequest(request: Request, supabase: SupabaseClient): Promise<{ id: string; email: string }>`
  - Reads `Authorization` header, parses JWT, invokes `supabase.auth.getUser(token)` to validate and return user.
  - Throws `ValidationError` (missing/invalid header) or returns 401 response. Uses existing `ValidationError` and `DatabaseError` patterns.

    2.4 Input validation

- Use Zod on all new endpoints. Add `src/lib/validation/auth.schemas.ts` with:
  - `changePasswordSchema` (if adding server endpoint; client-only by default)
  - Shared email/password schemas for reuse in React forms as well

    2.5 Exception handling

- Reuse `src/lib/errors.ts` classes. Map to HTTP codes:
  - ValidationError → 400
  - NotFoundError → 404 (not typical for auth, but consistent if needed)
  - DatabaseError/unknown → 500
  - Missing/invalid token → 401 with `{ error: 'Unauthorized' }`

    2.6 Server-side rendering updates

- Astro is configured for server output with Node adapter (`astro.config.mjs`). SSR-friendly guards will be enabled in two places:
  - Middleware: `src/middleware/index.ts` will check authentication for `/app/*` and redirect to `/auth/login` when no session detected.
  - Public auth pages: on server, if a session exists, redirect `/app/dashboard`.

- Session detection on server requires extracting the access token:
  - Preferred: adopt `@supabase/ssr` to persist auth into cookies and read them in middleware/pages. Alternatively, read a custom `sb-access-token` cookie if present.
  - Interim (Phase 1): keep middleware redirect OFF; rely on client-side redirects and API-level auth checks. No SSR breakage.

3. AUTHENTICATION SYSTEM (Supabase Auth + Astro)

3.1 Registration

- Client: `supabase.auth.signUp({ email, password })` in `RegisterForm.tsx`.
- Terms checkbox enforced client-side by Zod.
- Post-signup behavior:
  - MVP policy: Email confirmation is disabled to ensure immediate session and auto-redirect to `/app/dashboard` per PRD US-001.
  - If confirmation is enabled in a future phase, show a message and redirect to login upon confirmation.

    3.2 Login/Logout

- Client: `supabase.auth.signInWithPassword({ email, password })` in `LoginForm.tsx`.
- Logout: `supabase.auth.signOut()` from `UserMenu.tsx`. Also clear app client-side state.

  3.3 Password recovery

- Request: `ForgotPasswordForm.tsx` calls `supabase.auth.resetPasswordForEmail(email, { redirectTo: <APP_URL>/auth/reset-password })`.
- Recovery landing: `ResetPasswordForm.tsx` calls `supabase.auth.updateUser({ password })` after Supabase issues a temporary recovery session from the magic link.

  3.4 Session in API calls

- Client attaches `Authorization: Bearer <JWT>` on fetch to our API endpoints using `getAuthToken()` from `src/lib/auth/get-auth-token.ts`.
- Server validates token with `supabase.auth.getUser(token)` and derives `userId`.

  3.5 Account management

- Change password (client): reauthenticate with `supabase.auth.signInWithPassword` using oldPassword; then `supabase.auth.updateUser({ password: newPassword })`.
- Delete account (server): `DELETE /api/account` performs:
  1. Verify user from `Authorization` header.
  2. Delete all user-owned data by `user_id`: `ai_chat_sessions` and `meal_plans`.
  3. Delete auth user via Supabase Admin API (service role key, server-only).
  4. Return 200/204; client then signs out and navigates to `/`.

  3.6 Supabase clients

- Public client: existing `src/db/supabase.client.ts` remains for browser usage.
- Admin client (server-only, spec only): `src/db/supabase.admin.ts` creates a Supabase client with `SUPABASE_SERVICE_ROLE_KEY` (never exposed client-side). Used only in API routes (e.g., account deletion).

4. FILES AND MODULES TO ADD/EXTEND (no implementation in this spec)

4.1 New pages

- `src/pages/auth/login.astro`
- `src/pages/auth/register.astro`
- `src/pages/auth/forgot-password.astro`
- `src/pages/auth/reset-password.astro`
- `src/pages/app/account.astro`

  4.2 New components

- `src/components/auth/LoginForm.tsx`
- `src/components/auth/RegisterForm.tsx`
- `src/components/auth/ForgotPasswordForm.tsx`
- `src/components/auth/ResetPasswordForm.tsx`
- `src/components/auth/AccountSettings.tsx`
- `src/components/auth/UserMenu.tsx`

  4.3 New validation schemas

- `src/lib/validation/auth.schemas.ts` (exports reusable Zod schemas for email, password, register, login, reset, change-password)

  4.4 New services/helpers

- `src/lib/auth/session.service.ts`: extract user from `Authorization` header; throws 401 on failure.
- `src/db/supabase.admin.ts`: server-only admin client using `SUPABASE_SERVICE_ROLE_KEY`.

  4.5 New/updated API routes

- Add: `src/pages/api/auth/session.ts` (optional helper).
- Add: `src/pages/api/account/index.ts` with `DELETE` handler for cascading deletion of `ai_chat_sessions` and `meal_plans`, then removal of the auth user.
- Update later (Phase 2): `src/pages/api/meal-plans/*` to replace placeholder user with authenticated user resolved from `Authorization` header.

  4.6 Middleware update (Phase 3)

- `src/middleware/index.ts`: enable redirect for `/app/*` when unauthenticated; attach `locals.supabase` as today. If using `@supabase/ssr`, read and verify tokens from cookies to avoid relying on headers.

5. VALIDATION AND ERROR-HANDLING GUIDELINES (consistency with project rules)

- Prefer early returns and guard clauses in handlers and components.
- Log server errors with minimal sensitive data. Client messages should be user-friendly.
- Map known errors (invalid credentials, expired links) to clear messages; otherwise show a generic failure.
- Use Zod in both client and server for consistent validation and messages.

6. ROLLOUT PLAN (non-breaking)

- Phase 1 – Add auth UI and server endpoint for account deletion:
  - Ship all new pages/components/services. Keep middleware auth redirect disabled. Keep meal-plan APIs with placeholder user.

- Phase 2 – API auth enablement:
  - Require `Authorization` header in meal plan API; remove placeholder user; use `session.service.ts` to resolve `userId`. Update frontend fetches to include token using `getAuthToken()` (already available).
  - Required before PRD US-005/US-006/US-007 (Dashboard list/search/delete) are considered complete, to ensure user-specific data isolation.

- Phase 3 – SSR guards:
  - Enable middleware redirect for `/app/*` to `/auth/login`. Optionally adopt `@supabase/ssr` to persist auth cookies, enabling reliable SSR session detection in both middleware and auth pages for redirect-in when already authenticated.

7. ACCEPTANCE CRITERIA TRACEABILITY

- US-001 Registration: Register page, Zod validation, terms checkbox, duplicate email error, post-registration redirect.
- US-002 Login: Login page, invalid credentials error, redirect to dashboard, link to forgot password.
- US-003 Password reset: Forgot password request flow; reset form via recovery link; unique time-limited link handled by Supabase.
- US-004 Account management: Account page with change password (old/new/confirm); delete account with confirmation modal; server cascade delete and auth user removal.
  - Dependencies: PRD US-005/US-006/US-007 rely on Phase 2 (API auth enabled) so that meal plans are scoped to the authenticated user.

8. ENVIRONMENT VARIABLES

- `SUPABASE_URL` (already used)
- `SUPABASE_KEY` (anon key, already used)
- `SUPABASE_SERVICE_ROLE_KEY` (server-only; required for account deletion)
- `PUBLIC_APP_URL` (optional; used for `redirectTo` during reset flow)

9. NAVIGATION AND UX NOTES

- Public landing (`/`) remains unchanged. If authenticated and landing is visited, optionally redirect to `/app/dashboard`.
- Auth pages keep minimal layout; consistent spacing and accessibility via shadcn/ui primitives.
- Ensure focus management and ARIA attributes on forms and dialogs.

10. SECURITY NOTES

- Never expose the service role key to the client. Use it only in server endpoints.
- Prefer generic messages for authentication failures to avoid user enumeration.
- Always validate and sanitize inputs with Zod before calling Supabase.
- Attach `Authorization` header for authenticated API calls; do not rely on client-provided user IDs.

11. OPEN QUESTIONS / ASSUMPTIONS

- Email confirmation policy: Resolved for MVP — disabled to meet PRD US-001 auto-login (immediate session and redirect to `/app/dashboard`).
- SSR session persistence: Recommended via `@supabase/ssr`; not required for MVP. SSR guards will be enabled in Phase 3.
- Account deletion scope: Includes both `ai_chat_sessions` and `meal_plans` prior to removing the auth user.

Appendix: File Map Summary

- Pages: `src/pages/auth/{login,register,forgot-password,reset-password}.astro`, `src/pages/app/account.astro`
- Components: `src/components/auth/{LoginForm,RegisterForm,ForgotPasswordForm,ResetPasswordForm,AccountSettings,UserMenu}.tsx`
- Validation: `src/lib/validation/auth.schemas.ts`
- Services: `src/lib/auth/session.service.ts`
- API: `src/pages/api/auth/session.ts`, `src/pages/api/account/index.ts`
- Middleware: update `src/middleware/index.ts`
