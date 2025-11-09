import { getAuthHeaders, handleApiResponse } from "./base.client";
import { getAuthToken } from "@/lib/auth/get-auth-token";
import type {
  GetLanguagePreferenceResponseDto,
  UpdateLanguagePreferenceCommand,
  UpdateLanguagePreferenceResponseDto,
} from "../../types.ts";

/**
 * API client for user preferences endpoints.
 */
export const userPreferencesApi = {
  /**
   * Gets the current user's language preference.
   * @returns Language preference (defaults to "en" if not set or user not authenticated)
   * @throws {Error} Only for non-401 errors (network issues, etc.)
   */
  async getLanguagePreference(): Promise<GetLanguagePreferenceResponseDto> {
    try {
      const token = await getAuthToken();
      if (!token) {
        // User not authenticated, return default
        return { language: "en" };
      }

      const headers: HeadersInit = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      const response = await fetch("/api/user-preferences", {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        if (response.status === 401) {
          // User not authenticated, return default (don't redirect here)
          return { language: "en" };
        }
        throw new Error("Failed to fetch language preference");
      }

      return handleApiResponse<GetLanguagePreferenceResponseDto>(response);
    } catch (error) {
      // If getAuthToken throws or fetch fails, return default
      if (error instanceof Error && error.message === "Unauthorized") {
        return { language: "en" };
      }
      // For other errors, still return default but log in dev
      if (import.meta.env.DEV) {
        console.warn("Failed to fetch language preference:", error);
      }
      return { language: "en" };
    }
  },

  /**
   * Updates the current user's language preference.
   * @param command - Language preference update command
   * @returns Updated language preference
   * @throws {Error} If the request fails
   */
  async updateLanguagePreference(
    command: UpdateLanguagePreferenceCommand
  ): Promise<UpdateLanguagePreferenceResponseDto> {
    const headers = await getAuthHeaders();
    const response = await fetch("/api/user-preferences", {
      method: "PUT",
      headers,
      body: JSON.stringify(command),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Unauthorized");
      }
      if (response.status === 400) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Invalid language preference");
      }
      throw new Error("Failed to update language preference");
    }

    return handleApiResponse<UpdateLanguagePreferenceResponseDto>(response);
  },
};
