import { getAuthHeaders, handleApiResponse } from "./base.client";
import { getAuthToken } from "@/lib/auth/get-auth-token";
import type {
  GetLanguagePreferenceResponseDto,
  UpdateLanguagePreferenceCommand,
  UpdateLanguagePreferenceResponseDto,
  GetThemePreferenceResponseDto,
  UpdateThemePreferenceCommand,
  UpdateThemePreferenceResponseDto,
  GetAllPreferencesResponseDto,
  UpdatePreferencesCommand,
  UpdatePreferencesResponseDto,
  GetAiModelPreferenceResponseDto,
  UpdateAiModelPreferenceCommand,
} from "../../types.ts";
import { DEFAULT_AI_MODEL } from "../../lib/ai/models.config.ts";

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
      const allPreferences = await this.getAllPreferences();
      return { language: allPreferences.language };
    } catch (error) {
      // If getAllPreferences fails, return default
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn("Failed to fetch language preference:", error);
      }
      return { language: "en" };
    }
  },

  /**
   * Gets the current user's theme preference.
   * @returns Theme preference (defaults to "light" if not set or user not authenticated)
   * @throws {Error} Only for non-401 errors (network issues, etc.)
   */
  async getThemePreference(): Promise<GetThemePreferenceResponseDto> {
    try {
      const allPreferences = await this.getAllPreferences();
      return { theme: allPreferences.theme };
    } catch (error) {
      // If getAllPreferences fails, return default
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn("Failed to fetch theme preference:", error);
      }
      return { theme: "light" };
    }
  },

  /**
   * Gets all user preferences (language, theme, terms acceptance, and AI model).
   * @returns All preferences (defaults to "en", "light", terms_accepted: false, and ai_model: null if not set or user not authenticated)
   * @throws {Error} Only for non-401 errors (network issues, etc.)
   */
  async getAllPreferences(): Promise<GetAllPreferencesResponseDto> {
    try {
      const token = await getAuthToken();
      if (!token) {
        // User not authenticated, return defaults
        return {
          language: "en",
          theme: "light",
          terms_accepted: false,
          terms_accepted_at: null,
          ai_model: null,
        };
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
          // User not authenticated, return defaults (don't redirect here)
          return {
            language: "en",
            theme: "light",
            terms_accepted: false,
            terms_accepted_at: null,
            ai_model: null,
          };
        }
        throw new Error("Failed to fetch user preferences");
      }

      return handleApiResponse<GetAllPreferencesResponseDto>(response);
    } catch (error) {
      // If getAuthToken throws or fetch fails, return defaults
      if (error instanceof Error && error.message === "Unauthorized") {
        return {
          language: "en",
          theme: "light",
          terms_accepted: false,
          terms_accepted_at: null,
          ai_model: null,
        };
      }
      // For other errors, still return defaults but log in dev
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn("Failed to fetch user preferences:", error);
      }
      return {
        language: "en",
        theme: "light",
        terms_accepted: false,
        terms_accepted_at: null,
        ai_model: null,
      };
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
    const allPreferences = await this.updatePreferences({ language: command.language });
    return { language: allPreferences.language };
  },

  /**
   * Updates the current user's theme preference.
   * @param command - Theme preference update command
   * @returns Updated theme preference
   * @throws {Error} If the request fails
   */
  async updateThemePreference(command: UpdateThemePreferenceCommand): Promise<UpdateThemePreferenceResponseDto> {
    const allPreferences = await this.updatePreferences({ theme: command.theme });
    return { theme: allPreferences.theme };
  },

  /**
   * Gets the current user's AI model preference.
   * @returns AI model preference (defaults to DEFAULT_AI_MODEL if not set or user not authenticated)
   * @throws {Error} Only for non-401 errors (network issues, etc.)
   */
  async getAiModelPreference(): Promise<GetAiModelPreferenceResponseDto> {
    try {
      const allPreferences = await this.getAllPreferences();
      return { model: allPreferences.ai_model ?? DEFAULT_AI_MODEL };
    } catch (error) {
      // If getAllPreferences fails, return default
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn("Failed to fetch AI model preference:", error);
      }
      return { model: DEFAULT_AI_MODEL };
    }
  },

  /**
   * Updates the current user's AI model preference.
   * @param command - AI model preference update command
   * @returns Updated AI model preference
   * @throws {Error} If the request fails
   */
  async updateAiModelPreference(command: UpdateAiModelPreferenceCommand): Promise<GetAiModelPreferenceResponseDto> {
    const allPreferences = await this.updatePreferences({ ai_model: command.model });
    return { model: allPreferences.ai_model ?? DEFAULT_AI_MODEL };
  },

  /**
   * Updates user preferences (language, theme, terms acceptance, and/or AI model).
   * @param command - Preferences update command (partial)
   * @returns Updated preferences
   * @throws {Error} If the request fails
   */
  async updatePreferences(command: UpdatePreferencesCommand): Promise<UpdatePreferencesResponseDto> {
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
        throw new Error(errorData.error || "Invalid preferences");
      }
      throw new Error("Failed to update preferences");
    }

    return handleApiResponse<UpdatePreferencesResponseDto>(response);
  },
};
