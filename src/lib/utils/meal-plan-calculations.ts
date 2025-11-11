import type { MealPlanContentDailySummary, MealPlanStartupData } from "@/types";

/**
 * Calculates daily nutritional summary from target kcal and macro distribution.
 * Used as a fallback when the parsed JSON doesn't provide a daily summary.
 *
 * Calculation formulas:
 * - Proteins (g) = (kcal * protein_percentage) / 100 / 4 (proteins have 4 kcal/g)
 * - Fats (g) = (kcal * fat_percentage) / 100 / 9 (fats have 9 kcal/g)
 * - Carbs (g) = (kcal * carb_percentage) / 100 / 4 (carbs have 4 kcal/g)
 *
 * @param targetKcal - Target daily calories (can be null)
 * @param macroDistribution - Macro distribution percentages (can be null)
 * @returns Daily summary with calculated or zero values
 */
export function calculateDailySummaryFromTargets(
  targetKcal: number | null | undefined,
  macroDistribution: { p_perc: number; f_perc: number; c_perc: number } | null | undefined
): MealPlanContentDailySummary {
  // If either target_kcal or macro_distribution is missing, return zeros
  if (!targetKcal || !macroDistribution) {
    return {
      kcal: 0,
      proteins: 0,
      fats: 0,
      carbs: 0,
    };
  }

  return {
    kcal: targetKcal,
    proteins: Math.round((targetKcal * macroDistribution.p_perc) / 100 / 4),
    fats: Math.round((targetKcal * macroDistribution.f_perc) / 100 / 9),
    carbs: Math.round((targetKcal * macroDistribution.c_perc) / 100 / 4),
  };
}

/**
 * Determines the final daily summary to use, preferring parsed JSON data
 * but falling back to calculated values if the parsed summary is invalid or empty.
 *
 * @param parsedSummary - Daily summary parsed from JSON
 * @param startupData - Startup data containing target kcal and macro distribution
 * @returns Final daily summary to use
 */
export function resolveDailySummary(
  parsedSummary: MealPlanContentDailySummary,
  startupData?: MealPlanStartupData | null
): MealPlanContentDailySummary {
  // If parsed summary has all values > 0, use it
  if (parsedSummary.kcal > 0 && parsedSummary.proteins > 0 && parsedSummary.fats > 0 && parsedSummary.carbs > 0) {
    return parsedSummary;
  }

  // Otherwise, calculate from startup data
  const calculated = calculateDailySummaryFromTargets(startupData?.target_kcal, startupData?.target_macro_distribution);

  // If calculated values are also invalid, ensure minimum values for validation
  // This prevents validation errors when data is missing
  return {
    kcal: calculated.kcal || 1,
    proteins: calculated.proteins || 1,
    fats: calculated.fats || 1,
    carbs: calculated.carbs || 1,
  };
}
