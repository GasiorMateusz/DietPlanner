import { defineMiddleware } from "astro:middleware";
import { createSupabaseServerClient } from "../db/supabase.server";

export const onRequest = defineMiddleware(async (context, next) => {
  const supabase = createSupabaseServerClient(context.cookies);
  context.locals.supabase = supabase;

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

  // TEMPORARY: Authentication disabled for /app/* routes (redirect disabled)
  // if (context.url.pathname.startsWith('/app/')) {
  //   const {
  //     data: { session },
  //   } = await supabaseClient.auth.getSession();
  //
  //   if (!session) {
  //     return context.redirect('/auth/login', 307);
  //   }
  // }

  return next();
});
