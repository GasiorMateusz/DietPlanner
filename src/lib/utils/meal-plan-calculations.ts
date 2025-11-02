import type { MealPlanContentDailySummary, MealPlanStartupData } from "@/types";

/**
 * Calculates daily nutritional summary from target kcal and macro distribution.
 * Used as a fallback when the parsed XML doesn't provide a daily summary.
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
 * Determines the final daily summary to use, preferring parsed XML data
 * but falling back to calculated values if the parsed summary is empty.
 *
 * @param parsedSummary - Daily summary parsed from XML
 * @param startupData - Startup data containing target kcal and macro distribution
 * @returns Final daily summary to use
 */
export function resolveDailySummary(
  parsedSummary: MealPlanContentDailySummary,
  startupData?: MealPlanStartupData | null
): MealPlanContentDailySummary {
  // If parsed summary has kcal > 0, use it
  if (parsedSummary.kcal > 0) {
    return parsedSummary;
  }

  // Otherwise, calculate from startup data
  return calculateDailySummaryFromTargets(startupData?.target_kcal, startupData?.target_macro_distribution);
}
