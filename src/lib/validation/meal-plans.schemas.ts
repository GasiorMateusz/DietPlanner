import { z } from 'zod';

/**
 * Schema for validating the target macro distribution JSON blob.
 * Reused from ai.schemas.ts to maintain consistency.
 */
const targetMacroDistributionSchema = z.object({
  p_perc: z.number().min(0).max(100),
  f_perc: z.number().min(0).max(100),
  c_perc: z.number().min(0).max(100),
});

/**
 * Schema for validating the daily summary within plan_content.
 */
const mealPlanContentDailySummarySchema = z.object({
  kcal: z.number().positive(),
  proteins: z.number().positive(),
  fats: z.number().positive(),
  carbs: z.number().positive(),
});

/**
 * Schema for validating a single meal within plan_content.meals array.
 */
const mealPlanMealSchema = z.object({
  name: z.string().min(1),
  ingredients: z.string(),
  preparation: z.string(),
  summary: z.object({
    kcal: z.number().positive(),
    p: z.number().nonnegative(),
    f: z.number().nonnegative(),
    c: z.number().nonnegative(),
  }),
});

/**
 * Schema for validating the full plan_content JSON structure.
 */
const mealPlanContentSchema = z.object({
  daily_summary: mealPlanContentDailySummarySchema,
  meals: z.array(mealPlanMealSchema).min(1),
});

/**
 * Schema for validating the startup_data object in CreateMealPlanCommand.
 */
export const mealPlanStartupDataSchema = z.object({
  patient_age: z.number().int().positive().max(150).nullable().optional(),
  patient_weight: z.number().positive().max(1000).nullable().optional(),
  patient_height: z.number().positive().max(300).nullable().optional(),
  activity_level: z
    .enum(['sedentary', 'light', 'moderate', 'high'])
    .nullable()
    .optional(),
  target_kcal: z.number().int().positive().max(10000).nullable().optional(),
  target_macro_distribution: targetMacroDistributionSchema.nullable().optional(),
  meal_names: z.string().max(500).nullable().optional(),
  exclusions_guidelines: z.string().max(2000).nullable().optional(),
});

/**
 * Schema for validating the POST /api/meal-plans request body.
 */
export const createMealPlanSchema = z.object({
  name: z.string().min(1).max(255),
  source_chat_session_id: z.string().uuid().optional().nullable(),
  plan_content: mealPlanContentSchema,
  startup_data: mealPlanStartupDataSchema,
});

/**
 * Schema for validating the PUT /api/meal-plans/{id} request body.
 * All fields are optional for partial updates.
 */
export const updateMealPlanSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  source_chat_session_id: z.string().uuid().optional().nullable(),
  plan_content: mealPlanContentSchema.optional(),
  patient_age: z.number().int().positive().max(150).nullable().optional(),
  patient_weight: z.number().positive().max(1000).nullable().optional(),
  patient_height: z.number().positive().max(300).nullable().optional(),
  activity_level: z
    .enum(['sedentary', 'light', 'moderate', 'high'])
    .nullable()
    .optional(),
  target_kcal: z.number().int().positive().max(10000).nullable().optional(),
  target_macro_distribution: targetMacroDistributionSchema.nullable().optional(),
  meal_names: z.string().max(500).nullable().optional(),
  exclusions_guidelines: z.string().max(2000).nullable().optional(),
});

/**
 * Schema for validating query parameters for GET /api/meal-plans.
 */
export const listMealPlansQuerySchema = z.object({
  search: z.string().max(100).optional(),
  sort: z.enum(['created_at', 'updated_at', 'name']).optional().default('updated_at'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
});

/**
 * Schema for validating path parameters containing meal plan ID.
 */
export const mealPlanIdParamSchema = z.object({
  id: z.string().uuid(),
});

/**
 * Schema for validating path parameters for export endpoint.
 * Alias for consistency across endpoints.
 */
export const mealPlanIdPathParamSchema = mealPlanIdParamSchema;

