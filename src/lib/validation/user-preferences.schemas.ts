import { z } from "zod";
import { isValidModelId } from "../../lib/ai/models.config.ts";

/**
 * Schema for validating language code.
 */
export const languageCodeSchema = z.enum(["en", "pl"]);

/**
 * Schema for validating theme.
 */
export const themeSchema = z.enum(["light", "dark"]);

/**
 * Schema for validating AI model identifier.
 * Validates that the model ID exists in the available models list.
 */
export const aiModelSchema = z
  .string()
  .min(1, "Model is required")
  .refine(
    (modelId) => isValidModelId(modelId),
    (modelId) => ({
      message: `Invalid model ID: ${modelId}. Model must be one of the available models.`,
    })
  );

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
  terms_accepted: z.boolean(),
  terms_accepted_at: z.string().nullable(),
  ai_model: z.string().nullable(),
});

/**
 * Schema for validating the PUT /api/user-preferences request body (all preferences, partial).
 */
export const updatePreferencesSchema = z
  .object({
    language: languageCodeSchema.optional(),
    theme: themeSchema.optional(),
    terms_accepted: z.boolean().optional(),
    ai_model: aiModelSchema.optional(),
  })
  .refine(
    (data) =>
      data.language !== undefined ||
      data.theme !== undefined ||
      data.terms_accepted !== undefined ||
      data.ai_model !== undefined,
    {
      message: "At least one preference (language, theme, terms_accepted, or ai_model) must be provided",
    }
  );

/**
 * Schema for validating the GET /api/user-preferences response (AI model only).
 */
export const getAiModelPreferenceResponseSchema = z.object({
  model: z.string(),
});

/**
 * Schema for validating the PUT /api/user-preferences request body (AI model only).
 */
export const updateAiModelPreferenceSchema = z.object({
  model: aiModelSchema,
});
