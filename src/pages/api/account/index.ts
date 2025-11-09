import type { APIRoute } from "astro";
import { DatabaseError, UnauthorizedError } from "@/lib/errors";
import { getUserFromRequest } from "@/lib/auth/session.service";
import { deleteUserAccount } from "@/lib/account/account.service";
import { createSupabaseAdminClient } from "@/db/supabase.admin";

export const prerender = false;

/**
 * DELETE /api/account
 *
 * Permanently deletes the authenticated user's account and all associated meal plans.
 * AI chat sessions are preserved for analytical purposes.
 *
 * Requires authentication via Authorization header.
 *
 * @returns 204 No Content on success
 * @returns 401 Unauthorized if authentication fails
 * @returns 500 Internal Server Error for database or admin API failures
 */
export const DELETE: APIRoute = async (context) => {
  try {
    const { locals } = context;
    const supabase = locals.supabase;

    // Extract authenticated user from request
    const user = await getUserFromRequest(context);
    const userId = user.id;

    // Create admin client for deleting auth user
    const adminSupabase = createSupabaseAdminClient();

    // Delete user account (meal plans + auth user)
    // Note: ai_chat_sessions are preserved
    await deleteUserAccount(userId, supabase, adminSupabase);

    // Return 204 No Content on success
    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    // Handle UnauthorizedError (from getUserFromRequest)
    if (error instanceof UnauthorizedError) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          details: error.data.details || error.data.message,
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Handle DatabaseError (from deleteUserAccount)
    if (error instanceof DatabaseError) {
      // eslint-disable-next-line no-console
      console.error("Database error during account deletion:", error.message, error.originalError);
      return new Response(
        JSON.stringify({
          error: "Failed to delete account",
          details: "An internal error occurred. Please try again later.",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Handle unexpected errors
    // eslint-disable-next-line no-console
    console.error("Unexpected error during account deletion:", error);
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

