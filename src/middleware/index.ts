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
    console.error(`[Middleware] Error for ${pathname}:`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : typeof error,
    });
    return next();
  }
});
