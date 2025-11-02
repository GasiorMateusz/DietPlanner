import type { MealPlanMeal } from "@/types";

/**
 * Internal state structure for meal plan editor validation.
 */
export interface MealPlanFormState {
  planName: string;
  meals: MealPlanMeal[];
}

/**
 * Validates meal plan form state.
 * Returns error message if validation fails, null if valid.
 *
 * @param state - The form state to validate
 * @returns Error message string or null if valid
 */
export function validateMealPlanForm(state: MealPlanFormState): string | null {
  if (!state.planName.trim()) {
    return "Plan name is required";
  }

  if (state.meals.length === 0) {
    return "At least one meal is required";
  }

  for (let i = 0; i < state.meals.length; i++) {
    if (!state.meals[i].name.trim()) {
      return `Meal ${i + 1} name is required`;
    }
  }

  return null;
}

/**
 * Checks if meal plan form is ready to be saved.
 * This is a convenience function that checks all required fields are filled.
 *
 * @param state - The form state to check
 * @param isLoading - Whether the form is currently loading
 * @returns True if form is ready to save, false otherwise
 */
export function isMealPlanFormReady(state: MealPlanFormState, isLoading: boolean): boolean {
  if (isLoading) return false;
  if (!state.planName.trim()) return false;
  if (state.meals.length === 0) return false;
  return state.meals.every((meal) => meal.name.trim() !== "");
}
