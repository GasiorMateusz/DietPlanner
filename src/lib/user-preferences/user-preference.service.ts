import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types.ts";
import { DatabaseError } from "../errors.ts";
import type { LanguageCode } from "../i18n/types";

/**
 * Gets the user's language preference from the database.
 * Returns default "en" if no preference exists.
 * @param userId - The authenticated user's ID
 * @param supabase - The Supabase client instance
 * @returns Language preference (defaults to "en" if not set)
 * @throws {DatabaseError} If the database query fails
 */
export async function getUserLanguagePreference(
  userId: string,
  supabase: SupabaseClient<Database>
): Promise<{ language: LanguageCode }> {
  const { data, error } = await supabase
    .from("user_preferences")
    .select("language")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new DatabaseError({
      message: "Failed to fetch user language preference",
      originalError: error,
    });
  }

  // If no preference exists, return default "en"
  if (!data) {
    return { language: "en" };
  }

  return { language: data.language as LanguageCode };
}

/**
 * Updates or creates the user's language preference in the database.
 * Uses upsert to handle both insert and update cases.
 * @param userId - The authenticated user's ID
 * @param language - The language code to set
 * @param supabase - The Supabase client instance
 * @returns Updated language preference
 * @throws {DatabaseError} If the database operation fails
 */
export async function updateUserLanguagePreference(
  userId: string,
  language: LanguageCode,
  supabase: SupabaseClient<Database>
): Promise<{ language: LanguageCode }> {
  const { data, error } = await supabase
    .from("user_preferences")
    .upsert(
      {
        user_id: userId,
        language,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      }
    )
    .select("language")
    .single();

  if (error) {
    throw new DatabaseError({
      message: "Failed to update user language preference",
      originalError: error,
    });
  }

  return { language: data.language as LanguageCode };
}
