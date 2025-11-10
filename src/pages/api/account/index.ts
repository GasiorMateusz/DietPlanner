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
    // eslint-disable-next-line no-console
    console.log("[DELETE /api/account] Starting account deletion for user:", userId);
    
    let adminSupabase;
    try {
      // eslint-disable-next-line no-console
      console.log("[DELETE /api/account] Attempting to create admin client...");
      adminSupabase = createSupabaseAdminClient();
      // eslint-disable-next-line no-console
      console.log("[DELETE /api/account] Admin client created successfully");
    } catch (adminClientError) {
      // eslint-disable-next-line no-console
      console.error("[DELETE /api/account] Failed to create admin client:", {
        error: adminClientError instanceof Error ? adminClientError.message : String(adminClientError),
        errorName: adminClientError instanceof Error ? adminClientError.name : typeof adminClientError,
        stack: adminClientError instanceof Error ? adminClientError.stack : undefined,
        // Additional debugging info
        importMetaEnvKeys: Object.keys(import.meta.env).filter((key) =>
          key.includes("SUPABASE") || key.includes("SERVICE")
        ),
        hasSupabaseUrl: Boolean(import.meta.env.SUPABASE_URL),
        hasServiceRoleKey: Boolean(import.meta.env.SUPABASE_SERVICE_ROLE_KEY),
      });
      return new Response(
        JSON.stringify({
          error: "Server configuration error",
          details: "Unable to delete account. Please contact support.",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Delete user account (meal plans + auth user)
    // Note: ai_chat_sessions are preserved
    // eslint-disable-next-line no-console
    console.log("[DELETE /api/account] Calling deleteUserAccount...");
    await deleteUserAccount(userId, supabase, adminSupabase);
    // eslint-disable-next-line no-console
    console.log("[DELETE /api/account] Account deletion completed successfully");

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
      console.error("Database error during account deletion:", {
        message: error.message,
        originalError: error.originalError,
        userId:
          error.originalError && typeof error.originalError === "object" && "code" in error.originalError
            ? (error.originalError as { code?: string }).code
            : undefined,
        errorDetails: error.originalError,
      });
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
    console.error("Unexpected error during account deletion:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : typeof error,
      errorObject: error,
    });
    return new Response(
      JSON.stringify({
        error: "An internal error occurred",
        details: "An unexpected error occurred. Please try again later.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
