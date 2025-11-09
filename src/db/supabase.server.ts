import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { AstroCookies } from "astro";
import type { Database } from "./database.types";

export const createSupabaseServerClient = (cookies: AstroCookies) => {
  // eslint-disable-next-line no-console
  console.log("[supabase.server] Creating Supabase client");
  const supabaseUrl = import.meta.env.SUPABASE_URL;
  const supabaseKey = import.meta.env.SUPABASE_KEY;

  // eslint-disable-next-line no-console
  console.log("[supabase.server] Environment check:", {
    hasUrl: Boolean(supabaseUrl),
    hasKey: Boolean(supabaseKey),
    urlLength: supabaseUrl?.length || 0,
    keyLength: supabaseKey?.length || 0,
    envKeys: Object.keys(import.meta.env).filter((k) => k.includes("SUPABASE")),
  });

  if (!supabaseUrl || !supabaseKey) {
    // eslint-disable-next-line no-console
    console.error("[supabase.server] Missing Supabase credentials:", {
      hasUrl: Boolean(supabaseUrl),
      hasKey: Boolean(supabaseKey),
      envKeys: Object.keys(import.meta.env).filter((k) => k.includes("SUPABASE")),
    });
    // Return a more descriptive error that won't serialize as [object Object]
    const error = new Error(
      `Missing Supabase credentials: SUPABASE_URL=${Boolean(supabaseUrl)}, SUPABASE_KEY=${Boolean(supabaseKey)}`
    );
    error.name = "MissingSupabaseCredentials";
    throw error;
  }

  // eslint-disable-next-line no-console
  console.log("[supabase.server] Supabase client created successfully");

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
