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

interface JsonMultiDayPlanResponse {
  multi_day_plan: {
    days: {
      day_number: number;
      name?: string;
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
            protein: number;
            fat: number;
            carb: number;
          };
        }[];
      };
    }[];
    summary: {
      number_of_days: number;
      average_kcal: number;
      average_proteins: number;
      average_fats: number;
      average_carbs: number;
    };
  };
  comments?: string; // Optional comments field
}

export function parseJsonMultiDayPlan(message: string): {
  days: {
    day_number: number;
    plan_content: {
      daily_summary: MealPlanContentDailySummary;
      meals: MealPlanMeal[];
    };
    name?: string;
  }[];
  summary: {
    number_of_days: number;
    average_kcal: number;
    average_proteins: number;
    average_fats: number;
    average_carbs: number;
  };
} {
  let jsonString = message.trim();

  if (!jsonString.startsWith("{")) {
    const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonString = jsonMatch[0];
    } else {
      throw new Error("No valid JSON structure found in message. Expected JSON object with 'multi_day_plan' key.");
    }
  }

  let parsed: JsonMultiDayPlanResponse;
  try {
    parsed = JSON.parse(jsonString);
  } catch (error) {
    const syntaxError = error instanceof SyntaxError ? error.message : "Unknown JSON syntax error";
    throw new Error(`Failed to parse JSON: ${syntaxError}. Please ensure the response is valid JSON.`);
  }

  // Validate structure
  const validationErrors: ValidationError[] = [];

  if (!parsed.multi_day_plan) {
    validationErrors.push({ field: "multi_day_plan", message: "Missing required field: multi_day_plan" });
  } else {
    if (!Array.isArray(parsed.multi_day_plan.days)) {
      validationErrors.push({ field: "multi_day_plan.days", message: "multi_day_plan.days must be an array" });
    } else if (parsed.multi_day_plan.days.length === 0) {
      validationErrors.push({ field: "multi_day_plan.days", message: "multi_day_plan.days array cannot be empty" });
    } else {
      parsed.multi_day_plan.days.forEach((day, dayIndex) => {
        const dayPrefix = `multi_day_plan.days[${dayIndex}]`;

        if (typeof day.day_number !== "number" || day.day_number < 1 || day.day_number > 7) {
          validationErrors.push({
            field: `${dayPrefix}.day_number`,
            message: "day_number must be a number between 1 and 7",
          });
        }

        if (!day.meal_plan) {
          validationErrors.push({ field: `${dayPrefix}.meal_plan`, message: "Missing required field: meal_plan" });
        } else {
          if (!day.meal_plan.daily_summary) {
            validationErrors.push({
              field: `${dayPrefix}.meal_plan.daily_summary`,
              message: "Missing required field: meal_plan.daily_summary",
            });
          } else {
            const ds = day.meal_plan.daily_summary;
            if (typeof ds.kcal !== "number" || ds.kcal <= 0) {
              validationErrors.push({
                field: `${dayPrefix}.meal_plan.daily_summary.kcal`,
                message: "daily_summary.kcal must be a positive number",
              });
            }
            if (typeof ds.proteins !== "number" || ds.proteins < 0) {
              validationErrors.push({
                field: `${dayPrefix}.meal_plan.daily_summary.proteins`,
                message: "daily_summary.proteins must be a non-negative number",
              });
            }
            if (typeof ds.fats !== "number" || ds.fats < 0) {
              validationErrors.push({
                field: `${dayPrefix}.meal_plan.daily_summary.fats`,
                message: "daily_summary.fats must be a non-negative number",
              });
            }
            if (typeof ds.carbs !== "number" || ds.carbs < 0) {
              validationErrors.push({
                field: `${dayPrefix}.meal_plan.daily_summary.carbs`,
                message: "daily_summary.carbs must be a non-negative number",
              });
            }
          }

          // Validate meals array
          if (!Array.isArray(day.meal_plan.meals)) {
            validationErrors.push({
              field: `${dayPrefix}.meal_plan.meals`,
              message: "meal_plan.meals must be an array",
            });
          } else if (day.meal_plan.meals.length === 0) {
            validationErrors.push({
              field: `${dayPrefix}.meal_plan.meals`,
              message: "meal_plan.meals array cannot be empty",
            });
          } else {
            day.meal_plan.meals.forEach((meal, mealIndex) => {
              const mealPrefix = `${dayPrefix}.meal_plan.meals[${mealIndex}]`;

              if (typeof meal.name !== "string" || meal.name.trim() === "") {
                validationErrors.push({
                  field: `${mealPrefix}.name`,
                  message: "Meal name must be a non-empty string",
                });
              }
              if (typeof meal.ingredients !== "string") {
                validationErrors.push({
                  field: `${mealPrefix}.ingredients`,
                  message: "Meal ingredients must be a string",
                });
              }
              if (typeof meal.preparation !== "string") {
                validationErrors.push({
                  field: `${mealPrefix}.preparation`,
                  message: "Meal preparation must be a string",
                });
              }

              if (!meal.summary) {
                validationErrors.push({
                  field: `${mealPrefix}.summary`,
                  message: "Missing required field: meal.summary",
                });
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
      });
    }

    if (!parsed.multi_day_plan.summary) {
      validationErrors.push({
        field: "multi_day_plan.summary",
        message: "Missing required field: multi_day_plan.summary",
      });
    } else {
      const s = parsed.multi_day_plan.summary;
      if (typeof s.number_of_days !== "number" || s.number_of_days < 1 || s.number_of_days > 7) {
        validationErrors.push({
          field: "multi_day_plan.summary.number_of_days",
          message: "summary.number_of_days must be a number between 1 and 7",
        });
      }
      if (typeof s.average_kcal !== "number" || s.average_kcal < 0) {
        validationErrors.push({
          field: "multi_day_plan.summary.average_kcal",
          message: "summary.average_kcal must be a non-negative number",
        });
      }
      if (typeof s.average_proteins !== "number" || s.average_proteins < 0) {
        validationErrors.push({
          field: "multi_day_plan.summary.average_proteins",
          message: "summary.average_proteins must be a non-negative number",
        });
      }
      if (typeof s.average_fats !== "number" || s.average_fats < 0) {
        validationErrors.push({
          field: "multi_day_plan.summary.average_fats",
          message: "summary.average_fats must be a non-negative number",
        });
      }
      if (typeof s.average_carbs !== "number" || s.average_carbs < 0) {
        validationErrors.push({
          field: "multi_day_plan.summary.average_carbs",
          message: "summary.average_carbs must be a non-negative number",
        });
      }
    }
  }

  // If validation errors exist, throw with details
  if (validationErrors.length > 0) {
    const errorDetails = validationErrors.map((e) => `${e.field}: ${e.message}`).join("; ");
    throw new Error(`Multi-day meal plan structure is invalid. ${errorDetails}`);
  }

  // Debug: Log the parsed structure before mapping
  // eslint-disable-next-line no-console
  console.log("[parseJsonMultiDayPlan] Parsed structure:", {
    total_days: parsed.multi_day_plan.days.length,
    days_info: parsed.multi_day_plan.days.map((d) => ({
      day_number: d.day_number,
      name: d.name,
      meals_count: d.meal_plan?.meals?.length || 0,
      meal_names: d.meal_plan?.meals?.map((m) => m.name) || [],
    })),
  });

  const days = parsed.multi_day_plan.days.map((day) => {
    const dailySummary: MealPlanContentDailySummary = {
      kcal: Math.round(day.meal_plan.daily_summary.kcal),
      proteins: Math.round(day.meal_plan.daily_summary.proteins),
      fats: Math.round(day.meal_plan.daily_summary.fats),
      carbs: Math.round(day.meal_plan.daily_summary.carbs),
    };

    const meals: MealPlanMeal[] = day.meal_plan.meals.map((meal) => ({
      name: meal.name.trim(),
      ingredients: meal.ingredients.trim(),
      preparation: meal.preparation.trim(),
      summary: {
        kcal: Math.round(meal.summary.kcal),
        p: Math.round(meal.summary.protein),
        f: Math.round(meal.summary.fat),
        c: Math.round(meal.summary.carb),
      },
    }));

    // Debug: Log each day being created
    // eslint-disable-next-line no-console
    console.log("[parseJsonMultiDayPlan] Creating day:", {
      day_number: day.day_number,
      name: day.name,
      meals_count: meals.length,
      meal_names: meals.map((m) => m.name),
    });

    return {
      day_number: day.day_number,
      plan_content: {
        daily_summary: dailySummary,
        meals,
      },
      name: day.name?.trim(),
    };
  });

  const summary = {
    number_of_days: parsed.multi_day_plan.summary.number_of_days,
    average_kcal: Math.round(parsed.multi_day_plan.summary.average_kcal),
    average_proteins: Math.round(parsed.multi_day_plan.summary.average_proteins),
    average_fats: Math.round(parsed.multi_day_plan.summary.average_fats),
    average_carbs: Math.round(parsed.multi_day_plan.summary.average_carbs),
  };

  // Debug: Log final result
  // eslint-disable-next-line no-console
  console.log("[parseJsonMultiDayPlan] Final parsed result:", {
    days_count: days.length,
    days_summary: days.map((d) => ({
      day_number: d.day_number,
      name: d.name,
      meals_count: d.plan_content.meals.length,
    })),
    summary_number_of_days: summary.number_of_days,
  });

  return { days, summary };
}
