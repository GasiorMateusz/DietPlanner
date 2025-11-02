import { supabaseClient } from "@/db/supabase.client";

export async function getAuthToken(): Promise<string | null> {
  const {
    data: { session },
    error,
  } = await supabaseClient.auth.getSession();

  if (error) {
    // eslint-disable-next-line no-console
    console.error("Error getting session:", error);
    return null;
  }

  return session?.access_token ?? null;
}
