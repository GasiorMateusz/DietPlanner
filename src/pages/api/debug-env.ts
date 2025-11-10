import type { APIRoute } from "astro";

export const GET: APIRoute = async () => {
  return new Response(
    JSON.stringify({
      supabaseUrl: !!import.meta.env.SUPABASE_URL,
      supabaseKey: !!import.meta.env.SUPABASE_KEY,
      publicSupabaseUrl: !!import.meta.env.PUBLIC_SUPABASE_URL,
      publicSupabaseKey: !!import.meta.env.PUBLIC_SUPABASE_KEY,
      publicAppUrl: import.meta.env.PUBLIC_APP_URL || "NOT SET",
      publicAppUrlSet: !!import.meta.env.PUBLIC_APP_URL,
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
};
