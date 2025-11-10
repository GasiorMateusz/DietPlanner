import { defineMiddleware } from "astro:middleware";
import { createSupabaseServerClient } from "../db/supabase.server";

export const onRequest = defineMiddleware(async (context, next) => {
  const pathname = context.url.pathname;

  try {
    const supabase = createSupabaseServerClient(context.cookies);
    context.locals.supabase = supabase;

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    // Ignore expected errors - these are normal when user is not logged in
    if (error) {
      const errorCode = (error as { code?: string }).code;
      const errorMessage = (error.message || "").toLowerCase();

      // These are expected errors that don't need logging:
      // - refresh_token_not_found: No valid refresh token (user not logged in)
      // - Auth session missing: No active session (user not logged in)
      const isExpectedError =
        errorCode === "refresh_token_not_found" ||
        errorMessage.includes("auth session missing") ||
        errorMessage.includes("session missing") ||
        errorMessage.includes("jwt expired") ||
        errorMessage.includes("invalid token");

      if (!isExpectedError) {
        // Only log unexpected auth errors
        // eslint-disable-next-line no-console
        console.error(`[Middleware] Auth error for ${pathname}:`, error.message);
      }
    }

    // Protect /app/* routes - require authentication
    if (pathname.startsWith("/app/")) {
      if (error || !user) {
        return context.redirect("/auth/login", 307);
      }
    }

    // Redirect authenticated users away from auth pages
    // Only redirect if we have a confirmed user (no error AND user exists)
    // This prevents redirect loops when cookies are not yet synced after registration
    if (pathname.startsWith("/auth/")) {
      // Only redirect if we're CERTAIN the user is authenticated
      // Don't redirect if there's any error, even if user exists (could be stale session)
      if (!error && user) {
        // For all auth pages, be extra cautious to prevent redirect loops
        // Only redirect if we have both a user AND a valid session with access token
        // This ensures cookies are properly synced
        const session = await supabase.auth.getSession();
        if (session.data.session?.access_token) {
          return context.redirect("/app/dashboard", 307);
        }
        // If no valid session, allow access to auth pages (prevents loops)
        return await next();
      }
    }

    return await next();
  } catch (error) {
    // Ignore expected auth errors silently
    if (error && typeof error === "object") {
      const errorCode = "code" in error ? (error.code as string) : undefined;
      const errorMessage = error instanceof Error ? (error.message || "").toLowerCase() : String(error).toLowerCase();

      const isExpectedError =
        errorCode === "refresh_token_not_found" ||
        errorMessage.includes("auth session missing") ||
        errorMessage.includes("session missing") ||
        errorMessage.includes("jwt expired") ||
        errorMessage.includes("invalid token");

      if (isExpectedError) {
        return await next();
      }
    }

    // eslint-disable-next-line no-console
    console.error(`[Middleware] Error for ${pathname}:`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : typeof error,
    });
    return next();
  }
});
