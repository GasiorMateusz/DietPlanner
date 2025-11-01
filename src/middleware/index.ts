import { defineMiddleware } from 'astro:middleware';

import { supabaseClient } from '../db/supabase.client.ts';

export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.supabase = supabaseClient;

  // Check authentication for protected routes (routes under /app/*)
  if (context.url.pathname.startsWith('/app/')) {
    const {
      data: { session },
    } = await supabaseClient.auth.getSession();

    if (!session) {
      return context.redirect('/login', 307);
    }
  }

  return next();
});
