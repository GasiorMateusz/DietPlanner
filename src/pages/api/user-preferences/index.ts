import type { APIRoute } from "astro";
import { DatabaseError, UnauthorizedError, ValidationError } from "../../../lib/errors.ts";
import * as UserPreferenceService from "../../../lib/user-preferences/user-preference.service.ts";
import {
  getLanguagePreferenceResponseSchema,
  updateLanguagePreferenceSchema,
} from "../../../lib/validation/user-preferences.schemas.ts";
import { getUserFromRequest } from "@/lib/auth/session.service.js";

export const prerender = false;

/**
 * GET /api/user-preferences
 *
 * Retrieves the authenticated user's language preference.
 * Returns default "en" if no preference exists.
 *
 * @returns 200 OK with language preference
 * @returns 401 Unauthorized if authentication fails
 * @returns 500 Internal Server Error for database failures
 */
export const GET: APIRoute = async (context) => {
  try {
    const { locals } = context;
    const supabase = locals.supabase;
    const user = await getUserFromRequest(context);

    // Call service to get language preference
    const preference = await UserPreferenceService.getUserLanguagePreference(user.id, supabase);

    // Validate response
    const validation = getLanguagePreferenceResponseSchema.safeParse(preference);
    if (!validation.success) {
      // eslint-disable-next-line no-console
      console.error("Invalid language preference format:", validation.error);
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
 * Updates the authenticated user's language preference.
 * Creates a new preference record if one doesn't exist.
 *
 * Request Body:
 * - language (required): Language code ("en" or "pl")
 *
 * @returns 200 OK with updated language preference
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
    const validation = updateLanguagePreferenceSchema.safeParse(body);
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

    // Call service to update language preference
    const preference = await UserPreferenceService.updateUserLanguagePreference(
      user.id,
      validation.data.language,
      supabase
    );

    // Validate response
    const responseValidation = getLanguagePreferenceResponseSchema.safeParse(preference);
    if (!responseValidation.success) {
      // eslint-disable-next-line no-console
      console.error("Invalid language preference format:", responseValidation.error);
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
