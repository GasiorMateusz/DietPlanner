import type { APIRoute } from "astro";
import { AiSessionService } from "../../../../../lib/ai/session.service.ts";
import { NotFoundError } from "../../../../../lib/errors.ts";
import { OpenRouterError } from "../../../../../lib/ai/openrouter.service.ts";
import { sendAiMessageSchema } from "../../../../../lib/validation/ai.schemas.ts";
import type { SendAiMessageCommand } from "../../../../../types.ts";
import { getUserFromRequest } from "@/lib/auth/session.service.js";

export const prerender = false;

/**
 * POST /api/ai/sessions/{id}/message
 *
 * Sends a follow-up message to an existing AI chat session.
 * Requires authentication via Authorization header.
 * Appends the user's message to the session history, calls OpenRouter.ai,
 * updates the database with the new message history and incremented prompt count,
 * and returns the AI's response.
 * Validates the request body against SendAiMessageCommand schema.
 * Verifies session exists and belongs to the user.
 *
 * @returns 200 OK with session_id, message, and prompt_count
 * @returns 400 Bad Request if validation fails or invalid JSON
 * @returns 401 Unauthorized if no valid session
 * @returns 404 Not Found if session doesn't exist or doesn't belong to user
 * @returns 500 Internal Server Error for database failures
 * @returns 502 Bad Gateway for OpenRouter API failures
 */
export const POST: APIRoute = async (context) => {
  try {
    const { params, request, locals } = context;
    const supabase = locals.supabase;
    const user = await getUserFromRequest(context);

    // Extract session ID from URL path
    const sessionId = params.id;
    if (!sessionId) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: [{ path: ["id"], message: "Session ID is required" }],
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

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
    const validation = sendAiMessageSchema.safeParse(body);
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

    // Send the message to the AI session
    // validation.data matches SendAiMessageCommand
    const responseDto = await AiSessionService.sendMessage(
      sessionId,
      validation.data as SendAiMessageCommand,
      user.id,
      supabase,
    );

    return new Response(JSON.stringify(responseDto), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle NotFoundError (404 Not Found)
    if (error instanceof NotFoundError) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

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
