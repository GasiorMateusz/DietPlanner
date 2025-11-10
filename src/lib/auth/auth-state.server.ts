import type { SupabaseClient } from "@/db/supabase.client";
import type { User } from "@supabase/supabase-js";

/**
 * Checks if a user is authenticated by verifying both user and session.
 * This prevents redirect loops when cookies aren't fully synced.
 *
 * @param supabase - The Supabase client instance
 * @returns The authenticated user if valid session exists, null otherwise
 */
export async function getAuthenticatedUser(supabase: SupabaseClient): Promise<User | null> {
  try {
    const {
      data: { user: authenticatedUser },
      error: getUserError,
    } = await supabase.auth.getUser();

    // Only consider user authenticated if we have both user AND no error
    // Also verify session exists to prevent redirect loops
    if (!getUserError && authenticatedUser) {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      // Only return user if we have a valid session with access token
      // This prevents redirect loops when cookies aren't fully synced
      if (!sessionError && sessionData.session?.access_token) {
        return authenticatedUser;
      }
    }
  } catch {
    // If Supabase client fails, return null
    // User will see auth form
  }

  return null;
}
