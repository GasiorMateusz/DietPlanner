/**
 * Gets the application base URL for authentication redirects.
 *
 * Priority:
 * 1. PUBLIC_APP_URL environment variable (explicitly set - recommended for production)
 * 2. window.location.origin (current page origin - works in browser)
 * 3. Throws error if neither is available (should never happen in browser)
 *
 * @returns The base URL of the application (e.g., "https://example.com" or "http://localhost:3000")
 * @throws {Error} If no valid URL can be determined
 */
export function getAppUrl(): string {
  // First, try to use the explicit PUBLIC_APP_URL environment variable
  // This should be set in production to ensure correct URLs
  const envUrl = import.meta.env.PUBLIC_APP_URL;
  if (envUrl && typeof envUrl === "string" && envUrl.trim() !== "") {
    // Remove trailing slash if present
    const url = envUrl.trim().replace(/\/$/, "");
    // Validate it's a proper URL
    try {
      new URL(url);
      return url;
    } catch {
      // If invalid URL, fall through to window.location.origin
      console.warn(`PUBLIC_APP_URL is set but invalid: "${envUrl}". Falling back to window.location.origin`);
    }
  }

  // Fallback to window.location.origin (only works in browser)
  // This is reliable in client-side code since these components run in the browser
  if (typeof window !== "undefined" && window.location) {
    const origin = window.location.origin;

    // Warn in production if PUBLIC_APP_URL is not set
    // This helps diagnose issues where redirect URLs might be incorrect
    if (!envUrl && origin && !origin.includes("localhost") && !origin.includes("127.0.0.1")) {
      console.warn(
        `PUBLIC_APP_URL is not set. Using window.location.origin (${origin}) for auth redirects. ` +
          `Consider setting PUBLIC_APP_URL in production for reliability.`
      );
    }

    return origin;
  }

  // This should never happen in client-side React components
  // But we throw an error to make it clear if it does
  throw new Error(
    "Cannot determine application URL. " +
      "Either set PUBLIC_APP_URL environment variable or ensure code runs in browser context."
  );
}

/**
 * Gets the full redirect URL for authentication flows.
 *
 * @param path - The path to redirect to (e.g., "/auth/reset-password" or "/auth/login")
 * @returns The full URL (e.g., "https://example.com/auth/reset-password")
 */
export function getAuthRedirectUrl(path: string): string {
  const baseUrl = getAppUrl();
  // Ensure path starts with /
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}
