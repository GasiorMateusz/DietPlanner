import { supabaseClient } from "../../db/supabase.client";

/**
 * Retrieves the Supabase JWT token from the current session.
 * Returns null if no session exists.
 *
 * @returns The JWT access token, or null if not authenticated
 */
export async function getAuthToken(): Promise<string | null> {
  const {
    data: { session },
  } = await supabaseClient.auth.getSession();

  return session?.access_token ?? null;
}
