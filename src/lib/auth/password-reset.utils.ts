/**
 * Gets the password reset success message based on the environment.
 * In local development with Inbucket, provides instructions to check the email server.
 *
 * @returns The appropriate success message for password reset emails
 */
export function getPasswordResetSuccessMessage(): string {
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || "";
  const isUsingLocalSupabase = supabaseUrl.includes("localhost") || supabaseUrl.includes("127.0.0.1");

  return isUsingLocalSupabase
    ? "If an account exists for this email, we sent a password reset link. Check Inbucket at http://127.0.0.1:54324 for local emails."
    : "If an account exists for this email, we sent a password reset link.";
}

/**
 * Determines if the current environment is local development.
 *
 * @returns True if running in local development environment
 */
export function isLocalDevelopment(): boolean {
  return (
    import.meta.env.DEV ||
    (typeof window !== "undefined" &&
      (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"))
  );
}

/**
 * Determines if using cloud Supabase (not local).
 *
 * @returns True if using cloud Supabase instance
 */
export function isUsingCloudSupabase(): boolean {
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || "";
  return !supabaseUrl.includes("localhost") && !supabaseUrl.includes("127.0.0.1");
}

/**
 * Determines if error details should be shown to the user.
 * In development or with cloud Supabase, show detailed errors for debugging.
 * In production with local Supabase, hide errors for security (prevent email enumeration).
 *
 * @returns True if error details should be displayed
 */
export function shouldShowPasswordResetError(): boolean {
  return isLocalDevelopment() || isUsingCloudSupabase();
}
