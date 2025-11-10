import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import { DatabaseError } from "../errors";

/**
 * Permanently deletes a user's account and all associated data.
 * This includes:
 * - All meal plans owned by the user
 * - The auth user record (via admin client)
 *
 * Note: AI chat sessions are preserved for analytical purposes and are NOT deleted.
 *
 * @param userId - The ID of the user to delete
 * @param supabase - The regular Supabase client (for deleting meal plans)
 * @param adminSupabase - The admin Supabase client (for deleting auth user)
 * @throws {DatabaseError} If any database operation fails
 */
export async function deleteUserAccount(
  userId: string,
  supabase: SupabaseClient<Database>,
  adminSupabase: SupabaseClient<Database>
): Promise<void> {
  // eslint-disable-next-line no-console
  console.log("[deleteUserAccount] Starting deletion for user:", userId);

  // 1. Delete all meal plans for the user
  // eslint-disable-next-line no-console
  console.log("[deleteUserAccount] Step 1: Deleting meal plans...");
  const { error: mealPlansError, data: mealPlansData } = await supabase
    .from("meal_plans")
    .delete()
    .eq("user_id", userId)
    .select();

  if (mealPlansError) {
    // eslint-disable-next-line no-console
    console.error("[deleteUserAccount] Failed to delete meal plans:", {
      userId,
      error: mealPlansError,
      code: mealPlansError.code,
      message: mealPlansError.message,
      details: mealPlansError.details,
      hint: mealPlansError.hint,
    });
    throw new DatabaseError(`Failed to delete meal plans for user ${userId}`, mealPlansError);
  }

  // eslint-disable-next-line no-console
  console.log("[deleteUserAccount] Meal plans deleted successfully:", {
    userId,
    deletedCount: mealPlansData?.length ?? 0,
  });

  // 2. Preserve ai_chat_sessions (no deletion - explicitly do nothing)
  // This is intentional - chat sessions are kept for analytics
  // eslint-disable-next-line no-console
  console.log("[deleteUserAccount] Step 2: Preserving ai_chat_sessions (skipped)");

  // 3. Delete the auth user using admin client
  // eslint-disable-next-line no-console
  console.log("[deleteUserAccount] Step 3: Deleting auth user via admin client...");
  const { error: authDeleteError } = await adminSupabase.auth.admin.deleteUser(userId);

  if (authDeleteError) {
    // eslint-disable-next-line no-console
    console.error("[deleteUserAccount] Failed to delete auth user:", {
      userId,
      error: authDeleteError,
      code: authDeleteError.code,
      message: authDeleteError.message,
      status: authDeleteError.status,
    });
    throw new DatabaseError(`Failed to delete auth user ${userId}`, authDeleteError);
  }

  // eslint-disable-next-line no-console
  console.log("[deleteUserAccount] Auth user deleted successfully:", userId);
}
