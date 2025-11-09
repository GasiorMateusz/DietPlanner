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
  // 1. Delete all meal plans for the user
  const { error: mealPlansError } = await supabase.from("meal_plans").delete().eq("user_id", userId);

  if (mealPlansError) {
    throw new DatabaseError(`Failed to delete meal plans for user ${userId}`, mealPlansError);
  }

  // 2. Preserve ai_chat_sessions (no deletion - explicitly do nothing)
  // This is intentional - chat sessions are kept for analytics

  // 3. Delete the auth user using admin client
  const { error: authDeleteError } = await adminSupabase.auth.admin.deleteUser(userId);

  if (authDeleteError) {
    throw new DatabaseError(`Failed to delete auth user ${userId}`, authDeleteError);
  }
}
