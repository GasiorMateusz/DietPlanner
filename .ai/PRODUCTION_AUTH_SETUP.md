# Production Authentication Setup Guide

## Problem: Email Links Pointing to Localhost in Production

If email confirmation links or password reset links are pointing to `localhost` instead of your production URL, this is caused by:

1. **Missing `PUBLIC_APP_URL` environment variable** in production - The app uses `PUBLIC_APP_URL` for all auth redirect links. If not set, it may fall back to `window.location.origin` which could be incorrect.
2. **Supabase Dashboard configuration** - Even with `PUBLIC_APP_URL` set, Supabase validates redirect URLs against its allowed list.

## Solution

### Step 1: Set `PUBLIC_APP_URL` Environment Variable (REQUIRED)

**The app uses `PUBLIC_APP_URL` for all authentication redirect links.** This environment variable must be set in your production environment to your production domain.

#### For Cloudflare Pages:

1. Go to **Cloudflare Dashboard** → **Workers & Pages** → Your project → **Settings** → **Environment Variables**
2. Add a new environment variable:
   - **Variable name:** `PUBLIC_APP_URL`
   - **Value:** Your production URL (e.g., `https://yourdomain.com`) **without trailing slash**
   - **Environment:** Production (and Preview if needed)
3. **Save** and redeploy your application

#### For Other Hosting Providers:

Set the `PUBLIC_APP_URL` environment variable in your hosting provider's environment variable configuration to your production URL (e.g., `https://yourdomain.com`).

### Step 2: Configure Supabase Dashboard

Even if `PUBLIC_APP_URL` is set correctly, **Supabase validates redirect URLs** against its own configuration. You must configure the Supabase Dashboard:

1. **Log in to Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**
3. **Go to**: **Authentication** → **URL Configuration**
4. **Set Site URL**:
   - Change from `http://localhost:3000` (or any localhost URL) to your production URL
   - Example: `https://yourdomain.com`
   - **This is the base URL used by Supabase to construct email links if `emailRedirectTo` is not provided or is invalid**
5. **Add Redirect URLs**:
   - Click **"Add URL"** or edit the existing list
   - Add your production URLs (with paths):
     - `https://yourdomain.com/auth/login`
     - `https://yourdomain.com/auth/reset-password`
     - `https://yourdomain.com/auth/callback` (if using OAuth)
   - **Important**: Supabase will reject `emailRedirectTo` URLs that are not in this list
   - Keep localhost URLs only if you need them for local development
6. **Save changes**

### Step 3: Verify Configuration

After making changes:

1. **Clear browser cache** and test the registration/password reset flow
2. **Check browser console** for warnings/errors about redirect URLs
3. **Check the email** - the confirmation link should point to your production URL
4. **Verify the link works** - clicking it should redirect to your production site

## How It Works

1. **Build Process** (GitHub Actions):
   - `PUBLIC_APP_URL` is passed from GitHub Secrets to the build step
   - Astro/Vite embeds `PUBLIC_APP_URL` into the client bundle at build time
   - The value is baked into the JavaScript bundle, so it's available in the browser

2. **Client-side code** (`RegisterForm.tsx`, `ForgotPasswordForm.tsx`) calls `getAuthRedirectUrl()` which:
   - Uses `PUBLIC_APP_URL` from `import.meta.env.PUBLIC_APP_URL` (embedded at build time)
   - Falls back to `window.location.origin` only in development if not set
   - Validates the URL doesn't contain localhost in production
   - Logs the redirect URL to browser console for debugging

3. **Supabase Auth API** receives the `emailRedirectTo` parameter:
   - **Validates it against the Redirect URLs list in the Dashboard**
   - If the URL is not in the allowed list, Supabase may reject it or use the Site URL instead
   - If valid, uses it for the email link
   - If invalid or not provided, uses the **Site URL** from the Dashboard (this is why localhost might appear!)

4. **Email is sent** with the confirmation/reset link containing the redirect URL

**Critical**: Even if `PUBLIC_APP_URL` is set correctly, Supabase will ignore it if the URL is not in the allowed redirect URLs list in the Dashboard!

## Debugging

If links are still pointing to localhost after configuration:

1. **Check browser console** in production:
   - Look for: `🔗 Auth redirect URL: https://yourdomain.com/auth/login (using PUBLIC_APP_URL: https://yourdomain.com)`
   - Look for: `❌ PUBLIC_APP_URL is not set in production!`
   - Look for: `❌ PUBLIC_APP_URL is set to localhost`
   - This shows what URL is actually being sent to Supabase

2. **Check the debug endpoint**:
   - Visit: `https://yourdomain.com/api/debug-env`
   - Look for `publicAppUrl` - it should show your production URL, not "NOT SET" or localhost

3. **Verify GitHub Secrets**:
   - Go to GitHub → Settings → Secrets and variables → Actions → Environment secrets (production)
   - Verify `PUBLIC_APP_URL` has your production URL (e.g., `https://yourdomain.com`)
   - **NOT** `http://localhost:3000` or any localhost URL

4. **Verify Supabase Dashboard** (MOST IMPORTANT):
   - Go to Supabase Dashboard → Authentication → URL Configuration
   - Verify **Site URL** is set to your production URL (e.g., `https://yourdomain.com`)
   - Verify **Redirect URLs** includes:
     - `https://yourdomain.com/auth/login`
     - `https://yourdomain.com/auth/reset-password`
     - `https://yourdomain.com/auth/callback` (if using OAuth)
   - Remove any localhost URLs from the redirect URLs list (unless needed for local dev)

5. **Test the flow**:
   - Register a new account or request a password reset
   - Check the browser console to see what URL is being sent
   - Check the email - the link should point to your production URL

## Common Issues

### Issue: `PUBLIC_APP_URL` is set but links still point to localhost

**Cause**: Supabase Dashboard `Site URL` is still set to localhost, and the `emailRedirectTo` URL is being rejected (not in Redirect URLs list).

**Solution**: Update Supabase Dashboard configuration as described in Step 2.

### Issue: Environment variable is set in GitHub Actions but not in Cloudflare

**Cause**: Environment variables in GitHub Actions secrets are only used during build. Cloudflare Pages needs its own environment variables.

**Solution**: Set `PUBLIC_APP_URL` in Cloudflare Dashboard → Your project → Settings → Environment Variables.

### Issue: Links work in development but not in production

**Cause**: `PUBLIC_APP_URL` is not set in production, so the code falls back to `window.location.origin`. However, if Supabase Dashboard is configured for localhost, it might override this.

**Solution**: 
1. Set `PUBLIC_APP_URL` in production
2. Update Supabase Dashboard configuration for production

## Related Files

- `src/lib/utils/get-app-url.ts` - URL utility functions
- `src/components/auth/RegisterForm.tsx` - Registration form (uses `getAuthRedirectUrl`)
- `src/components/auth/ForgotPasswordForm.tsx` - Password reset form (uses `getAuthRedirectUrl`)
- `.github/workflows/master.yml` - GitHub Actions workflow (sets `PUBLIC_APP_URL` from secrets)
- `README.md` - General setup instructions

## Notes

- The local `supabase/config.toml` file is **only for local development**. It does not affect production Supabase Cloud projects.
- For Supabase Cloud projects, all configuration must be done in the Supabase Dashboard.
- For self-hosted Supabase, update the `site_url` in `supabase/config.toml` for production.

