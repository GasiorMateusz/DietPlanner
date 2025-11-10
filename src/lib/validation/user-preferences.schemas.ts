import { z } from "zod";

/**
 * Schema for validating language code.
 */
export const languageCodeSchema = z.enum(["en", "pl"]);

/**
 * Schema for validating the GET /api/user-preferences response.
 */
export const getLanguagePreferenceResponseSchema = z.object({
  language: languageCodeSchema,
});

/**
 * Schema for validating the PUT /api/user-preferences request body.
 */
export const updateLanguagePreferenceSchema = z.object({
  language: languageCodeSchema,
});
