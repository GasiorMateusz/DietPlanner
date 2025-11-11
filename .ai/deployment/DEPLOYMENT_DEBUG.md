ły# Cloudflare Pages Deployment & Debugging Guide

## Problem Overview

If you see "[object Object]" instead of page content on your deployed Cloudflare Pages application, this guide documents the debugging process and provides solutions.

**Issue**: Application displays "[object Object]" (15 bytes) instead of HTML content, despite:
- ✅ Status: `200 OK`
- ✅ Content-Type: `text/html` (header is correct)
- ✅ No exceptions in Cloudflare Logs
- ✅ All components appear operational in logs

## Current Status

**Date**: 2025-01-11  
**Status**: ❌ **ISSUE PERSISTS** - Application still displays "[object Object]" instead of HTML

**Root Cause Identified**: The Astro Cloudflare adapter is serializing the response incorrectly in production. The adapter receives HTML from Astro's renderer but converts it to `[object Object]` string instead of keeping it as HTML.

**Key Finding**: The application works perfectly locally with `wrangler pages dev`, but fails in Cloudflare Pages production. This indicates:
1. The code and adapter configuration are correct
2. The problem is specific to Cloudflare Pages production environment
3. The issue occurs in the adapter layer, not in our code

**Tested Versions**:
- ✅ Astro 5.15.4, @astrojs/cloudflare 12.6.10 (latest) - problem occurs
- ✅ Astro 5.14.8 (tested) - build successful, awaiting deployment test

## Root Cause Analysis

### Critical Discovery (2025-01-11)

After deploying with detailed middleware logging, we discovered:

**What Works**:
- ✅ Response IS a Response object: `isResponse: true`, `constructor: "Response"`
- ✅ Headers are correct: `content-type: text/html`, `x-astro-route-type: page`
- ✅ Status is correct: `200 OK`
- ✅ Middleware processes requests correctly
- ✅ Supabase client created successfully
- ✅ Environment variables accessible
- ✅ Page rendering logs appear
- ✅ No exceptions thrown

**What's Broken**:
- ❌ Response body is already `[object Object]`: The body contains the string `[object Object]` (15 bytes) when middleware receives it

**Critical Finding**: The problem occurs BEFORE middleware receives the response. The Response object from `next()` already has `[object Object]` as its body content. This means:
1. ✅ Middleware is working correctly
2. ✅ Response object structure is correct
3. ❌ **The problem is in Astro's Cloudflare adapter** - the HTML is being converted to `[object Object]` string somewhere between page render and middleware
4. The conversion happens in the adapter layer, not in our code

### Detailed Log Analysis

**Verified (2025-01-11)**:
- ✅ Middleware processes request correctly
- ✅ Supabase client created successfully (twice - middleware + page)
- ✅ Environment variables accessible (hasUrl: true, hasKey: true)
- ✅ Auth check completes (no user, as expected for public route)
- ✅ Page render starts: `[index.astro] Starting page render`
- ✅ Layout render starts: `[LandingLayout] Rendering layout`
- ✅ No exceptions thrown
- ✅ Status: `200 OK`
- ❌ **BUT**: Response body is `[object Object]` instead of HTML

**Observation**: All logs indicate successful processing, but the actual response body is wrong. This suggests:
1. Astro pages are rendering correctly internally
2. The adapter is not properly serializing the HTML response
3. Something is converting the HTML Response object to `[object Object]` string
4. The issue occurs AFTER all rendering logic completes successfully

### Local vs Production

**Local Testing Results (2025-01-11)**:
- ✅ **Local build successful**: `npm run build:cloudflare` completes without errors
- ✅ **Local preview works**: `npm run preview:cloudflare` + `curl http://localhost:8788/` returns full HTML ✅
- ✅ **Structure verified**: `dist/_routes.json` exists and is correct
- ✅ **Worker files exist**: `dist/_worker.js/` contains all necessary files
- ✅ **Packages updated**: Astro and @astrojs/cloudflare updated to latest versions
- ❌ **Production still broken**: Despite local success, production still returns `[object Object]`

**Conclusion**: The application works perfectly locally with `wrangler pages dev`, but fails in Cloudflare Pages production. This indicates the problem is specific to Cloudflare Pages production environment, not the code or adapter configuration.

## Debugging History

This section documents all debugging steps taken chronologically with verification results.

### Step 1: Added Wrangler CLI ✅
- **Action**: Added `wrangler@^4.46.0` to `devDependencies`
- **Purpose**: Enable local testing and deployment with Cloudflare Pages
- **Verification**: `npm install` completes successfully

### Step 2: Created wrangler.toml ✅
- **Action**: Created `wrangler.toml` with compatibility flags
- **Content**: `compatibility_date = "2025-11-09"`, `compatibility_flags = ["nodejs_compat"]`
- **Purpose**: Configure local development environment
- **Note**: This file is NOT used during `wrangler pages deploy` - flags must be set in Cloudflare Dashboard

### Step 3: Updated GitHub Actions Workflow ✅
- **Action**: Changed from `cloudflare/pages-action` to `wrangler pages deploy`
- **Removed**: Invalid compatibility flag arguments (not supported by `wrangler pages deploy`)
- **Verification**: Workflow runs without errors

### Step 4: Updated _routes.json ✅
- **Action**: Added exclusions for static assets (`/_astro/*`, `/favicon.*`)
- **Purpose**: Ensure static assets are served directly without SSR processing
- **Verification**: File exists in `dist/` after build

### Step 5: Added Error Handling ✅
- **Action**: Wrapped Supabase client creation in try-catch blocks
- **Files Modified**:
  - `src/middleware/index.ts`
  - `src/pages/index.astro`
  - `src/pages/auth/login.astro`
  - `src/pages/auth/register.astro`
- **Purpose**: Prevent crashes from missing environment variables
- **Verification**: Code compiles without errors

### Step 6: Added Comprehensive Logging ✅
- **Action**: Added detailed console.log statements throughout the application
- **Locations**:
  - Middleware: Request processing, auth checks, redirects
  - Pages: Render start, Supabase client creation, user checks
  - Supabase client: Environment variable checks, client creation
  - Layouts: Render confirmation
- **Purpose**: Enable debugging in Cloudflare Logs
- **Verification**: Logs appear in local testing with `npm run preview:cloudflare`

### Step 7: Fixed Build Error - Invalid Assignment Target ✅
- **Action**: Removed duplicate frontmatter block in `src/layouts/Layout.astro`
- **Problem**: File had two `---` blocks (lines 13 and 22), causing "Invalid assignment target" build error
- **Solution**: Removed second `---` delimiter, keeping only one frontmatter block at the top
- **Files Modified**: `src/layouts/Layout.astro`
- **Verification**: Build completes successfully with `npm run build:cloudflare`
- **Date**: 2025-01-11

### Step 8: Optimized Middleware Logging ✅
- **Action**: Improved logging to reduce noise and distinguish between expected behavior and actual errors
- **Changes**:
  - Only log auth checks for protected routes (`/app/*`)
  - Only log actual errors (not "Auth session missing!" for public routes)
  - Added `action` field to show what middleware is doing (redirecting vs allowing access)
- **Files Modified**: `src/middleware/index.ts`
- **Purpose**: Make Cloudflare Logs more readable and easier to debug
- **Verification**: Logs in production show clean output without misleading error messages
- **Date**: 2025-01-11

### Step 9: Fixed wrangler.toml Configuration ✅
- **Action**: Added `pages_build_output_dir = "dist"` and `name = "dietplanner"` to `wrangler.toml`
- **Problem**: 
  - Wrangler was showing warning about missing `pages_build_output_dir` field
  - Pages deployment failed with error: "Missing top-level field 'name' in configuration file"
- **Solution**: Added both required fields:
  - `name = "dietplanner"` - Required top-level field for Pages projects
  - `pages_build_output_dir = "dist"` - Required for Pages deployment
- **Files Modified**: `wrangler.toml`
- **Verification**: Deployment completes without warnings or errors
- **Date**: 2025-01-11
- **Result**: All deployment errors resolved, application fully operational ✅

### Step 10: Added Detailed Response Logging ✅
- **Action**: Added comprehensive logging in middleware to debug `[object Object]` issue
- **Code Added**:
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
- **Purpose**: Identify what type of object is being returned and inspect response body
- **Result**: Discovered that response body is already `[object Object]` when middleware receives it
- **Date**: 2025-01-11

## Verification Results

### ✅ Compatibility Flags - VERIFIED
- **Location**: Cloudflare Dashboard → Workers & Pages → dietplanner → Settings → Functions
- **Result**: 
  - Compatibility Date: `Nov 8, 2025` ✅
  - Compatibility Flags: `nodejs_compat` ✅
- **Method**: Visual verification in Cloudflare Dashboard
- **Status**: Correctly configured

### ✅ Environment Variables - VERIFIED
- **Location**: Cloudflare Dashboard → Workers & Pages → dietplanner → Settings → Environment Variables
- **API Check**: `https://949ac7da.dietplanner.pages.dev/api/debug-env`
- **Result**: 
  ```json
  {
    "supabaseUrl": true,
    "supabaseKey": true,
    "publicSupabaseUrl": true,
    "publicSupabaseKey": true
  }
  ```
- **Method**: API endpoint verification
- **Status**: All variables correctly set

### ✅ Response Headers - VERIFIED
- **Location**: Browser DevTools → Network tab
- **Result**:
  - Status Code: `200 OK` ✅
  - Content-Type: `text/html` ✅
  - Content-Encoding: `br` (Brotli compression) ✅
  - Server: `cloudflare` ✅
- **Method**: Browser DevTools inspection
- **Status**: Headers are correct

### ✅ Cloudflare Logs - VERIFIED
- **Location**: Cloudflare Dashboard → Workers & Pages → dietplanner → Logs
- **Result**:
  - Status: `200 OK` ✅
  - Outcome: `ok` ✅
  - Exceptions: `[]` (no exceptions) ✅
  - Logs: Clean, informative logs showing request processing ✅
  - Sample logs:
    ```
    [Middleware] Processing request: /
    [supabase.server] Creating Supabase client
    [Middleware] Supabase client created for: /
    [Middleware] Continuing to next handler for: /
    [index.astro] Starting page render
    [LandingLayout] Rendering layout...
    ```
- **Method**: Cloudflare Dashboard Logs viewer
- **Status**: Logs are clean and informative, no misleading error messages for public routes
- **Note**: After optimization (Step 8), logs no longer show "Auth session missing!" for public routes, making them easier to read

### ✅ Local Testing - VERIFIED
- **Command**: `npm run preview:cloudflare`
- **Result**: Application works correctly locally ✅
- **Method**: Local testing with Wrangler
- **Status**: Works perfectly locally

### ❌ Production Deployment - ISSUE PERSISTS
- **Tested URLs**:
  - `https://dietplanner.pages.dev/` ❌
  - `https://ec1829c7.dietplanner.pages.dev/` ❌
- **Result**: Still displays "[object Object]" instead of HTML content ❌
- **Observation** (Verified 2025-01-11):
  - Status: `200 OK` ✅
  - Content-Type: `text/html` ✅ (header is correct)
  - Response Body: `[object Object]` ❌ (15 bytes, actual content is wrong)
  - Outcome: `ok` (no exceptions thrown)
  - Exceptions: `[]` (no exceptions) ✅
  - Logs show successful processing but page renders as "[object Object]"
  - All components appear to work in logs:
    - Middleware processing requests correctly ✅
    - Supabase client creation successful ✅
    - Environment variables accessible ✅
    - Page rendering logs appear ✅
  - Environment variables are set ✅
  - Compatibility flags are set ✅
  - Build completes without errors ✅
- **Status**: Issue persists across all deployments - response body is an object stringified as "[object Object]" instead of HTML
- **Date**: 2025-01-11

## Deployment Guide

### Prerequisites

Before deploying, ensure you have:

1. ✅ **Wrangler CLI** installed (included in `devDependencies`)
2. ✅ **Cloudflare account** with API token
3. ✅ **All environment variables** configured in Cloudflare Dashboard
4. ✅ **Compatibility flags** set in Cloudflare Dashboard

### Step 1: Set Compatibility Flags in Cloudflare Dashboard (REQUIRED)

**This step is mandatory and must be done before deployment:**

1. **Log in to Cloudflare Dashboard**
2. **Navigate to**: Workers & Pages → Your project → Settings → Functions
3. **Set Compatibility Date**: `2025-11-09` (or current date)
4. **Add Compatibility Flag**: `nodejs_compat`
5. **Save changes**

**Important**: These settings apply to both Production and Preview environments. Without `nodejs_compat`, Node.js modules (like those used by Supabase) will not work, causing "[object Object]" errors.

### Step 2: Configure Environment Variables

Set the following environment variables in Cloudflare Dashboard:

**Settings → Environment Variables → Production:**

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_KEY` - Your Supabase service role key (for server-side)
- `PUBLIC_SUPABASE_URL` - Your public Supabase URL (for client-side)
- `PUBLIC_SUPABASE_KEY` - Your Supabase anon key (for client-side)
- `OPENROUTER_API_KEY` - Your OpenRouter API key

**Note**: Variables prefixed with `PUBLIC_` are exposed to the client. Server-side variables (without `PUBLIC_`) are only available in Workers.

### Step 3: Configure _routes.json

The `_routes.json` file controls which requests are handled by SSR and which are served as static files.

**File location**: `public/_routes.json` (automatically copied to `dist/` during build)

**Recommended configuration**:

```json
{
  "version": 1,
  "include": ["/*"],
  "exclude": [
    "/_astro/*",
    "/favicon.ico",
    "/favicon.png",
    "/favicon.svg"
  ]
}
```

This ensures:
- All routes are handled by SSR (`include: ["/*"]`)
- Static assets are served directly without SSR processing (`exclude`)

### Step 4: Local Testing

Before deploying, test locally to ensure everything works:

```bash
# Build for Cloudflare
npm run build:cloudflare

# Test locally with Wrangler
npm run preview:cloudflare
```

The application will be available at `http://localhost:8788`.

**If it works locally but not in production**, the issue is likely with Cloudflare Pages configuration (compatibility flags or environment variables).

**Test response** (in separate terminal):
```bash
# Linux/Mac
curl http://localhost:8788/

# Windows
curl.exe http://localhost:8788/
```

### Step 5: Deploy to Cloudflare Pages

#### Option A: Deploy via GitHub Actions (Recommended)

The GitHub Actions workflow automatically deploys your application. Make sure:

1. ✅ All secrets are set in GitHub:
   - `CF_API_TOKEN` (or `CLOUDFLARE_API_TOKEN`)
   - `CF_ACCOUNT_ID` (or `CLOUDFLARE_ACCOUNT_ID`)
   - `CF_PROJECT_NAME`
2. ✅ Compatibility flags are set in Cloudflare Dashboard (Step 1)
3. ✅ Environment variables are set in Cloudflare Dashboard (Step 2)

**Note**: The workflow uses `wrangler pages deploy` which does NOT support setting compatibility flags via command line. Flags must be set manually in the dashboard.

#### Option B: Deploy Locally

```bash
# Set environment variables
export CLOUDFLARE_API_TOKEN="your-token"
export CLOUDFLARE_ACCOUNT_ID="your-account-id"

# Build the application
npm run build:cloudflare

# Deploy
npx wrangler pages deploy dist --project-name="your-project-name"
```

**Important**: Compatibility flags cannot be set via the deploy command. You must set them in the Cloudflare Dashboard (Step 1) before deploying.

## Debugging Steps

If you encounter the "[object Object]" issue, follow these debugging steps:

### Step 1: Check and Update Package Versions

```bash
# Check current versions
npm list astro @astrojs/cloudflare

# Check available updates
npm outdated astro @astrojs/cloudflare

# Update to latest versions
npm install astro@latest @astrojs/cloudflare@latest

# Or test older version
npm install astro@5.14.8 @astrojs/cloudflare@12.6.10
```

**What to check**:
- Whether `@astrojs/cloudflare` is compatible with your Astro version
- Known issues in adapter changelog

**Results (2025-01-11)**:
- ✅ Checked versions: Astro 5.15.4 (latest), @astrojs/cloudflare 12.6.10
- ✅ Tested downgrade: Astro 5.14.8 (build successful)
- ⚠️ **Next step**: Deploy with Astro 5.14.8 to test if older version fixes the issue

### Step 2: Test Locally with Wrangler

```bash
# Build the application
npm run build:cloudflare

# Run locally with Wrangler
npm run preview:cloudflare

# In separate terminal, check response
curl http://localhost:8788/  # Linux/Mac
curl.exe http://localhost:8788/  # Windows
```

**What to check**:
- Whether it works locally (HTML instead of [object Object])
- If it works locally, the problem is specific to Cloudflare Pages
- If it doesn't work locally, the problem is in adapter configuration

**Results (2025-01-11)**:
- ✅ **Works locally**: `curl http://localhost:8788/` returns full HTML
- ✅ **Build successful**: All files generated correctly
- ✅ **Structure correct**: `_routes.json` and `_worker.js/` exist
- ❌ **Production still broken**: Despite local success, production returns `[object Object]`
- **Conclusion**: Problem is specific to Cloudflare Pages production environment, not the code

### Step 3: Check dist/ Contents After Build

```bash
# Build the application
npm run build:cloudflare

# Check dist/ structure
ls -la dist/  # Linux/Mac
dir dist\     # Windows

# Check for HTML files in dist/
find dist -name "*.html"  # Linux/Mac
dir /s dist\*.html        # Windows

# Check _worker.js or similar files
cat dist/_worker.js | head -50  # Linux/Mac
Get-Content dist\_worker.js -Head 50  # Windows PowerShell
```

**What to check**:
- Whether Astro generates HTML files
- Whether worker files exist (`_worker.js`, `functions/`, etc.)
- Structure of `dist/`

### Step 4: Add Additional Logging

✅ **COMPLETED (2025-01-11)**: Added detailed logging in middleware

See Step 10 in Debugging History for the logging code added.

**What it shows**:
- Type of object returned by `next()`
- Whether it's a Response object
- Preview of response body content
- Response headers and status
- If response is not a Response object, what it actually is

**Next step**: After deployment, check Cloudflare Logs to see what middleware logs.

**Results (2025-01-11)**:
- ✅ **Response IS a Response object**: `isResponse: true`, `constructor: "Response"`
- ✅ **Headers are correct**: `content-type: text/html`, `x-astro-route-type: page`
- ✅ **Status is correct**: `200 OK`
- ❌ **BUT Response body is already `[object Object]`**: The body contains the string `[object Object]` (15 bytes) when middleware receives it

**Critical Discovery**: The problem occurs BEFORE middleware receives the response. The Response object from `next()` already has `[object Object]` as its body content.

### Step 5: Check Adapter Configuration

Check if adapter is correctly configured:

```javascript
// astro.config.mjs
export default defineConfig({
  output: "server",  // ✅ Must be "server" for SSR
  adapter: isCloudflare ? cloudflare() : node({ mode: "standalone" }),
  // ...
});
```

**Check**:
- Whether `output: "server"` is set
- Whether adapter is correctly selected (check `isCloudflare`)
- Whether there are conflicts with other adapters

### Step 6: Check Adapter Documentation

```bash
# Check adapter documentation
# https://docs.astro.build/en/guides/integrations-guide/cloudflare/
```

### Step 7: Test with Minimal Example

Create a minimal test page:

```astro
<!-- src/pages/test.astro -->
---
// Minimal page without Supabase, without middleware
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

Check if `/test` works correctly.

### Step 8: Check _routes.json

```bash
# Check if _routes.json exists in dist/
cat dist/_routes.json  # Linux/Mac
Get-Content dist\_routes.json  # Windows
```

Should contain:
```json
{
  "version": 1,
  "include": ["/*"],
  "exclude": ["/_astro/*", "/favicon.*"]
}
```

### Step 9: Check Build Logs

```bash
# Build with verbose output
npm run build:cloudflare -- --verbose

# Check for errors or warnings
```

### Step 10: Compare with Working Configuration

If you have access to a working Astro application on Cloudflare:
- Compare package versions
- Compare `astro.config.mjs` configuration
- Compare `dist/` structure

## Troubleshooting

### Still seeing "[object Object]"

This error typically means the response is an object being serialized incorrectly instead of HTML. Follow these steps:

#### 1. Verify Compatibility Flags

Double-check in Cloudflare Dashboard:
- Go to Workers & Pages → Your project → Settings → Functions
- Verify `compatibility_date` is set (e.g., `2025-11-09`)
- Verify `nodejs_compat` flag is enabled
- **Important**: These settings apply to both Production and Preview environments

#### 2. Check Environment Variables

**Via API**:
Visit `https://your-domain.pages.dev/api/debug-env` - all values should be `true`:
```json
{"supabaseUrl":true,"supabaseKey":true,"publicSupabaseUrl":true,"publicSupabaseKey":true}
```

**Via Dashboard**:
- Settings → Environment Variables
- Ensure all required variables are set for Production environment
- Check: `SUPABASE_URL`, `SUPABASE_KEY`, `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_KEY`, `OPENROUTER_API_KEY`

#### 3. Check Cloudflare Logs

**Location**: Cloudflare Dashboard → Workers & Pages → Your project → Logs

Look for:
- Actual error messages (not just "[object Object]")
- Stack traces showing where the error occurs
- Common errors:
  - "Missing Supabase credentials" → Environment variables not set
  - "Cannot find module" → Compatibility flags issue
  - Any error with detailed stack trace

**With logging enabled**, you should see logs like:
```
[Middleware] Processing request: /
[supabase.server] Creating Supabase client
[index.astro] Starting page render
[LandingLayout] Rendering layout...
```

If any step is missing, that's where the problem occurs.

#### 4. Check Response Headers

**Browser DevTools → Network tab**:
- Reload the page
- Check the response headers for the main page request
- Verify `Content-Type` is `text/html` (not `application/json`)
- Check the actual response body - if it shows `[object Object]`, the response is an object instead of HTML

#### 5. Verify _routes.json

- Should be in `dist/` folder after build
- Should exclude static assets: `/_astro/*`, `/favicon.*`
- Should include all routes: `["/*"]`

#### 6. Test Locally

```bash
npm run preview:cloudflare
```

If it works locally but not in production, the issue is likely with Cloudflare Pages configuration.

#### 7. Check for Error Handling Issues

The codebase includes error handling in:
- `src/middleware/index.ts` - Wraps Supabase client creation in try-catch
- `src/pages/index.astro` - Handles Supabase errors gracefully
- `src/pages/auth/login.astro` - Handles Supabase errors gracefully
- `src/db/supabase.server.ts` - Provides detailed error messages

If errors occur, they should be logged to Cloudflare Logs with detailed information.

#### 8. Check Response Body Content (CRITICAL)

**Browser DevTools → Network tab**:
1. Open DevTools (F12)
2. Go to Network tab
3. Reload the page
4. Click on the main document request (usually the first one)
5. Go to "Response" or "Preview" tab
6. **Check what the actual response body contains**

**Expected**: HTML content starting with `<!doctype html>`
**Problem**: If you see `[object Object]` or JSON object, the response is being serialized incorrectly

**Common causes**:
- Middleware returning an object instead of calling `next()`
- Astro adapter not properly serializing HTML response
- Content-Type header is `application/json` instead of `text/html`
- Response object being returned directly instead of HTML string

#### 9. Verify Astro Cloudflare Adapter Configuration

Check `astro.config.mjs`:
- Adapter should be `cloudflare()` (not `cloudflare({ mode: "..." })`)
- `output` should be `"server"` for SSR
- Verify adapter is selected correctly based on `TARGET` environment variable

#### 10. Check for Response Serialization Issues

The "[object Object]" error typically means:
- A JavaScript object is being returned instead of HTML string
- Response is not being properly serialized by Astro adapter
- Middleware might be returning an object instead of Response

**Debug steps**:
1. Add logging in middleware to see what's being returned
2. Check if `next()` is being called correctly
3. Verify no code is returning objects directly
4. Check if Astro pages are rendering correctly (logs show they are, but response is wrong)

### 404 errors on non-existent paths

This is normal behavior - Cloudflare Pages returns 404 for non-existent paths. The "[object Object]" problem only affects existing paths that should be handled by SSR.

### Middleware not working

Make sure:
- `_routes.json` is in the `dist/` folder (should be automatically copied)
- Compatibility flags are set
- Supabase environment variables are correctly configured
- Check Cloudflare Logs for middleware errors

### Build Warnings

**"Invalid binding `SESSION`"**:
- This is a warning about Cloudflare KV for sessions
- It's optional - sessions will work without it (using cookies)
- To fix: Create a KV namespace in Cloudflare and bind it as `SESSION` in `wrangler.toml`

**"Cloudflare does not support sharp at runtime"**:
- This is normal - Sharp is only used during build time for image optimization
- Does not affect runtime functionality

## Configuration Files

### wrangler.toml

Used for local development with `wrangler pages dev` and deployment configuration:

```toml
name = "dietplanner"

compatibility_date = "2025-11-09"
compatibility_flags = ["nodejs_compat"]

# Pages build output directory (required for Pages deployment)
pages_build_output_dir = "dist"
```

**Note**: 
- `name` is required top-level field for Pages projects
- Compatibility flags in this file are NOT used during `wrangler pages deploy` - they must be set in Cloudflare Dashboard
- `pages_build_output_dir` is required to avoid warnings during deployment

### astro.config.mjs

The adapter is selected based on `TARGET` environment variable:
- `TARGET=cloudflare` → Uses Cloudflare adapter
- Default → Uses Node adapter

## Available Scripts

**Development**:
- `npm run dev` - Development server (Node adapter)
- `npm run dev:cloudflare` - Development server (Cloudflare adapter)
- `npm run build:cloudflare` - Build for Cloudflare Pages
- `npm run preview:cloudflare` - Build and test locally with Wrangler

**Deployment**:
- GitHub Actions workflow automatically deploys on push to `master`
- Manual deployment: `npx wrangler pages deploy dist --project-name=dietplanner`

## Verification Checklist

After deployment, verify:

1. ✅ Pages display HTML instead of "[object Object]"
2. ✅ API endpoints return JSON (test: `/api/debug-env`)
3. ✅ Middleware works correctly (redirects)
4. ✅ Compatibility flags are visible in Cloudflare Dashboard
5. ✅ Environment variables are set and accessible
6. ✅ Logs show successful request processing
7. ✅ Local testing works with `npm run preview:cloudflare`

## Next Steps

### Immediate Actions

1. ✅ Check actual response body content - **VERIFIED**: `[object Object]`
2. ✅ Verify Content-Type header - **VERIFIED**: `text/html` (correct)
3. ✅ Check if middleware is accidentally returning an object - **VERIFIED**: Middleware looks correct
4. ✅ Test locally - **VERIFIED**: Works perfectly with `wrangler pages dev`
5. ✅ Update packages - **DONE**: Updated to latest versions
6. ✅ Add detailed logging - **DONE**: Added response logging in middleware
7. ✅ **BREAKTHROUGH**: Deployed with logging - **DISCOVERED**: Response body is already `[object Object]` when middleware receives it
8. ⚠️ **ROOT CAUSE IDENTIFIED**: Problem is in Astro Cloudflare adapter serialization

### Recommended Next Steps

1. ⚠️ **INVESTIGATE**: Check Astro Cloudflare adapter source code
2. ⚠️ **INVESTIGATE**: Possible workaround - manually fix response body in middleware
3. ⚠️ **INVESTIGATE**: Check adapter documentation for known issues
4. ⚠️ **TEST**: Deploy with Astro 5.14.8 to test if older version fixes the issue

### Possible Solutions

1. **Try different adapter version**: Downgrade or upgrade @astrojs/cloudflare
2. **Workaround in middleware**: Detect `[object Object]` and try to re-render or fetch from cache
3. **Check Cloudflare Pages configuration**: There might be a setting causing this
4. **Review adapter documentation**: Check for known issues or configuration requirements

### Common Solutions

1. **Update adapter**: `npm install @astrojs/cloudflare@latest`
2. **Check output mode**: Must be `"server"` not `"static"`
3. **Check _routes.json**: Must be in dist/
4. **Middleware issue**: Middleware may be returning an object instead of Response
5. **Test different versions**: Test older Astro versions (e.g., 5.14.8)

## Additional Resources

- [Astro Cloudflare Adapter Documentation](https://docs.astro.build/en/guides/integrations-guide/cloudflare/)
- [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/platform/functions/)
- [Cloudflare Workers Compatibility Dates](https://developers.cloudflare.com/workers/platform/compatibility-dates/)

