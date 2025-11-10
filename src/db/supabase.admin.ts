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

  // Debug logging (without exposing secrets)
  // eslint-disable-next-line no-console
  console.log("[createSupabaseAdminClient] Environment check:", {
    hasSupabaseUrl: Boolean(supabaseUrl),
    supabaseUrlLength: supabaseUrl?.length ?? 0,
    hasServiceRoleKey: Boolean(serviceRoleKey),
    serviceRoleKeyLength: serviceRoleKey?.length ?? 0,
    serviceRoleKeyPrefix: serviceRoleKey ? `${serviceRoleKey.substring(0, 10)}...` : "undefined",
    // Log all available env vars (for debugging, but don't expose values)
    availableEnvVars: Object.keys(import.meta.env).filter((key) =>
      key.includes("SUPABASE") || key.includes("SERVICE")
    ),
  });

  if (!supabaseUrl || !serviceRoleKey) {
    const error = new Error(
      `Missing Supabase admin credentials: SUPABASE_URL=${Boolean(supabaseUrl)}, SUPABASE_SERVICE_ROLE_KEY=${Boolean(serviceRoleKey)}`
    );
    error.name = "MissingSupabaseAdminCredentials";
    // eslint-disable-next-line no-console
    console.error("[createSupabaseAdminClient] Error details:", {
      errorName: error.name,
      errorMessage: error.message,
      supabaseUrlType: typeof supabaseUrl,
      serviceRoleKeyType: typeof serviceRoleKey,
      // Check if it's undefined vs empty string
      supabaseUrlIsUndefined: supabaseUrl === undefined,
      serviceRoleKeyIsUndefined: serviceRoleKey === undefined,
    });
    throw error;
  }

  // eslint-disable-next-line no-console
  console.log("[createSupabaseAdminClient] Successfully created admin client");

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
