import { z } from "zod";

/**
 * Schema for validating the target macro distribution JSON blob.
 */
const targetMacroDistributionSchema = z.object({
  p_perc: z.number().min(0).max(100),
  f_perc: z.number().min(0).max(100),
  c_perc: z.number().min(0).max(100),
});

/**
 * Schema for validating the CreateAiSessionCommand request body.
 * All fields match the MealPlanStartupData type and are optional/nullable
 * as they may not all be required by the form.
 * Also includes multi-day plan fields (number_of_days, etc.)
 */
export const createAiSessionSchema = z.object({
  patient_age: z.number().int().positive().nullable().optional(),
  patient_weight: z.number().positive().nullable().optional(),
  patient_height: z.number().positive().nullable().optional(),
  activity_level: z.enum(["sedentary", "light", "moderate", "high"]).nullable().optional(),
  target_kcal: z.number().int().positive().nullable().optional(),
  target_macro_distribution: targetMacroDistributionSchema.nullable().optional(),
  meal_names: z.string().nullable().optional(),
  exclusions_guidelines: z.string().nullable().optional(),
  // Multi-day plan fields
  number_of_days: z.number().int().min(1).max(7).optional(),
  ensure_meal_variety: z.boolean().optional(),
  different_guidelines_per_day: z.boolean().optional(),
  per_day_guidelines: z.string().max(2000).nullable().optional(),
});

/**
 * Schema for validating the SendAiMessageCommand request body.
 * Used for follow-up messages in an existing AI chat session.
 */
export const sendAiMessageSchema = z.object({
  message: z.object({
    role: z.literal("user"),
    content: z.string().min(1, "Message content cannot be empty"),
  }),
});
