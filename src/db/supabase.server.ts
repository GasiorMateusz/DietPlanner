import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { AstroCookies } from "astro";
import type { Database } from "./database.types";

export const createSupabaseServerClient = (cookies: AstroCookies) => {
  const supabaseUrl = import.meta.env.SUPABASE_URL;
  const supabaseKey = import.meta.env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    const error = new Error(
      `Missing Supabase credentials: SUPABASE_URL=${Boolean(supabaseUrl)}, SUPABASE_KEY=${Boolean(supabaseKey)}`
    );
    error.name = "MissingSupabaseCredentials";
    throw error;
  }

  return createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      get(key: string) {
        return cookies.get(key)?.value;
      },
      set(key: string, value: string, options: CookieOptions) {
        cookies.set(key, value, options);
      },
      remove(key: string, options: CookieOptions) {
        cookies.delete(key, options);
      },
    },
  });
};
