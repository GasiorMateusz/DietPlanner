import type { APIRoute } from "astro";
import { createAiSessionSchema } from "../../../lib/validation/ai.schemas.ts";
import * as AiSessionService from "../../../lib/ai/session.service.ts";
import { OpenRouterError } from "../../../lib/ai/openrouter.service.ts";
import type { CreateAiSessionCommand } from "../../../types.ts";
import { getUserFromRequest } from "@/lib/auth/session.service.js";

export const prerender = false;

/**
 * POST /api/ai/sessions
 *
 * Creates a new AI chat session with an initial meal plan generation request.
 * Requires authentication via Authorization header.
 * Validates the request body against CreateAiSessionCommand schema.
 * Calls OpenRouter AI service to generate the initial response.
 * Saves the session to the database for telemetry.
 *
 * @returns 201 Created with session_id, message, and prompt_count
 * @returns 400 Bad Request if validation fails
 * @returns 401 Unauthorized if no valid session
 * @returns 500 Internal Server Error for database failures
 * @returns 502 Bad Gateway for OpenRouter API failures
 */
export const POST: APIRoute = async (context) => {
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
    const validation = createAiSessionSchema.safeParse(body);
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

    // Create the AI session
    // validation.data matches CreateAiSessionCommand (which is MealPlanStartupData)
    const responseDto = await AiSessionService.createSession(
      validation.data as CreateAiSessionCommand,
      user.id,
      supabase
    );

    return new Response(JSON.stringify(responseDto), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle OpenRouter errors (502 Bad Gateway)
    if (error instanceof OpenRouterError) {
      // eslint-disable-next-line no-console
      console.error("OpenRouter error:", error.message, error.statusCode);
      return new Response(JSON.stringify({ error: "AI service unavailable" }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle other errors (500 Internal Server Error)
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
