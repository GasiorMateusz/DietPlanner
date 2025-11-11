import type { ZodError } from "zod";

/**
 * Maps Zod error paths to user-friendly field names for translation.
 */
const fieldNameMap: Record<string, string> = {
  name: "editor.validation.field.name",
  planName: "editor.validation.field.planName",
  plan_content: "editor.validation.field.planContent",
  meals: "editor.validation.field.meals",
  meal: "editor.validation.field.meal",
  summary: "editor.validation.field.summary",
  daily_summary: "editor.validation.field.dailySummary",
  kcal: "editor.validation.field.kcal",
  proteins: "editor.validation.field.proteins",
  fats: "editor.validation.field.fats",
  carbs: "editor.validation.field.carbs",
  p: "editor.validation.field.protein",
  f: "editor.validation.field.fat",
  c: "editor.validation.field.carb",
  ingredients: "editor.validation.field.ingredients",
  preparation: "editor.validation.field.preparation",
};

/**
 * Maps Zod error codes to user-friendly error message keys.
 */
const errorCodeMap: Record<string, string> = {
  too_small: "editor.validation.error.tooSmall",
  too_big: "editor.validation.error.tooBig",
  invalid_type: "editor.validation.error.invalidType",
  invalid_string: "editor.validation.error.invalidString",
  invalid_enum_value: "editor.validation.error.invalidEnum",
  custom: "editor.validation.error.custom",
};

/**
 * Parses a Zod error path array into a structured error location.
 */
interface ParsedErrorPath {
  field: string;
  mealIndex?: number;
  isMealField: boolean;
  isSummaryField: boolean;
  isDailySummaryField: boolean;
  fullPath: (string | number)[];
}

function parseErrorPath(path: (string | number)[]): ParsedErrorPath {
  const fullPath = [...path];
  let mealIndex: number | undefined;
  let isMealField = false;
  let isSummaryField = false;
  let isDailySummaryField = false;
  let field = "";

  // Check if this is a meal-related error
  const mealsIndex = path.findIndex((segment, idx) => {
    if (segment === "meals" && typeof path[idx + 1] === "number") {
      return true;
    }
    return false;
  });

  if (mealsIndex !== -1 && typeof path[mealsIndex + 1] === "number") {
    mealIndex = path[mealsIndex + 1] as number;
    isMealField = true;

    // Get the field name (after the meal index)
    const fieldSegment = path[mealsIndex + 2];
    if (typeof fieldSegment === "string") {
      field = fieldSegment;

      // Check if it's a summary field
      if (field === "summary") {
        isSummaryField = true;
        // Get the actual summary field (kcal, p, f, c)
        const summaryField = path[mealsIndex + 3];
        if (typeof summaryField === "string") {
          field = summaryField;
        }
      }
    }
  } else if (path[0] === "plan_content") {
    // Check if it's daily_summary
    if (path[1] === "daily_summary") {
      isDailySummaryField = true;
      field = typeof path[2] === "string" ? path[2] : "";
    } else if (path[1] === "meals") {
      // Array-level error for meals
      field = "meals";
    }
  } else {
    // Top-level field (e.g., "name", "planName")
    field = typeof path[0] === "string" ? path[0] : "";
  }

  return {
    field,
    mealIndex,
    isMealField,
    isSummaryField,
    isDailySummaryField,
    fullPath,
  };
}

/**
 * Formats a validation error into a user-friendly, translatable message.
 * Returns an object with translation key and parameters.
 */
export interface FormattedValidationError {
  translationKey: string;
  params?: Record<string, string | number>;
  fieldPath?: string; // For inline error display
  fieldTranslationKey?: string; // Translation key for the field name (for use in error messages)
}

/**
 * Formats Zod validation errors into user-friendly, translatable messages.
 * @param errors - Array of Zod error objects from API response
 * @returns Array of formatted error messages
 */
export function formatValidationErrors(
  errors: Array<{ path?: (string | number)[]; message?: string; code?: string }>
): FormattedValidationError[] {
  return errors.map((error) => {
    if (!error.path || error.path.length === 0) {
      return {
        translationKey: "editor.validation.error.generic",
        params: { message: error.message || "Invalid value" },
      };
    }

    const parsed = parseErrorPath(error.path);
    const errorCode = error.code || "custom";

    // Build translation key based on error location
    let translationKey: string;
    const params: Record<string, string | number> = {};

    // Get field translation key
    const fieldTranslationKey = fieldNameMap[parsed.field] || `editor.validation.field.${parsed.field}`;

    if (parsed.isMealField) {
      // Meal-specific error
      if (parsed.isSummaryField) {
        // Summary field error (kcal, p, f, c)
        translationKey = "editor.validation.mealSummaryError";
        params.mealNumber = (parsed.mealIndex ?? 0) + 1;
        params.fieldKey = fieldTranslationKey; // Pass the translation key, not the translated value
      } else if (parsed.field === "name") {
        // Meal name error
        translationKey = "editor.validation.mealNameRequired";
        params.index = (parsed.mealIndex ?? 0) + 1;
      } else {
        // Other meal field error
        translationKey = "editor.validation.mealFieldError";
        params.mealNumber = (parsed.mealIndex ?? 0) + 1;
        params.fieldKey = fieldTranslationKey;
      }
    } else if (parsed.isDailySummaryField) {
      // Daily summary field error
      translationKey = "editor.validation.dailySummaryError";
      params.fieldKey = fieldTranslationKey;
    } else {
      // Top-level field error
      translationKey = "editor.validation.fieldError";
      params.fieldKey = fieldTranslationKey;
    }

    // Add error type parameter
    const errorTypeKey = errorCodeMap[errorCode] || "editor.validation.error.custom";
    params.errorType = errorTypeKey;

    // Add original message for reference
    if (error.message) {
      params.originalMessage = error.message;
    }

    // Build field path for inline error display
    let fieldPath: string;
    if (parsed.isMealField) {
      if (parsed.isSummaryField) {
        fieldPath = `meals.${parsed.mealIndex}.summary.${parsed.field}`;
      } else {
        fieldPath = `meals.${parsed.mealIndex}.${parsed.field}`;
      }
    } else if (parsed.isDailySummaryField) {
      // Daily summary errors are read-only, so we'll show them in the alert
      fieldPath = `daily_summary.${parsed.field}`;
    } else {
      fieldPath = parsed.field;
    }

    return {
      translationKey,
      params,
      fieldPath,
      fieldTranslationKey,
    };
  });
}

/**
 * Maps a field path to a form field selector for scrolling/focusing.
 */
export function getFieldSelector(fieldPath?: string): string | null {
  if (!fieldPath) return null;

  // Handle meal fields
  const mealFieldMatch = fieldPath.match(/^meals\.(\d+)\.(.+)$/);
  if (mealFieldMatch) {
    const mealIndex = mealFieldMatch[1];
    const field = mealFieldMatch[2];

    if (field === "name") {
      return `#meal-name-${mealIndex}`;
    }
    if (field === "ingredients") {
      return `#meal-ingredients-${mealIndex}`;
    }
    if (field === "preparation") {
      return `#meal-preparation-${mealIndex}`;
    }
    if (field.startsWith("summary.")) {
      const summaryField = field.replace("summary.", "");
      // Summary fields are read-only, so we'll scroll to the meal card
      return `[data-meal-index="${mealIndex}"]`;
    }
  }

  // Handle top-level fields
  if (fieldPath === "name" || fieldPath === "planName") {
    return "#plan-name";
  }

  return null;
}

