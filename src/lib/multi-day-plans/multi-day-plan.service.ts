import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, TablesInsert, TablesUpdate } from "../../db/database.types.ts";
import { DatabaseError, NotFoundError } from "../errors.ts";
import type {
  CreateMultiDayPlanCommand,
  GetMultiDayPlansResponseDto,
  GetMultiDayPlanByIdResponseDto,
  TypedMultiDayPlanRow,
  TypedMealPlanRow,
  UpdateMultiDayPlanCommand,
} from "../../types.ts";
import * as MealPlanService from "../meal-plans/meal-plan.service.ts";

export interface ListFilters {
  search?: string;
  sort?: "created_at" | "updated_at" | "name";
  order?: "asc" | "desc";
}

export async function listMultiDayPlans(
  userId: string,
  filters: ListFilters,
  supabase: SupabaseClient<Database>
): Promise<GetMultiDayPlansResponseDto> {
  const { search, sort = "updated_at", order = "desc" } = filters;

  let query = supabase.from("multi_day_plans").select("*").eq("user_id", userId);

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  query = query.order(sort, { ascending: order === "asc" });

  const { data, error } = await query;

  if (error) {
    throw new DatabaseError(`Failed to list multi-day plans: ${error.message}`, error);
  }

  if (!data) {
    return [];
  }

  return data.map((row) => ({
    id: row.id,
    name: row.name,
    number_of_days: row.number_of_days,
    average_kcal: row.average_kcal ?? 0,
    average_proteins: row.average_proteins ?? 0,
    average_fats: row.average_fats ?? 0,
    average_carbs: row.average_carbs ?? 0,
    common_exclusions_guidelines: row.common_exclusions_guidelines,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));
}

export async function createMultiDayPlan(
  command: CreateMultiDayPlanCommand,
  userId: string,
  supabase: SupabaseClient<Database>
): Promise<GetMultiDayPlanByIdResponseDto> {
  // Debug: Log command received by service
  // eslint-disable-next-line no-console
  console.log("[createMultiDayPlan] Command received:", {
    name: command.name,
    number_of_days: command.number_of_days,
    day_plans_count: command.day_plans?.length || 0,
    day_plans_day_numbers: command.day_plans?.map((d) => d.day_number) || [],
    user_id: userId,
  });

  const insertPayload: TablesInsert<"multi_day_plans"> = {
    user_id: userId,
    name: command.name,
    source_chat_session_id: command.source_chat_session_id,
    number_of_days: command.number_of_days,
    common_exclusions_guidelines: command.common_exclusions_guidelines,
    common_allergens: command.common_allergens as any,
  };

  const { data: multiDayPlan, error: multiDayError } = await supabase
    .from("multi_day_plans")
    .insert(insertPayload)
    .select()
    .single();

  if (multiDayError) {
    throw new DatabaseError(`Failed to create multi-day plan: ${multiDayError.message}`, multiDayError);
  }

  if (!multiDayPlan) {
    throw new DatabaseError("Failed to create multi-day plan: No data returned");
  }

  // eslint-disable-next-line no-console
  console.log("[createMultiDayPlan] Multi-day plan created:", {
    id: multiDayPlan.id,
    name: multiDayPlan.name,
    number_of_days: multiDayPlan.number_of_days,
  });

  const dayPlans: { day_number: number; day_plan: TypedMealPlanRow }[] = [];

  // eslint-disable-next-line no-console
  console.log("[createMultiDayPlan] Starting to process day plans. Total days to process:", command.day_plans.length);

  for (const dayPlanCommand of command.day_plans) {
    // eslint-disable-next-line no-console
    console.log("[createMultiDayPlan] Processing day:", {
      day_number: dayPlanCommand.day_number,
      name: dayPlanCommand.name,
      has_plan_content: !!dayPlanCommand.plan_content,
      meals_count: dayPlanCommand.plan_content?.meals?.length || 0,
    });
    const mealPlanCommand = {
      name: dayPlanCommand.name || `${command.name} - Day ${dayPlanCommand.day_number}`,
      source_chat_session_id: command.source_chat_session_id,
      plan_content: dayPlanCommand.plan_content,
      startup_data: dayPlanCommand.startup_data,
    };

    const dayPlan = await MealPlanService.createMealPlan(mealPlanCommand, userId, supabase);

    // eslint-disable-next-line no-console
    console.log("[createMultiDayPlan] Day plan created:", {
      day_number: dayPlanCommand.day_number,
      day_plan_id: dayPlan.id,
      day_plan_name: dayPlan.name,
    });

    // Mark the meal plan as a day plan
    const { error: updateError } = await supabase
      .from("meal_plans")
      .update({ is_day_plan: true })
      .eq("id", dayPlan.id);

    if (updateError) {
      throw new DatabaseError(`Failed to mark meal plan as day plan: ${updateError.message}`, updateError);
    }

    // eslint-disable-next-line no-console
    console.log("[createMultiDayPlan] Marked meal plan as day plan:", {
      day_plan_id: dayPlan.id,
      day_number: dayPlanCommand.day_number,
    });

    const { error: linkError } = await supabase.from("multi_day_plan_days").insert({
      multi_day_plan_id: multiDayPlan.id,
      day_plan_id: dayPlan.id,
      day_number: dayPlanCommand.day_number,
    });

    if (linkError) {
      // eslint-disable-next-line no-console
      console.error("[createMultiDayPlan] Failed to link day plan:", {
        day_number: dayPlanCommand.day_number,
        day_plan_id: dayPlan.id,
        error: linkError.message,
        error_code: linkError.code,
      });
      throw new DatabaseError(`Failed to link day plan: ${linkError.message}`, linkError);
    }

    // eslint-disable-next-line no-console
    console.log("[createMultiDayPlan] Day plan linked successfully:", {
      day_number: dayPlanCommand.day_number,
      day_plan_id: dayPlan.id,
      multi_day_plan_id: multiDayPlan.id,
    });

    dayPlans.push({
      day_number: dayPlanCommand.day_number,
      day_plan: dayPlan,
    });
  }

  // eslint-disable-next-line no-console
  console.log("[createMultiDayPlan] Finished processing all day plans:", {
    total_processed: dayPlans.length,
    day_numbers: dayPlans.map((d) => d.day_number),
    expected_count: command.day_plans.length,
  });

  const typedMultiDayPlan = multiDayPlan as unknown as TypedMultiDayPlanRow;

  return {
    ...typedMultiDayPlan,
    common_allergens: command.common_allergens,
    days: dayPlans.sort((a, b) => a.day_number - b.day_number),
  };
}

export async function getMultiDayPlanById(
  id: string,
  userId: string,
  supabase: SupabaseClient<Database>
): Promise<GetMultiDayPlanByIdResponseDto> {
  const { data: multiDayPlan, error: multiDayError } = await supabase
    .from("multi_day_plans")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (multiDayError) {
    if (multiDayError.code === "PGRST116") {
      throw new NotFoundError(`Multi-day plan not found with ID: ${id}`);
    }
    throw new DatabaseError(`Failed to get multi-day plan: ${multiDayError.message}`, multiDayError);
  }

  if (!multiDayPlan) {
    throw new NotFoundError(`Multi-day plan not found with ID: ${id}`);
  }

  const { data: dayLinks, error: linksError } = await supabase
    .from("multi_day_plan_days")
    .select("day_number, day_plan_id")
    .eq("multi_day_plan_id", id)
    .order("day_number", { ascending: true });

  if (linksError) {
    throw new DatabaseError(`Failed to get day plans: ${linksError.message}`, linksError);
  }

  if (!dayLinks || dayLinks.length === 0) {
    throw new NotFoundError(`No day plans found for multi-day plan: ${id}`);
  }

  // Debug logging to help diagnose issues
  // eslint-disable-next-line no-console
  console.log(
    `[getMultiDayPlanById] Found ${dayLinks.length} day links for plan ${id}. Expected ${multiDayPlan.number_of_days} days. Day numbers:`,
    dayLinks.map((l) => l.day_number).join(", ")
  );

  const dayPlans: { day_number: number; day_plan: TypedMealPlanRow }[] = [];

  for (const link of dayLinks) {
    const dayPlan = await MealPlanService.getMealPlanById(link.day_plan_id, userId, supabase);
    dayPlans.push({
      day_number: link.day_number,
      day_plan: dayPlan,
    });
  }

  // Explicitly sort by day_number to ensure correct order
  dayPlans.sort((a, b) => a.day_number - b.day_number);

  const typedMultiDayPlan = multiDayPlan as unknown as TypedMultiDayPlanRow;
  let commonAllergens: string[] | null = null;
  if (typedMultiDayPlan.common_allergens) {
    if (Array.isArray(typedMultiDayPlan.common_allergens)) {
      commonAllergens = typedMultiDayPlan.common_allergens as string[];
    } else if (typeof typedMultiDayPlan.common_allergens === "string") {
      try {
        const parsed = JSON.parse(typedMultiDayPlan.common_allergens);
        commonAllergens = Array.isArray(parsed) ? (parsed as string[]) : null;
      } catch (error) {
        throw new DatabaseError(
          `Failed to parse common_allergens JSON for multi-day plan ${id}: ${error instanceof Error ? error.message : "Unknown error"}`,
          error instanceof Error ? error : undefined
        );
      }
    } else {
      // If it's already an object/array but not a string, try to use it directly
      commonAllergens = Array.isArray(typedMultiDayPlan.common_allergens)
        ? (typedMultiDayPlan.common_allergens as string[])
        : null;
    }
  }

  return {
    ...typedMultiDayPlan,
    common_allergens: commonAllergens,
    days: dayPlans,
  };
}

export async function updateMultiDayPlan(
  id: string,
  command: UpdateMultiDayPlanCommand,
  userId: string,
  supabase: SupabaseClient<Database>
): Promise<GetMultiDayPlanByIdResponseDto> {
  await getMultiDayPlanById(id, userId, supabase);

  const updatePayload: TablesUpdate<"multi_day_plans"> = {};

  if (command.name !== undefined) {
    updatePayload.name = command.name;
  }
  if (command.common_exclusions_guidelines !== undefined) {
    updatePayload.common_exclusions_guidelines = command.common_exclusions_guidelines;
  }
  if (command.common_allergens !== undefined) {
    updatePayload.common_allergens = command.common_allergens as any;
  }

  if (Object.keys(updatePayload).length > 0) {
    const { data: updatedPlan, error: updateError } = await supabase
      .from("multi_day_plans")
      .update(updatePayload)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (updateError) {
      throw new DatabaseError(`Failed to update multi-day plan: ${updateError.message}`, updateError);
    }

    if (!updatedPlan) {
      throw new NotFoundError(`Multi-day plan not found with ID: ${id}`);
    }
  }

  if (command.day_plans !== undefined) {
    // Debug: Log update command
    // eslint-disable-next-line no-console
    console.log("[updateMultiDayPlan] Updating day plans:", {
      plan_id: id,
      new_day_count: command.day_plans.length,
      new_day_numbers: command.day_plans.map((d) => d.day_number),
    });

    // Get current plan data BEFORE deleting day links (needed for name and source_chat_session_id)
    // We need to query the multi_day_plans table directly since getMultiDayPlanById requires day links
    const { data: multiDayPlanRow, error: planError } = await supabase
      .from("multi_day_plans")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (planError) {
      if (planError.code === "PGRST116") {
        throw new NotFoundError(`Multi-day plan not found with ID: ${id}`);
      }
      throw new DatabaseError(`Failed to get multi-day plan: ${planError.message}`, planError);
    }

    if (!multiDayPlanRow) {
      throw new NotFoundError(`Multi-day plan not found with ID: ${id}`);
    }

    const multiDayPlan = multiDayPlanRow as unknown as TypedMultiDayPlanRow;

    const { data: existingLinks, error: linksError } = await supabase
      .from("multi_day_plan_days")
      .select("day_plan_id")
      .eq("multi_day_plan_id", id);

    if (linksError) {
      throw new DatabaseError(`Failed to get existing day plans: ${linksError.message}`, linksError);
    }

    const existingDayPlanIds = existingLinks?.map((link) => link.day_plan_id) || [];

    // eslint-disable-next-line no-console
    console.log("[updateMultiDayPlan] Found existing day plans to delete:", {
      count: existingDayPlanIds.length,
      day_plan_ids: existingDayPlanIds,
    });

    // Delete existing day plans
    for (const existingDayPlanId of existingDayPlanIds) {
      await MealPlanService.deleteMealPlan(existingDayPlanId, userId, supabase);
    }

    // Delete all day links (trigger will fire but won't set number_of_days to 0 due to migration fix)
    const { error: deleteLinksError } = await supabase.from("multi_day_plan_days").delete().eq("multi_day_plan_id", id);

    if (deleteLinksError) {
      throw new DatabaseError(`Failed to delete day plan links: ${deleteLinksError.message}`, deleteLinksError);
    }

    // eslint-disable-next-line no-console
    console.log("[updateMultiDayPlan] Deleted all existing day links");

    // eslint-disable-next-line no-console
    console.log("[updateMultiDayPlan] Starting to create new day plans:", {
      total_to_create: command.day_plans.length,
    });

    for (const dayPlanCommand of command.day_plans) {
      // eslint-disable-next-line no-console
      console.log("[updateMultiDayPlan] Creating day plan:", {
        day_number: dayPlanCommand.day_number,
        name: dayPlanCommand.name,
      });

      const mealPlanCommand = {
        name: dayPlanCommand.name || `${multiDayPlan.name} - Day ${dayPlanCommand.day_number}`,
        source_chat_session_id: multiDayPlan.source_chat_session_id || "",
        plan_content: dayPlanCommand.plan_content,
        startup_data: dayPlanCommand.startup_data,
      };

      const dayPlan = await MealPlanService.createMealPlan(mealPlanCommand, userId, supabase);

      // eslint-disable-next-line no-console
      console.log("[updateMultiDayPlan] Day plan created:", {
        day_number: dayPlanCommand.day_number,
        day_plan_id: dayPlan.id,
      });

      // Mark the meal plan as a day plan
      const { error: updateError } = await supabase
        .from("meal_plans")
        .update({ is_day_plan: true })
        .eq("id", dayPlan.id);

      if (updateError) {
        throw new DatabaseError(`Failed to mark meal plan as day plan: ${updateError.message}`, updateError);
      }

      const { error: linkError } = await supabase.from("multi_day_plan_days").insert({
        multi_day_plan_id: id,
        day_plan_id: dayPlan.id,
        day_number: dayPlanCommand.day_number,
      });

      if (linkError) {
        // eslint-disable-next-line no-console
        console.error("[updateMultiDayPlan] Failed to link day plan:", {
          day_number: dayPlanCommand.day_number,
          day_plan_id: dayPlan.id,
          error: linkError.message,
          error_code: linkError.code,
        });
        throw new DatabaseError(`Failed to link day plan: ${linkError.message}`, linkError);
      }

      // eslint-disable-next-line no-console
      console.log("[updateMultiDayPlan] Day plan linked successfully:", {
        day_number: dayPlanCommand.day_number,
        day_plan_id: dayPlan.id,
      });
    }

    // After all day_plans are inserted, explicitly set number_of_days to the correct value
    // The trigger will also recalculate it, but this ensures it's correct even if trigger has issues
    if (command.day_plans.length > 0) {
      // eslint-disable-next-line no-console
      console.log("[updateMultiDayPlan] Setting final number_of_days:", {
        number_of_days: command.day_plans.length,
      });

      const { error: finalUpdateError } = await supabase
        .from("multi_day_plans")
        .update({ number_of_days: command.day_plans.length })
        .eq("id", id)
        .eq("user_id", userId);

      if (finalUpdateError) {
        // eslint-disable-next-line no-console
        console.error("[updateMultiDayPlan] Failed to update number_of_days:", {
          error: finalUpdateError.message,
          error_code: finalUpdateError.code,
        });
        throw new DatabaseError(`Failed to update number_of_days: ${finalUpdateError.message}`, finalUpdateError);
      }

      // eslint-disable-next-line no-console
      console.log("[updateMultiDayPlan] Successfully updated number_of_days to:", command.day_plans.length);
    }
  }

  return getMultiDayPlanById(id, userId, supabase);
}

export async function deleteMultiDayPlan(
  id: string,
  userId: string,
  supabase: SupabaseClient<Database>
): Promise<void> {
  // Verify the plan exists and belongs to the user by querying the table directly
  // We can't use getMultiDayPlanById because it requires day links, which might not exist
  const { data: plan, error: planError } = await supabase
    .from("multi_day_plans")
    .select("id")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (planError) {
    if (planError.code === "PGRST116") {
      throw new NotFoundError(`Multi-day plan not found with ID: ${id}`);
    }
    throw new DatabaseError(`Failed to get multi-day plan: ${planError.message}`, planError);
  }

  if (!plan) {
    throw new NotFoundError(`Multi-day plan not found with ID: ${id}`);
  }

  // Get day links (if any exist)
  const { data: dayLinks, error: linksError } = await supabase
    .from("multi_day_plan_days")
    .select("day_plan_id")
    .eq("multi_day_plan_id", id);

  if (linksError) {
    throw new DatabaseError(`Failed to get day plans: ${linksError.message}`, linksError);
  }

  // Delete associated day plans if they exist
  if (dayLinks && dayLinks.length > 0) {
    for (const link of dayLinks) {
      await MealPlanService.deleteMealPlan(link.day_plan_id, userId, supabase);
    }
  }

  // Delete day links (if any exist)
  const { error: deleteLinksError } = await supabase.from("multi_day_plan_days").delete().eq("multi_day_plan_id", id);

  if (deleteLinksError) {
    throw new DatabaseError(`Failed to delete day plan links: ${deleteLinksError.message}`, deleteLinksError);
  }

  // Delete the multi-day plan itself
  const { error: deleteError } = await supabase.from("multi_day_plans").delete().eq("id", id).eq("user_id", userId);

  if (deleteError) {
    throw new DatabaseError(`Failed to delete multi-day plan: ${deleteError.message}`, deleteError);
  }
}

