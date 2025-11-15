import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types.ts";
import { DatabaseError } from "../errors.ts";
import type { LanguageCode } from "../i18n/types";
import type { Theme } from "../../types.ts";
import { DEFAULT_AI_MODEL } from "../ai/models.config.ts";

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

/**
 * Gets the user's theme preference from the database.
 * Returns default "light" if no preference exists.
 * @param userId - The authenticated user's ID
 * @param supabase - The Supabase client instance
 * @returns Theme preference (defaults to "light" if not set)
 * @throws {DatabaseError} If the database query fails
 */
export async function getUserThemePreference(
  userId: string,
  supabase: SupabaseClient<Database>
): Promise<{ theme: Theme }> {
  const { data, error } = await supabase.from("user_preferences").select("theme").eq("user_id", userId).maybeSingle();

  if (error) {
    throw new DatabaseError({
      message: "Failed to fetch user theme preference",
      originalError: error,
    });
  }

  // If no preference exists, return default "light"
  if (!data) {
    return { theme: "light" };
  }

  return { theme: data.theme as Theme };
}

/**
 * Updates or creates the user's theme preference in the database.
 * Uses upsert to handle both insert and update cases.
 * @param userId - The authenticated user's ID
 * @param theme - The theme to set
 * @param supabase - The Supabase client instance
 * @returns Updated theme preference
 * @throws {DatabaseError} If the database operation fails
 */
export async function updateUserThemePreference(
  userId: string,
  theme: Theme,
  supabase: SupabaseClient<Database>
): Promise<{ theme: Theme }> {
  const { data, error } = await supabase
    .from("user_preferences")
    .upsert(
      {
        user_id: userId,
        theme,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      }
    )
    .select("theme")
    .single();

  if (error) {
    throw new DatabaseError({
      message: "Failed to update user theme preference",
      originalError: error,
    });
  }

  return { theme: data.theme as Theme };
}

/**
 * Gets the user's AI model preference from the database.
 * Returns default model if no preference exists.
 * @param userId - The authenticated user's ID
 * @param supabase - The Supabase client instance
 * @returns AI model preference (defaults to DEFAULT_AI_MODEL if not set)
 * @throws {DatabaseError} If the database query fails
 */
export async function getUserAiModelPreference(
  userId: string,
  supabase: SupabaseClient<Database>
): Promise<{ model: string }> {
  const { data, error } = await supabase
    .from("user_preferences")
    .select("ai_model")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new DatabaseError({
      message: "Failed to fetch user AI model preference",
      originalError: error,
    });
  }

  // If no preference exists, return default
  if (!data || !data.ai_model) {
    return { model: DEFAULT_AI_MODEL };
  }

  return { model: data.ai_model };
}

/**
 * Updates or creates the user's AI model preference in the database.
 * Uses upsert to handle both insert and update cases.
 * @param userId - The authenticated user's ID
 * @param model - The OpenRouter model identifier to set
 * @param supabase - The Supabase client instance
 * @returns Updated AI model preference
 * @throws {DatabaseError} If the database operation fails
 */
export async function updateUserAiModelPreference(
  userId: string,
  model: string,
  supabase: SupabaseClient<Database>
): Promise<{ model: string }> {
  const { data, error } = await supabase
    .from("user_preferences")
    .upsert(
      {
        user_id: userId,
        ai_model: model,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      }
    )
    .select("ai_model")
    .single();

  if (error) {
    throw new DatabaseError({
      message: "Failed to update user AI model preference",
      originalError: error,
    });
  }

  return { model: data.ai_model ?? DEFAULT_AI_MODEL };
}

/**
 * Gets all user preferences (language, theme, terms acceptance, and AI model) from the database.
 * Returns defaults if no preference exists.
 * @param userId - The authenticated user's ID
 * @param supabase - The Supabase client instance
 * @returns All user preferences (defaults to "en", "light", terms_accepted: false, and DEFAULT_AI_MODEL if not set)
 * @throws {DatabaseError} If the database query fails
 */
export async function getAllUserPreferences(
  userId: string,
  supabase: SupabaseClient<Database>
): Promise<{
  language: LanguageCode;
  theme: Theme;
  terms_accepted: boolean;
  terms_accepted_at: string | null;
  ai_model: string | null;
}> {
  const { data, error } = await supabase
    .from("user_preferences")
    .select("language, theme, terms_accepted, terms_accepted_at, ai_model")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new DatabaseError({
      message: "Failed to fetch user preferences",
      originalError: error,
    });
  }

  // If no preference exists, return defaults
  if (!data) {
    return {
      language: "en",
      theme: "light",
      terms_accepted: false,
      terms_accepted_at: null,
      ai_model: null,
    };
  }

  return {
    language: data.language as LanguageCode,
    theme: data.theme as Theme,
    terms_accepted: (data.terms_accepted as boolean) ?? false,
    terms_accepted_at: (data.terms_accepted_at as string | null) ?? null,
    ai_model: (data.ai_model as string | null) ?? null,
  };
}

/**
 * Updates or creates user preferences (language, theme, terms acceptance, and/or AI model) in the database.
 * Uses upsert to handle both insert and update cases.
 * Accepts partial updates - only provided fields are updated.
 * @param userId - The authenticated user's ID
 * @param preferences - Partial preferences object (language, theme, terms_accepted, and/or ai_model)
 * @param supabase - The Supabase client instance
 * @returns Updated preferences (includes language, theme, terms_accepted, terms_accepted_at, and ai_model)
 * @throws {DatabaseError} If the database operation fails
 */
export async function updateUserPreferences(
  userId: string,
  preferences: {
    language?: LanguageCode;
    theme?: Theme;
    terms_accepted?: boolean;
    ai_model?: string;
  },
  supabase: SupabaseClient<Database>
): Promise<{
  language: LanguageCode;
  theme: Theme;
  terms_accepted: boolean;
  terms_accepted_at: string | null;
  ai_model: string | null;
}> {
  // First, get current preferences to preserve values not being updated
  const current = await getAllUserPreferences(userId, supabase);

  // Merge current preferences with new ones
  // Note: terms_accepted_at is set automatically by database trigger when terms_accepted changes to true
  const updatedPreferences = {
    user_id: userId,
    language: preferences.language ?? current.language,
    theme: preferences.theme ?? current.theme,
    terms_accepted: preferences.terms_accepted ?? current.terms_accepted,
    ai_model: preferences.ai_model ?? current.ai_model,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("user_preferences")
    .upsert(updatedPreferences, {
      onConflict: "user_id",
    })
    .select("language, theme, terms_accepted, terms_accepted_at, ai_model")
    .single();

  if (error) {
    throw new DatabaseError({
      message: "Failed to update user preferences",
      originalError: error,
    });
  }

  return {
    language: data.language as LanguageCode,
    theme: data.theme as Theme,
    terms_accepted: (data.terms_accepted as boolean) ?? false,
    terms_accepted_at: (data.terms_accepted_at as string | null) ?? null,
    ai_model: (data.ai_model as string | null) ?? null,
  };
}
