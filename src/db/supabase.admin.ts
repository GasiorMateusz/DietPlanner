import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Creates a Supabase admin client using the service role key.
 * This client bypasses Row Level Security (RLS) and should only be used
 * for server-side administrative operations like deleting auth users.
 *
 * @returns Supabase admin client
 * @throws {Error} If SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY are not set
 */
export function createSupabaseAdminClient() {
  const supabaseUrl = import.meta.env.SUPABASE_URL;
  const serviceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    const error = new Error(
      `Missing Supabase admin credentials: SUPABASE_URL=${Boolean(supabaseUrl)}, SUPABASE_SERVICE_ROLE_KEY=${Boolean(serviceRoleKey)}`
    );
    error.name = "MissingSupabaseAdminCredentials";
    throw error;
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
