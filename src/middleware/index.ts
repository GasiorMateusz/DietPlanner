import { defineMiddleware } from "astro:middleware";
import { createSupabaseServerClient } from "../db/supabase.server";

export const onRequest = defineMiddleware(async (context, next) => {
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
});
