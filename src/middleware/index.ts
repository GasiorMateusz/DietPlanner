import { defineMiddleware } from 'astro:middleware';

import { supabaseClient } from '../db/supabase.client.ts';

export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.supabase = supabaseClient;

  // TEMPORARY: Authentication disabled for /api/meal-plans/* endpoints
  // (handled in the endpoint handlers themselves)

  // TEMPORARY: Authentication disabled for /app/* routes (redirect disabled)
  // if (context.url.pathname.startsWith('/app/')) {
  //   const {
  //     data: { session },
  //   } = await supabaseClient.auth.getSession();
  //
  //   if (!session) {
  //     return context.redirect('/login', 307);
  //   }
  // }

  return next();
});
