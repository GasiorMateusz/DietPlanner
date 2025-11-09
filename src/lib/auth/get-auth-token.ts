import { supabaseClient } from "@/db/supabase.client";

export async function getAuthToken(): Promise<string | null> {
  const {
    data: { session },
    error,
  } = await supabaseClient.auth.getSession();

  if (error) {
    // Ignore refresh token errors - they're harmless if user can still authenticate
    if ((error as { code?: string }).code === "refresh_token_not_found") {
      return null;
    }
    // eslint-disable-next-line no-console
    console.error("Error getting session:", error);
    return null;
  }

  return session?.access_token ?? null;
}
