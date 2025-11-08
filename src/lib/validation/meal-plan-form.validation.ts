import type { MealPlanMeal } from "@/types";

export interface MealPlanFormState {
  planName: string;
  meals: MealPlanMeal[];
}

/**
 * Returns null when the form is valid, otherwise returns a human-facing error string.
 */
export function validateMealPlanForm(state: MealPlanFormState): string | null {
  const name = (state.planName || "").trim();
  if (!name) return "Plan name is required";

  if (!Array.isArray(state.meals) || state.meals.length === 0) return "At least one meal is required";

  for (let i = 0; i < state.meals.length; i++) {
    const m = state.meals[i];
    if (!m || !(m.name || "").trim()) {
      return `Meal ${i + 1} name is required`;
    }
  }

  return null;
}

export function isMealPlanFormReady(state: MealPlanFormState, loading: boolean): boolean {
  if (loading) return false;
  return validateMealPlanForm(state) === null;
}
