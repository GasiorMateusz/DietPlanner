import type { APIRoute } from "astro";
import { DatabaseError, UnauthorizedError, ValidationError } from "../../../lib/errors.ts";
import * as UserPreferenceService from "../../../lib/user-preferences/user-preference.service.ts";
import {
  getAllPreferencesResponseSchema,
  updatePreferencesSchema,
} from "../../../lib/validation/user-preferences.schemas.ts";
import { getUserFromRequest } from "@/lib/auth/session.service.js";

export const prerender = false;

/**
 * GET /api/user-preferences
 *
 * Retrieves the authenticated user's preferences (language, theme, terms acceptance, and AI model).
 * Returns defaults ("en", "light", terms_accepted: false, and ai_model: null) if no preference exists.
 *
 * Response includes:
 * - language: Language code ("en" or "pl")
 * - theme: Theme preference ("light" or "dark")
 * - terms_accepted: Boolean indicating if user has accepted Terms and Privacy Policy
 * - terms_accepted_at: Timestamp when user accepted terms (null if not accepted)
 * - ai_model: OpenRouter model identifier (null if not set, defaults to "openai/gpt-4.1-nano" in service layer)
 *
 * @returns 200 OK with user preferences (language, theme, terms_accepted, terms_accepted_at, ai_model)
 * @returns 401 Unauthorized if authentication fails
 * @returns 500 Internal Server Error for database failures
 */
export const GET: APIRoute = async (context) => {
  try {
    const { locals } = context;
    const supabase = locals.supabase;
    const user = await getUserFromRequest(context);

    // Call service to get all preferences
    const preferences = await UserPreferenceService.getAllUserPreferences(user.id, supabase);

    // Validate response
    const validation = getAllPreferencesResponseSchema.safeParse(preferences);
    if (!validation.success) {
      // eslint-disable-next-line no-console
      console.error("Invalid preferences format:", validation.error);
      return new Response(
        JSON.stringify({
          error: "An internal error occurred",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify(validation.data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return new Response(
        JSON.stringify({
          error: error.message,
          details: error.data.details,
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (error instanceof DatabaseError) {
      // eslint-disable-next-line no-console
      console.error("Database error:", error.message, error.originalError);
      return new Response(
        JSON.stringify({
          error: "An internal error occurred",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Handle unexpected errors
    // eslint-disable-next-line no-console
    console.error("Internal server error:", error);
    return new Response(
      JSON.stringify({
        error: "An internal error occurred",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

/**
 * PUT /api/user-preferences
 *
 * Updates the authenticated user's preferences (language, theme, terms acceptance, and/or AI model).
 * Creates a new preference record if one doesn't exist.
 * Accepts partial updates - only provided fields are updated.
 *
 * Request Body:
 * - language (optional): Language code ("en" or "pl")
 * - theme (optional): Theme ("light" or "dark")
 * - terms_accepted (optional): Boolean indicating acceptance of Terms and Privacy Policy
 * - ai_model (optional): OpenRouter model identifier (must be a valid model ID from available models)
 * At least one field must be provided.
 *
 * Notes:
 * - When terms_accepted is set to true, terms_accepted_at is automatically set by database trigger
 * - When terms_accepted is set to false, terms_accepted_at is automatically cleared by database trigger
 * - terms_accepted_at cannot be set directly via API - it's managed by the database trigger
 * - ai_model must be validated against available models list
 *
 * Response includes:
 * - language: Language code ("en" or "pl")
 * - theme: Theme preference ("light" or "dark")
 * - terms_accepted: Boolean indicating if user has accepted Terms and Privacy Policy
 * - terms_accepted_at: Timestamp when user accepted terms (null if not accepted, set automatically)
 * - ai_model: OpenRouter model identifier (null if not set)
 *
 * @returns 200 OK with updated preferences (language, theme, terms_accepted, terms_accepted_at, ai_model)
 * @returns 400 Bad Request if request body fails validation
 * @returns 401 Unauthorized if authentication fails
 * @returns 500 Internal Server Error for database failures
 */
export const PUT: APIRoute = async (context) => {
  try {
    const { request, locals } = context;
    const supabase = locals.supabase;
    const user = await getUserFromRequest(context);

    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: "Invalid JSON in request body",
          details: error instanceof Error ? error.message : "Unknown error",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate request body
    const validation = updatePreferencesSchema.safeParse(body);
    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: validation.error.errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Call service to update preferences
    // Map ai_model from request to service parameter
    const servicePreferences: {
      language?: string;
      theme?: string;
      terms_accepted?: boolean;
      ai_model?: string;
    } = {
      language: validation.data.language,
      theme: validation.data.theme,
      terms_accepted: validation.data.terms_accepted,
      ai_model: validation.data.ai_model,
    };
    const preferences = await UserPreferenceService.updateUserPreferences(user.id, servicePreferences, supabase);

    // Validate response
    const responseValidation = getAllPreferencesResponseSchema.safeParse(preferences);
    if (!responseValidation.success) {
      // eslint-disable-next-line no-console
      console.error("Invalid preferences format:", responseValidation.error);
      return new Response(
        JSON.stringify({
          error: "An internal error occurred",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify(responseValidation.data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return new Response(
        JSON.stringify({
          error: error.message,
          details: error.data.details,
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (error instanceof ValidationError) {
      return new Response(
        JSON.stringify({
          error: error.message,
          details: error.details,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (error instanceof DatabaseError) {
      // eslint-disable-next-line no-console
      console.error("Database error:", error.message, error.originalError);
      return new Response(
        JSON.stringify({
          error: "An internal error occurred",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Handle unexpected errors
    // eslint-disable-next-line no-console
    console.error("Internal server error:", error);
    return new Response(
      JSON.stringify({
        error: "An internal error occurred",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
