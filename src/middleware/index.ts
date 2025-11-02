import { defineMiddleware } from "astro:middleware";
import { createSupabaseServerClient } from "../db/supabase.server";

export const onRequest = defineMiddleware(async (context, next) => {
  const supabase = createSupabaseServerClient(context.cookies);
  context.locals.supabase = supabase;

  // Get session for token management
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const accessToken = session?.access_token ?? null;
  const refreshToken = session?.refresh_token ?? null;

  if (accessToken && refreshToken) {
    context.cookies.set("sb-access-token", accessToken, {
      sameSite: "strict",
      path: "/",
      secure: import.meta.env.PROD,
    });
    context.cookies.set("sb-refresh-token", refreshToken, {
      sameSite: "strict",
      path: "/",
      secure: import.meta.env.PROD,
    });
  }

  const pathname = context.url.pathname;

  // Protect /app/* routes - require authentication
  // Use getUser() to verify the session is authentic (not just from storage)
  if (pathname.startsWith("/app/")) {
    if (!accessToken) {
      return context.redirect("/auth/login", 307);
    }

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return context.redirect("/auth/login", 307);
    }
  }

  // Redirect authenticated users away from auth pages
  // Verify session is authentic before redirecting
  if (pathname.startsWith("/auth/") && accessToken) {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(accessToken);

    if (!error && user) {
      return context.redirect("/app/dashboard", 307);
    }
  }

  return next();
});
