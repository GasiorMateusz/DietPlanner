/**
 * Checks if an error is a refresh token not found error.
 * This error is harmless and can be safely ignored in most cases.
 *
 * @param error - The error to check
 * @returns True if the error is a refresh token not found error
 */
export function isRefreshTokenNotFoundError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const errorCode = (error as { code?: string }).code;
  return errorCode === "refresh_token_not_found";
}
