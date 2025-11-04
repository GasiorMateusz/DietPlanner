import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "../db/database.types.ts";

// In production, PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_KEY must be set as environment variables
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_KEY must be set as environment variables. " +
    "These are required for the Supabase client to function."
  );
}

export const supabaseClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
