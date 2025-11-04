import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "../db/database.types.ts";

// Fallback values for local development when env vars are not set
// In production, PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_KEY must be set as environment variables
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
const supabaseAnonKey =
  import.meta.env.PUBLIC_SUPABASE_KEY;

export const supabaseClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
