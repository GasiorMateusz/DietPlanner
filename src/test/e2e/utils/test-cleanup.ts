import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../../db/database.types.ts";

/**
 * Creates a Supabase admin client for test cleanup operations.
 * Uses service role key if available, otherwise falls back to anon key.
 */
export function createTestSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.SUPABASE_KEY || process.env.PUBLIC_SUPABASE_KEY;

  if (!supabaseUrl) {
    throw new Error(
      "SUPABASE_URL or PUBLIC_SUPABASE_URL must be set for test cleanup"
    );
  }

  // Prefer service role key for admin operations (bypasses RLS)
  const key = serviceRoleKey || anonKey;

  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY or SUPABASE_KEY must be set for test cleanup"
    );
  }

  return createClient<Database>(supabaseUrl, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Gets the user ID for the test user from their email.
 * Requires SUPABASE_SERVICE_ROLE_KEY to access admin API.
 * Falls back to querying meal_plans table to find user_id if admin API is unavailable.
 */
export async function getTestUserId(email: string): Promise<string | null> {
  const supabase = createTestSupabaseClient();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Try admin API first (requires service role key)
  if (serviceRoleKey) {
    try {
      const { data, error } = await supabase.auth.admin.getUserByEmail(email);

      if (!error && data?.user) {
        return data.user.id;
      }

      if (error) {
        console.warn(
          `Admin API failed to get user ID for ${email}:`,
          error.message
        );
      }
    } catch (error) {
      console.warn(`Error using admin API:`, error);
    }
  }

  // Fallback: Try to find user_id from meal plans with test pattern
  // This works if a meal plan was created during the test
  // Note: This requires service role key to bypass RLS, or RLS must allow this query
  try {
    // Try to find any meal plan matching the test pattern and get its user_id
    // Using a service role key here would allow this to work
    const testPattern = "test meal plan";
    const { data: mealPlans, error } = await supabase
      .from("meal_plans")
      .select("user_id")
      .ilike("name", `%${testPattern}%`)
      .limit(1);

    if (!error && mealPlans && mealPlans.length > 0) {
      const userId = mealPlans[0].user_id;
      console.log(
        `Found user ID from meal plan (fallback method): ${userId}`
      );
      return userId;
    }

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "no rows returned" which is fine
      console.warn(`Failed to query meal plans for user ID:`, error.message);
    }
  } catch (error) {
    // Ignore fallback errors
    console.warn(`Fallback method failed:`, error);
  }

  // If all methods fail, warn but don't fail
  if (!serviceRoleKey) {
    console.warn(
      `Service role key not available. Cleanup may be limited. ` +
        `Consider setting SUPABASE_SERVICE_ROLE_KEY for full cleanup support.`
    );
  }

  return null;
}

/**
 * Deletes meal plans by name pattern.
 * Useful for cleaning up test data created during e2e tests.
 * Works with or without userId - uses service role key to bypass RLS when needed.
 */
export async function cleanupMealPlansByNamePattern(
  userId: string | null,
  namePattern: string
): Promise<number> {
  const supabase = createTestSupabaseClient();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // If we don't have userId, try to find it from existing meal plans first
  let actualUserId = userId;
  if (!actualUserId) {
    try {
      // Try to find user_id from any meal plan matching the pattern
      // This works if a meal plan was created before the test failed
      const { data: mealPlans, error } = await supabase
        .from("meal_plans")
        .select("user_id")
        .ilike("name", `%${namePattern}%`)
        .limit(1);

      if (!error && mealPlans && mealPlans.length > 0) {
        actualUserId = mealPlans[0].user_id;
        console.log(
          `Found user ID from existing meal plan for cleanup: ${actualUserId}`
        );
      }
    } catch (error) {
      // Ignore errors - we'll proceed without userId if needed
      console.warn("Could not find user ID from meal plans:", error);
    }
  }

  // Build query to find meal plans to delete
  let query = supabase.from("meal_plans").select("id").ilike("name", `%${namePattern}%`);

  // If we have user_id, filter by it (more precise and safer)
  // If not and we have service role key, we can delete all matching (bypasses RLS)
  if (actualUserId) {
    query = query.eq("user_id", actualUserId);
  }

  // Find all meal plans matching the pattern
  const { data: mealPlans, error: selectError } = await query;

  if (selectError) {
    // If query failed and we don't have service role key, RLS might be blocking
    if (!serviceRoleKey && !actualUserId) {
      console.warn(
        "Cannot clean up meal plans: RLS blocking query. " +
          "Set SUPABASE_SERVICE_ROLE_KEY to enable cleanup on test failures."
      );
    } else {
      console.error("Failed to find meal plans for cleanup:", selectError.message);
    }
    return 0;
  }

  if (!mealPlans || mealPlans.length === 0) {
    return 0;
  }

  // Delete all matching meal plans
  const ids = mealPlans.map((plan) => plan.id);
  let deleteQuery = supabase.from("meal_plans").delete().in("id", ids);

  // Add user filter if we have userId (defense in depth)
  if (actualUserId) {
    deleteQuery = deleteQuery.eq("user_id", actualUserId);
  }

  const { error: deleteError } = await deleteQuery;

  if (deleteError) {
    console.error("Failed to delete meal plans:", deleteError.message);
    
    // If delete failed and we don't have service role key, provide helpful message
    if (!serviceRoleKey) {
      console.warn(
        "Delete failed - RLS may be blocking. " +
          "Set SUPABASE_SERVICE_ROLE_KEY for reliable cleanup on test failures."
      );
    }
    return 0;
  }

  return ids.length;
}

/**
 * Deletes meal plans by their IDs.
 */
export async function cleanupMealPlansByIds(
  userId: string,
  mealPlanIds: string[]
): Promise<void> {
  if (mealPlanIds.length === 0) {
    return;
  }

  const supabase = createTestSupabaseClient();

  const { error } = await supabase
    .from("meal_plans")
    .delete()
    .eq("user_id", userId)
    .in("id", mealPlanIds);

  if (error) {
    console.error("Failed to delete meal plans by IDs:", error.message);
    throw error;
  }
}

/**
 * Deletes AI chat sessions for a specific user.
 * Useful for cleaning up test chat sessions.
 */
export async function cleanupChatSessionsByUserId(userId: string): Promise<number> {
  const supabase = createTestSupabaseClient();

  const { data: sessions, error: selectError } = await supabase
    .from("ai_chat_sessions")
    .select("id")
    .eq("user_id", userId);

  if (selectError) {
    console.error(
      "Failed to find chat sessions for cleanup:",
      selectError.message
    );
    return 0;
  }

  if (!sessions || sessions.length === 0) {
    return 0;
  }

  const ids = sessions.map((session) => session.id);
  const { error: deleteError } = await supabase
    .from("ai_chat_sessions")
    .delete()
    .in("id", ids);

  if (deleteError) {
    console.error("Failed to delete chat sessions:", deleteError.message);
    return 0;
  }

  return ids.length;
}

