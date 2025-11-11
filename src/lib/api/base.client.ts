import { getAuthToken } from "@/lib/auth/get-auth-token";

/**
 * Gets authentication headers for API requests.
 * Redirects to login if no token is available.
 * @throws {Error} If unauthorized
 */
export async function getAuthHeaders(): Promise<HeadersInit> {
  const token = await getAuthToken();
  if (!token) {
    window.location.href = "/auth/login";
    throw new Error("Unauthorized");
  }
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

/**
 * Gets authentication headers for requests that don't need Content-Type.
 * Useful for file downloads or blob responses.
 * @throws {Error} If unauthorized
 */
export async function getAuthHeadersWithoutContentType(): Promise<HeadersInit> {
  const token = await getAuthToken();
  if (!token) {
    window.location.href = "/auth/login";
    throw new Error("Unauthorized");
  }
  return {
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Handles API response and extracts JSON data.
 * Automatically handles 401 redirects and error parsing.
 * Handles empty responses (204 No Content) gracefully.
 * @param response - The fetch Response object
 * @returns Parsed JSON data or undefined for empty responses
 * @throws {Error} If response is not OK or unauthorized
 */
export async function handleApiResponse<T>(response: Response): Promise<T> {
  if (response.status === 401) {
    window.location.href = "/auth/login";
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      error: "An error occurred",
    }));

    // Format error message with details if available
    let errorMessage = errorData.error || "An error occurred";

    // If there are validation details, attach them to the error for structured handling
    if (errorData.details && Array.isArray(errorData.details) && errorData.details.length > 0) {
      // Create a custom error that includes the structured details
      const error = new Error(errorMessage);
      (error as any).validationDetails = errorData.details;
      (error as any).isValidationError = true;

      // Also format them into a readable message for backward compatibility
      const validationErrors = errorData.details
        .map((detail: { path?: (string | number)[]; message?: string; code?: string }) => {
          if (!detail.path || detail.path.length === 0) {
            return detail.message || "Invalid value";
          }

          // Format field path to be more readable
          const fieldPath = detail.path
            .map((segment) => {
              // Convert array indices to "item #X" format
              if (typeof segment === "number") {
                return `item ${segment + 1}`;
              }
              // Convert snake_case to Title Case for readability
              return segment
                .split("_")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ");
            })
            .join(" → ");

          return `${fieldPath}: ${detail.message || "Invalid value"}`;
        })
        .join("; ");

      errorMessage = `${errorMessage}. ${validationErrors}`;
      error.message = errorMessage;
      throw error;
    } else if (errorData.details && typeof errorData.details === "string") {
      // If details is a string, append it
      errorMessage = `${errorMessage}. ${errorData.details}`;
    }

    throw new Error(errorMessage);
  }

  // Handle 204 No Content (empty response)
  if (response.status === 204 || response.headers.get("content-length") === "0") {
    return undefined as T;
  }

  // Check if response has content before parsing JSON
  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    return undefined as T;
  }

  const text = await response.text();
  if (!text) {
    return undefined as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    // If parsing fails, return undefined for void responses
    return undefined as T;
  }
}

/**
 * Handles API response for blob requests (e.g., file downloads).
 * Automatically handles 401 redirects.
 * @param response - The fetch Response object
 * @returns Blob data
 * @throws {Error} If response is not OK or unauthorized
 */
export async function handleApiBlobResponse(response: Response): Promise<Blob> {
  if (response.status === 401) {
    window.location.href = "/auth/login";
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      error: "Failed to download file",
    }));
    throw new Error(errorData.error || "Failed to download file");
  }

  return response.blob();
}
