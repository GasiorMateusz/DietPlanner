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

    console.error(`[Middleware] Error for ${pathname}:`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : typeof error,
    });
    return next();
  }
});
