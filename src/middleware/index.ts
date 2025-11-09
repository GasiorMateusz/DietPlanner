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
      const errorMessage = error.message || "";
      
      // These are expected errors that don't need logging:
      // - refresh_token_not_found: No valid refresh token (user not logged in)
      // - Auth session missing: No active session (user not logged in)
      const isExpectedError =
        errorCode === "refresh_token_not_found" ||
        errorMessage.includes("Auth session missing") ||
        errorMessage.includes("session missing") ||
        errorMessage.includes("JWT expired");

      if (!isExpectedError) {
        // Only log unexpected auth errors
        console.error(`[Middleware] Auth error for ${pathname}:`, error.message);
      }
    }

    if (pathname.startsWith("/app/")) {
      if (error || !user) {
        return context.redirect("/auth/login", 307);
      }
    }

    if (pathname.startsWith("/auth/") && !error && user) {
      return context.redirect("/app/dashboard", 307);
    }

    return await next();
  } catch (error) {
    // Ignore refresh token errors silently
    if (error && typeof error === "object" && "code" in error && error.code === "refresh_token_not_found") {
      return await next();
    }

    console.error(`[Middleware] Error for ${pathname}:`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : typeof error,
    });
    return next();
  }
});
