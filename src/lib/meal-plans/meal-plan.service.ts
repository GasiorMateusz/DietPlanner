import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, TablesInsert, TablesUpdate } from "../../db/database.types.ts";
import { DatabaseError, NotFoundError } from "../errors.ts";
import type {
  CreateMealPlanCommand,
  GetMealPlansResponseDto,
  MealPlanListItemDto,
  TypedMealPlanInsert,
  TypedMealPlanRow,
  TypedMealPlanUpdate,
  UpdateMealPlanCommand,
} from "../../types.ts";

/**
 * Filters for listing meal plans.
 */
export interface ListFilters {
  search?: string;
  sort?: "created_at" | "updated_at" | "name";
  order?: "asc" | "desc";
}

/**
 * Lists all meal plans for the authenticated user with optional filtering and sorting.
 * @param userId - The authenticated user's ID
 * @param filters - Optional filters for search and sorting
 * @param supabase - The Supabase client instance
 * @returns Array of meal plan list items
 * @throws {DatabaseError} If the database query fails
 */
export async function listMealPlans(
  userId: string,
  filters: ListFilters,
  supabase: SupabaseClient<Database>
): Promise<GetMealPlansResponseDto> {
  const { search, sort = "updated_at", order = "desc" } = filters;

  // Build query
  let query = supabase.from("meal_plans").select("*").eq("user_id", userId);

  // Apply search filter (case-insensitive partial match)
  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  // Apply sorting
  query = query.order(sort, { ascending: order === "asc" });

  // Execute query
  const { data, error } = await query;

  if (error) {
    throw new DatabaseError(`Failed to list meal plans: ${error.message}`, error);
  }

  if (!data) {
    return [];
  }

  // Transform database rows to DTOs
  const mealPlans: MealPlanListItemDto[] = data.map((row) => {
    const typedRow = row as unknown as TypedMealPlanRow;

    // Extract daily_summary from plan_content
    const daily_summary = typedRow.plan_content.daily_summary;

    // Build startup_data from flat fields
    const startup_data = {
      patient_age: typedRow.patient_age,
      patient_weight: typedRow.patient_weight,
      patient_height: typedRow.patient_height,
      activity_level: typedRow.activity_level,
      target_kcal: typedRow.target_kcal,
      target_macro_distribution: typedRow.target_macro_distribution,
      meal_names: typedRow.meal_names,
      exclusions_guidelines: typedRow.exclusions_guidelines,
    };

    return {
      id: typedRow.id,
      name: typedRow.name,
      created_at: typedRow.created_at,
      updated_at: typedRow.updated_at,
      startup_data,
      daily_summary,
    };
  });

  return mealPlans;
}

/**
 * Creates a new meal plan.
 * Flattens the nested command structure into a database row.
 * @param command - The create command with nested structure
 * @param userId - The authenticated user's ID
 * @param supabase - The Supabase client instance
 * @returns The created meal plan row
 * @throws {DatabaseError} If the database insert fails
 */
export async function createMealPlan(
  command: CreateMealPlanCommand,
  userId: string,
  supabase: SupabaseClient<Database>
): Promise<TypedMealPlanRow> {
  // Flatten command to database insert format
  const insertPayload: TypedMealPlanInsert = {
    user_id: userId,
    name: command.name,
    source_chat_session_id: command.source_chat_session_id ?? null,
    plan_content: command.plan_content,
    patient_age: command.startup_data.patient_age ?? null,
    patient_weight: command.startup_data.patient_weight ?? null,
    patient_height: command.startup_data.patient_height ?? null,
    activity_level: command.startup_data.activity_level ?? null,
    target_kcal: command.startup_data.target_kcal ?? null,
    target_macro_distribution: command.startup_data.target_macro_distribution ?? null,
    meal_names: command.startup_data.meal_names ?? null,
    exclusions_guidelines: command.startup_data.exclusions_guidelines ?? null,
  };

  // Insert into database
  const { data, error } = await supabase
    .from("meal_plans")
    .insert(insertPayload as unknown as TablesInsert<"meal_plans">)
    .select()
    .single();

  if (error) {
    throw new DatabaseError(`Failed to create meal plan: ${error.message}`, error);
  }

  if (!data) {
    throw new DatabaseError("Failed to create meal plan: No data returned");
  }

  return data as unknown as TypedMealPlanRow;
}

/**
 * Retrieves a single meal plan by ID.
 * RLS automatically ensures the plan belongs to the user.
 * @param id - The meal plan ID (UUID)
 * @param userId - The authenticated user's ID
 * @param supabase - The Supabase client instance
 * @returns The meal plan row
 * @throws {NotFoundError} If the meal plan doesn't exist or doesn't belong to the user
 * @throws {DatabaseError} If the database query fails
 */
export async function getMealPlanById(
  id: string,
  userId: string,
  supabase: SupabaseClient<Database>
): Promise<TypedMealPlanRow> {
  const { data, error } = await supabase
    .from("meal_plans")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId) // Explicit user filter for defense-in-depth
    .single();

  if (error) {
    // Check if error is due to no rows found
    if (error.code === "PGRST116") {
      throw new NotFoundError(`Meal plan not found with ID: ${id}`);
    }
    throw new DatabaseError(`Failed to get meal plan: ${error.message}`, error);
  }

  if (!data) {
    throw new NotFoundError(`Meal plan not found with ID: ${id}`);
  }

  return data as unknown as TypedMealPlanRow;
}

/**
 * Updates an existing meal plan.
 * Only updates fields provided in the command (partial update).
 * @param id - The meal plan ID (UUID)
 * @param command - The update command (partial)
 * @param userId - The authenticated user's ID
 * @param supabase - The Supabase client instance
 * @returns The updated meal plan row
 * @throws {NotFoundError} If the meal plan doesn't exist or doesn't belong to the user
 * @throws {DatabaseError} If the database update fails
 */
export async function updateMealPlan(
  id: string,
  command: UpdateMealPlanCommand,
  userId: string,
  supabase: SupabaseClient<Database>
): Promise<TypedMealPlanRow> {
  // Build update payload (only include provided fields)
  const updatePayload: TypedMealPlanUpdate = {};

  if (command.name !== undefined) {
    updatePayload.name = command.name;
  }
  if (command.source_chat_session_id !== undefined) {
    updatePayload.source_chat_session_id = command.source_chat_session_id;
  }
  if (command.plan_content !== undefined) {
    updatePayload.plan_content = command.plan_content;
  }
  if (command.patient_age !== undefined) {
    updatePayload.patient_age = command.patient_age;
  }
  if (command.patient_weight !== undefined) {
    updatePayload.patient_weight = command.patient_weight;
  }
  if (command.patient_height !== undefined) {
    updatePayload.patient_height = command.patient_height;
  }
  if (command.activity_level !== undefined) {
    updatePayload.activity_level = command.activity_level;
  }
  if (command.target_kcal !== undefined) {
    updatePayload.target_kcal = command.target_kcal;
  }
  if (command.target_macro_distribution !== undefined) {
    updatePayload.target_macro_distribution = command.target_macro_distribution;
  }
  if (command.meal_names !== undefined) {
    updatePayload.meal_names = command.meal_names;
  }
  if (command.exclusions_guidelines !== undefined) {
    updatePayload.exclusions_guidelines = command.exclusions_guidelines;
  }

  // Update in database
  const { data, error } = await supabase
    .from("meal_plans")
    .update(updatePayload as unknown as TablesUpdate<"meal_plans">)
    .eq("id", id)
    .eq("user_id", userId) // Explicit user filter for defense-in-depth
    .select()
    .single();

  if (error) {
    // Check if error is due to no rows found
    if (error.code === "PGRST116") {
      throw new NotFoundError(`Meal plan not found with ID: ${id}`);
    }
    throw new DatabaseError(`Failed to update meal plan: ${error.message}`, error);
  }

  if (!data) {
    throw new NotFoundError(`Meal plan not found with ID: ${id}`);
  }

  return data as unknown as TypedMealPlanRow;
}

/**
 * Deletes a meal plan.
 * @param id - The meal plan ID (UUID)
 * @param userId - The authenticated user's ID
 * @param supabase - The Supabase client instance
 * @throws {NotFoundError} If the meal plan doesn't exist or doesn't belong to the user
 * @throws {DatabaseError} If the database delete fails
 */
export async function deleteMealPlan(id: string, userId: string, supabase: SupabaseClient<Database>): Promise<void> {
  // Verify plan exists and belongs to user (for better error messages)
  await getMealPlanById(id, userId, supabase);

  // Delete from database
  const { error } = await supabase.from("meal_plans").delete().eq("id", id).eq("user_id", userId); // Explicit user filter for defense-in-depth

  if (error) {
    throw new DatabaseError(`Failed to delete meal plan: ${error.message}`, error);
  }
}
