import { defineMiddleware } from "astro:middleware";
import { createSupabaseServerClient } from "../db/supabase.server";

export const onRequest = defineMiddleware(async (context, next) => {
  try {
    const supabase = createSupabaseServerClient(context.cookies);
    context.locals.supabase = supabase;

    const pathname = context.url.pathname;

    // Protect /app/* routes - require authentication
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (pathname.startsWith("/app/")) {
      if (error || !user) {
        return context.redirect("/auth/login", 307);
      }
    }

    // Redirect authenticated users away from auth pages
    if (pathname.startsWith("/auth/") && !error && user) {
      return context.redirect("/app/dashboard", 307);
    }

    return next();
  } catch (error) {
    // If Supabase client creation fails, log error but continue
    // Pages will handle their own auth checks
    console.error("Middleware error:", error);
    // Continue to next middleware/page - let pages handle auth gracefully
    return next();
  }
});
