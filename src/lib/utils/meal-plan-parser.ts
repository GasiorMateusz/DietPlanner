import type { MealPlanMeal, MealPlanContentDailySummary } from "../../types";

/**
 * Parses XML tags from AI message to extract daily summary and meals.
 * Returns both parsed meals and daily summary.
 */
export function parseXmlMealPlan(message: string): {
  meals: MealPlanMeal[];
  dailySummary: MealPlanContentDailySummary;
} {
  // Extract daily_summary from XML
  const dailySummaryMatch = message.match(/<daily_summary>([\s\S]*?)<\/daily_summary>/);
  let dailySummary: MealPlanContentDailySummary = {
    kcal: 0,
    proteins: 0,
    fats: 0,
    carbs: 0,
  };

  if (dailySummaryMatch) {
    const summaryContent = dailySummaryMatch[1];

    const extractTag = (tagName: string): number => {
      const regex = new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, "i");
      const match = summaryContent.match(regex);
      if (match) {
        const value = parseFloat(match[1].trim());
        return isNaN(value) ? 0 : Math.round(value);
      }
      return 0;
    };

    dailySummary = {
      kcal: extractTag("kcal"),
      proteins: extractTag("proteins"),
      fats: extractTag("fats"),
      carbs: extractTag("carbs"),
    };
  }

  // Extract all meals from XML
  const mealsMatch = message.match(/<meals>([\s\S]*?)<\/meals>/);
  const meals: MealPlanMeal[] = [];

  if (mealsMatch) {
    const mealsContent = mealsMatch[1];

    // Extract individual meal tags
    const mealRegex = /<meal>([\s\S]*?)<\/meal>/g;
    let mealMatch;

    while ((mealMatch = mealRegex.exec(mealsContent)) !== null) {
      const mealContent = mealMatch[1];

      const extractMealTag = (tagName: string): string => {
        const regex = new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, "i");
        const match = mealContent.match(regex);
        return match ? match[1].trim() : "";
      };

      const extractSummaryTag = (tagName: string): number => {
        const summaryMatch = mealContent.match(/<summary>([\s\S]*?)<\/summary>/i);
        if (summaryMatch) {
          const summaryContent = summaryMatch[1];
          const regex = new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, "i");
          const match = summaryContent.match(regex);
          if (match) {
            const value = parseFloat(match[1].trim());
            return isNaN(value) ? 0 : Math.round(value);
          }
        }
        return 0;
      };

      meals.push({
        name: extractMealTag("name"),
        ingredients: extractMealTag("ingredients"),
        preparation: extractMealTag("preparation"),
        summary: {
          kcal: extractSummaryTag("kcal"),
          p: extractSummaryTag("protein"),
          f: extractSummaryTag("fat"),
          c: extractSummaryTag("carb"),
        },
      });
    }
  }

  // If no meals found in XML, return empty structure
  if (meals.length === 0) {
    return {
      meals: [
        {
          name: "",
          ingredients: "",
          preparation: message,
          summary: {
            kcal: 0,
            p: 0,
            f: 0,
            c: 0,
          },
        },
      ],
      dailySummary,
    };
  }

  return { meals, dailySummary };
}

/**
 * Extracts comments from XML tags in a message.
 * Returns the comments text if found, or null if no comments tag exists.
 */
export function extractComments(message: string): string | null {
  const commentsMatch = message.match(/<comments>([\s\S]*?)<\/comments>/i);
  if (commentsMatch) {
    return commentsMatch[1].trim();
  }
  return null;
}

/**
 * Removes XML tags from a message string, keeping only the text content.
 * This is used to display clean messages in the chat without XML clutter.
 * Preserves comments content but removes the XML tags around it.
 */
export function removeXmlTags(message: string): string {
  // Extract comments first before removing tags
  const comments = extractComments(message);

  // Remove meal_plan tags and their content
  let cleaned = message.replace(/<meal_plan>[\s\S]*?<\/meal_plan>/gi, "");

  // Remove comments tags but preserve the content
  cleaned = cleaned.replace(/<comments>([\s\S]*?)<\/comments>/gi, "$1");

  // Remove any remaining XML tags
  cleaned = cleaned.replace(/<[^>]*>/g, "");

  // Clean up extra whitespace
  cleaned = cleaned.trim().replace(/\n\s*\n\s*\n/g, "\n\n");

  // If we had comments, ensure they're included in the cleaned output
  if (comments && !cleaned.includes(comments)) {
    cleaned = comments + (cleaned ? "\n\n" + cleaned : "");
  }

  return cleaned.trim();
}
