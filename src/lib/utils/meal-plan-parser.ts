import type { MealPlanMeal, MealPlanContentDailySummary } from "../../types";

/**
 * JSON structure expected from AI responses.
 */
interface JsonMealPlanResponse {
  meal_plan: {
    daily_summary: {
      kcal: number;
      proteins: number;
      fats: number;
      carbs: number;
    };
    meals: {
      name: string;
      ingredients: string;
      preparation: string;
      summary: {
        kcal: number;
        protein: number; // Note: "protein" not "p" in JSON
        fat: number; // Note: "fat" not "f" in JSON
        carb: number; // Note: "carb" not "c" in JSON
      };
    }[];
  };
  comments?: string; // Optional comments field
}

/**
 * Validation error with field path information.
 */
interface ValidationError {
  field: string;
  message: string;
}

/**
 * Parses JSON meal plan from AI message.
 * Extracts daily summary and meals from JSON structure.
 * Maps JSON field names (protein, fat, carb) to internal types (p, f, c).
 *
 * @param message - The AI message containing JSON meal plan
 * @returns Parsed meals and daily summary
 * @throws Error if JSON is malformed or structure is invalid
 */
export function parseJsonMealPlan(message: string): {
  meals: MealPlanMeal[];
  dailySummary: MealPlanContentDailySummary;
} {
  // Try to extract JSON from message
  // Look for JSON object starting with { or containing "meal_plan" key
  let jsonString = message.trim();

  // If message doesn't start with {, try to find JSON object
  if (!jsonString.startsWith("{")) {
    const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonString = jsonMatch[0];
    } else {
      throw new Error("No valid JSON structure found in message. Expected JSON object with 'meal_plan' key.");
    }
  }

  // Parse JSON
  let parsed: JsonMealPlanResponse;
  try {
    parsed = JSON.parse(jsonString);
  } catch (error) {
    const syntaxError = error instanceof SyntaxError ? error.message : "Unknown JSON syntax error";
    throw new Error(`Failed to parse JSON: ${syntaxError}. Please ensure the response is valid JSON.`);
  }

  // Validate structure
  const validationErrors: ValidationError[] = [];

  if (!parsed.meal_plan) {
    validationErrors.push({ field: "meal_plan", message: "Missing required field: meal_plan" });
  } else {
    // Validate daily_summary
    if (!parsed.meal_plan.daily_summary) {
      validationErrors.push({
        field: "meal_plan.daily_summary",
        message: "Missing required field: meal_plan.daily_summary",
      });
    } else {
      const ds = parsed.meal_plan.daily_summary;
      if (typeof ds.kcal !== "number" || ds.kcal <= 0) {
        validationErrors.push({
          field: "meal_plan.daily_summary.kcal",
          message: "daily_summary.kcal must be a positive number",
        });
      }
      if (typeof ds.proteins !== "number" || ds.proteins < 0) {
        validationErrors.push({
          field: "meal_plan.daily_summary.proteins",
          message: "daily_summary.proteins must be a non-negative number",
        });
      }
      if (typeof ds.fats !== "number" || ds.fats < 0) {
        validationErrors.push({
          field: "meal_plan.daily_summary.fats",
          message: "daily_summary.fats must be a non-negative number",
        });
      }
      if (typeof ds.carbs !== "number" || ds.carbs < 0) {
        validationErrors.push({
          field: "meal_plan.daily_summary.carbs",
          message: "daily_summary.carbs must be a non-negative number",
        });
      }
    }

    // Validate meals array
    if (!Array.isArray(parsed.meal_plan.meals)) {
      validationErrors.push({ field: "meal_plan.meals", message: "meal_plan.meals must be an array" });
    } else if (parsed.meal_plan.meals.length === 0) {
      validationErrors.push({ field: "meal_plan.meals", message: "meal_plan.meals array cannot be empty" });
    } else {
      // Validate each meal
      parsed.meal_plan.meals.forEach((meal, index) => {
        const mealPrefix = `meal_plan.meals[${index}]`;

        if (typeof meal.name !== "string" || meal.name.trim() === "") {
          validationErrors.push({ field: `${mealPrefix}.name`, message: "Meal name must be a non-empty string" });
        }
        if (typeof meal.ingredients !== "string") {
          validationErrors.push({ field: `${mealPrefix}.ingredients`, message: "Meal ingredients must be a string" });
        }
        if (typeof meal.preparation !== "string") {
          validationErrors.push({ field: `${mealPrefix}.preparation`, message: "Meal preparation must be a string" });
        }

        if (!meal.summary) {
          validationErrors.push({ field: `${mealPrefix}.summary`, message: "Missing required field: meal.summary" });
        } else {
          if (typeof meal.summary.kcal !== "number" || meal.summary.kcal <= 0) {
            validationErrors.push({
              field: `${mealPrefix}.summary.kcal`,
              message: "Meal summary.kcal must be a positive number",
            });
          }
          if (typeof meal.summary.protein !== "number" || meal.summary.protein < 0) {
            validationErrors.push({
              field: `${mealPrefix}.summary.protein`,
              message: "Meal summary.protein must be a non-negative number",
            });
          }
          if (typeof meal.summary.fat !== "number" || meal.summary.fat < 0) {
            validationErrors.push({
              field: `${mealPrefix}.summary.fat`,
              message: "Meal summary.fat must be a non-negative number",
            });
          }
          if (typeof meal.summary.carb !== "number" || meal.summary.carb < 0) {
            validationErrors.push({
              field: `${mealPrefix}.summary.carb`,
              message: "Meal summary.carb must be a non-negative number",
            });
          }
        }
      });
    }
  }

  // If validation errors exist, throw with details
  if (validationErrors.length > 0) {
    const errorDetails = validationErrors.map((e) => `${e.field}: ${e.message}`).join("; ");
    throw new Error(`Meal plan structure is invalid. ${errorDetails}`);
  }

  // Map JSON structure to internal types
  const dailySummary: MealPlanContentDailySummary = {
    kcal: Math.round(parsed.meal_plan.daily_summary.kcal),
    proteins: Math.round(parsed.meal_plan.daily_summary.proteins),
    fats: Math.round(parsed.meal_plan.daily_summary.fats),
    carbs: Math.round(parsed.meal_plan.daily_summary.carbs),
  };

  const meals: MealPlanMeal[] = parsed.meal_plan.meals.map((meal) => ({
    name: meal.name.trim(),
    ingredients: meal.ingredients.trim(),
    preparation: meal.preparation.trim(),
    summary: {
      kcal: Math.round(meal.summary.kcal),
      p: Math.round(meal.summary.protein), // Map "protein" → "p"
      f: Math.round(meal.summary.fat), // Map "fat" → "f"
      c: Math.round(meal.summary.carb), // Map "carb" → "c"
    },
  }));

  return { meals, dailySummary };
}

/**
 * Extracts comments from JSON structure in a message.
 * Looks for the "comments" field in the parsed JSON object.
 * Returns the comments text if found, or null if no comments field exists.
 *
 * @param message - The AI message containing JSON meal plan
 * @returns Comments text or null if not found
 */
export function extractComments(message: string): string | null {
  // Try to extract JSON from message
  let jsonString = message.trim();

  // Find the JSON object by matching braces
  let jsonStartIndex = -1;
  let jsonEndIndex = -1;

  // Find the first {
  jsonStartIndex = jsonString.indexOf("{");
  if (jsonStartIndex === -1) {
    return null;
  }

  // Find the matching closing brace
  let braceCount = 0;
  for (let i = jsonStartIndex; i < jsonString.length; i++) {
    if (jsonString[i] === "{") braceCount++;
    if (jsonString[i] === "}") braceCount--;
    if (braceCount === 0) {
      jsonEndIndex = i;
      break;
    }
  }

  if (jsonEndIndex === -1) {
    return null;
  }

  // Extract just the JSON part
  jsonString = jsonString.slice(jsonStartIndex, jsonEndIndex + 1);

  // Try to parse JSON and extract comments
  try {
    const parsed = JSON.parse(jsonString) as { comments?: string };
    if (parsed.comments && typeof parsed.comments === "string") {
      return parsed.comments.trim();
    }
  } catch {
    // If JSON parsing fails, return null (not a JSON message or malformed)
    return null;
  }

  return null;
}

/**
 * Removes JSON structure from a message string, keeping only the text content.
 * This is used to display clean messages in the chat without JSON clutter.
 * Preserves comments content but removes the JSON meal plan structure.
 *
 * @param message - The AI message containing JSON meal plan
 * @returns Clean message text with JSON structure removed, comments preserved
 */
export function removeJsonFromMessage(message: string): string {
  // Extract comments first before removing JSON
  const comments = extractComments(message);

  // Try to find and remove JSON structure
  let cleaned = message.trim();

  // If message starts with {, try to remove the entire JSON object
  if (cleaned.startsWith("{")) {
    // Find the matching closing brace
    let braceCount = 0;
    let jsonEndIndex = -1;
    for (let i = 0; i < cleaned.length; i++) {
      if (cleaned[i] === "{") braceCount++;
      if (cleaned[i] === "}") braceCount--;
      if (braceCount === 0) {
        jsonEndIndex = i;
        break;
      }
    }

    if (jsonEndIndex !== -1) {
      // Remove the JSON object
      cleaned = cleaned.slice(jsonEndIndex + 1).trim();
    }
  } else {
    // Try to find JSON object in the message
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      // Remove the JSON match
      cleaned = cleaned.replace(/\{[\s\S]*\}/, "").trim();
    }
  }

  // Clean up extra whitespace
  cleaned = cleaned.trim().replace(/\n\s*\n\s*\n/g, "\n\n");

  // If we had comments, ensure they're included in the cleaned output
  if (comments && !cleaned.includes(comments)) {
    cleaned = comments + (cleaned ? "\n\n" + cleaned : "");
  }

  return cleaned.trim() || "Meal plan updated above.";
}
