/**
 * Gets the application base URL for authentication redirects.
 *
 * Priority:
 * 1. PUBLIC_APP_URL environment variable (REQUIRED in production)
 * 2. window.location.origin (only allowed in development/localhost)
 *
 * @returns The base URL of the application (e.g., "https://example.com" or "http://localhost:3000")
 * @throws {Error} If no valid URL can be determined or if PUBLIC_APP_URL is not set in production
 */
export function getAppUrl(): string {
  const envUrl = import.meta.env.PUBLIC_APP_URL;
  const isProduction =
    typeof window !== "undefined" &&
    window.location &&
    !window.location.hostname.includes("localhost") &&
    !window.location.hostname.includes("127.0.0.1");

  // PRIORITY 1: Use PUBLIC_APP_URL if set (this is the primary source for all auth redirect links)
  if (envUrl && typeof envUrl === "string" && envUrl.trim() !== "") {
    // Remove trailing slash if present
    const url = envUrl.trim().replace(/\/$/, "");
    // Validate it's a proper URL
    try {
      const urlObj = new URL(url);
      // Validate URL is not localhost in production
      if (isProduction && (urlObj.hostname === "localhost" || urlObj.hostname === "127.0.0.1")) {
        throw new Error(
          `PUBLIC_APP_URL is set to localhost (${url}) but you're in production. ` +
            `Please set PUBLIC_APP_URL to your production URL (e.g., https://yourdomain.com)`
        );
      }
      // PUBLIC_APP_URL is set and valid - use it
      return url;
    } catch (error) {
      // Re-throw if it's our validation error
      if (error instanceof Error && error.message.includes("PUBLIC_APP_URL is set to localhost")) {
        throw error;
      }
      // If invalid URL, throw error in production
      if (isProduction) {
        throw new Error(
          `PUBLIC_APP_URL is set but invalid: "${envUrl}". ` +
            `Please set it to a valid URL (e.g., https://yourdomain.com)`
        );
      }
      // In development, fall through to window.location.origin for invalid URLs
    }
  }

  // PRIORITY 2: Fallback to window.location.origin (only allowed in development)
  if (typeof window !== "undefined" && window.location) {
    const origin = window.location.origin;

    if (isProduction) {
      // In production, PUBLIC_APP_URL is REQUIRED
      // Throw error instead of silently falling back
      throw new Error(
        `PUBLIC_APP_URL is not set in production. ` +
          `Please set PUBLIC_APP_URL environment variable to your production URL (e.g., https://yourdomain.com).`
      );
    }

    // Development: allow window.location.origin fallback
    return origin;
  }

  // This should not happen in client-side code
  throw new Error(
    "Cannot determine application URL. " +
      "In production, PUBLIC_APP_URL environment variable must be set. " +
      "In development, ensure code runs in browser context."
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
