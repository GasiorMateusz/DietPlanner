import { supabaseClient as supabase } from "@/db/supabase.client";

/**
 * Custom hook that confirms a Supabase session is established.
 * This is useful after authentication actions to ensure cookies are set
 * before redirecting, preventing redirect loops in edge environments.
 *
 * @param maxRetries - Maximum number of retry attempts (default: 20)
 * @param retryDelay - Delay between retries in milliseconds (default: 100)
 * @param postConfirmationDelay - Additional delay after confirmation in milliseconds (default: 200)
 * @returns A function that attempts to confirm the session
 */
export function useSessionConfirmation(maxRetries = 20, retryDelay = 100, postConfirmationDelay = 200) {
  const confirmSession = async (): Promise<boolean> => {
    let sessionConfirmed = false;

    for (let i = 0; i < maxRetries; i++) {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      // Only confirm if we have a valid session with access token and no error
      if (session?.access_token && !sessionError) {
        sessionConfirmed = true;
        break;
      }

      // Wait between checks
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }

    if (sessionConfirmed) {
      // Add a small delay before redirect to ensure cookies are fully propagated
      // This is especially important in edge environments like Cloudflare Pages
      await new Promise((resolve) => setTimeout(resolve, postConfirmationDelay));
    }

    return sessionConfirmed;
  };

  return { confirmSession };
}
