import { z } from "zod";

/**
 * Schema for validating language code.
 */
export const languageCodeSchema = z.enum(["en", "pl"]);

/**
 * Schema for validating theme.
 */
export const themeSchema = z.enum(["light", "dark"]);

/**
 * Schema for validating the GET /api/user-preferences response (language only).
 */
export const getLanguagePreferenceResponseSchema = z.object({
  language: languageCodeSchema,
});

/**
 * Schema for validating the PUT /api/user-preferences request body (language only).
 */
export const updateLanguagePreferenceSchema = z.object({
  language: languageCodeSchema,
});

/**
 * Schema for validating the GET /api/user-preferences response (theme only).
 */
export const getThemePreferenceResponseSchema = z.object({
  theme: themeSchema,
});

/**
 * Schema for validating the PUT /api/user-preferences request body (theme only).
 */
export const updateThemePreferenceSchema = z.object({
  theme: themeSchema,
});

/**
 * Schema for validating the GET /api/user-preferences response (all preferences).
 */
export const getAllPreferencesResponseSchema = z.object({
  language: languageCodeSchema,
  theme: themeSchema,
});

/**
 * Schema for validating the PUT /api/user-preferences request body (all preferences, partial).
 */
export const updatePreferencesSchema = z.object({
  language: languageCodeSchema.optional(),
  theme: themeSchema.optional(),
}).refine(
  (data) => data.language !== undefined || data.theme !== undefined,
  {
    message: "At least one preference (language or theme) must be provided",
  }
);
