import { defineMiddleware } from "astro:middleware";
import { createSupabaseServerClient } from "../db/supabase.server";

export const onRequest = defineMiddleware(async (context, next) => {
  const pathname = context.url.pathname;
  // eslint-disable-next-line no-console
  console.log(`[Middleware] Processing request: ${pathname}`);
  
  try {
    const supabase = createSupabaseServerClient(context.cookies);
    context.locals.supabase = supabase;
    // eslint-disable-next-line no-console
    console.log(`[Middleware] Supabase client created for: ${pathname}`);

    // Protect /app/* routes - require authentication
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    // Log auth status - distinguish between missing session (expected for public routes) and actual errors
    const isProtectedRoute = pathname.startsWith("/app/");
    const missingSessionOnly = error?.message === "Auth session missing!" || error?.message === "Invalid Refresh Token: Refresh Token Not Found";
    
    if (isProtectedRoute) {
      // Always log for protected routes
      // eslint-disable-next-line no-console
      console.log(`[Middleware] Auth check for ${pathname}:`, {
        hasUser: !!user,
        hasError: !!error,
        errorMessage: error?.message,
        action: error || !user ? "redirecting to login" : "allowing access",
      });
    } else if (error && !missingSessionOnly) {
      // Log actual errors (not just missing session)
      // eslint-disable-next-line no-console
      console.log(`[Middleware] Auth error for ${pathname}:`, {
        errorMessage: error?.message,
        hasUser: !!user,
      });
    }

    if (pathname.startsWith("/app/")) {
      if (error || !user) {
        // eslint-disable-next-line no-console
        console.log(`[Middleware] Redirecting ${pathname} to /auth/login`);
        return context.redirect("/auth/login", 307);
      }
    }

    // Redirect authenticated users away from auth pages
    if (pathname.startsWith("/auth/") && !error && user) {
      // eslint-disable-next-line no-console
      console.log(`[Middleware] Redirecting authenticated user from ${pathname} to /app/dashboard`);
      return context.redirect("/app/dashboard", 307);
    }

    // eslint-disable-next-line no-console
    console.log(`[Middleware] Continuing to next handler for: ${pathname}`);
    return next();
  } catch (error) {
    // If Supabase client creation fails, log error but continue
    // Pages will handle their own auth checks
    console.error(`[Middleware] Error for ${pathname}:`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : typeof error,
    });
    // Continue to next middleware/page - let pages handle auth gracefully
    return next();
  }
});
