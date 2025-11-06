import { z } from "zod";
import { mealPlanMealSchema } from "./meal-plans.schemas";

/**
 * Zod schema for validating the meal plan form data.
 * Used with React Hook Form for client-side validation.
 */
export const mealPlanFormSchema = z.object({
  planName: z.string().min(1, "Plan name is required").max(255, "Plan name must be less than 255 characters"),
  meals: z.array(mealPlanMealSchema).min(1, "At least one meal is required"),
});

export type MealPlanFormData = z.infer<typeof mealPlanFormSchema>;
