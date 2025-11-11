import { useEffect, useState, useCallback } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { mealPlanFormSchema, type MealPlanFormData } from "@/lib/validation/meal-plan-form.schema";
import { mealPlansApi } from "@/lib/api/meal-plans.client";
import { parseJsonMealPlan } from "@/lib/utils/meal-plan-parser";
import { resolveDailySummary } from "@/lib/utils/meal-plan-calculations";
import {
  formatValidationErrors,
  getFieldSelector,
  type FormattedValidationError,
} from "@/lib/utils/validation-error-mapper";
import { isValidationError, type ValidationErrorDetail } from "@/lib/api/base.client";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { TranslationKey } from "@/lib/i18n/types";
import type {
  MealPlanContentDailySummary,
  MealPlanStartupData,
  MealPlanContent,
  CreateMealPlanCommand,
  UpdateMealPlanCommand,
} from "@/types";

/**
 * State bridge structure for passing data from AI Chat to Editor.
 */
interface StateBridge {
  sessionId: string;
  lastAssistantMessage: string;
  startupData?: MealPlanStartupData;
}

interface UseMealPlanEditorProps {
  mealPlanId?: string;
}

interface ErrorInfo {
  key: string;
  params?: Record<string, string | number>;
  fieldErrors?: Map<string, FormattedValidationError>; // Map of field paths to errors for inline display
}

interface UseMealPlanEditorReturn {
  form: ReturnType<typeof useForm<MealPlanFormData>>;
  fields: ReturnType<typeof useFieldArray<MealPlanFormData, "meals">>["fields"];
  append: ReturnType<typeof useFieldArray<MealPlanFormData, "meals">>["append"];
  remove: ReturnType<typeof useFieldArray<MealPlanFormData, "meals">>["remove"];
  isLoading: boolean;
  error: ErrorInfo | null;
  dailySummary: MealPlanContentDailySummary;
  startupData: MealPlanStartupData | null;
  sessionId: string | null;
  mode: "create" | "edit";
  handleSave: () => Promise<void>;
}

/**
 * Custom hook for managing meal plan editor state and operations.
 * Handles form state, dynamic meal array, and API operations.
 */
export function useMealPlanEditor({ mealPlanId }: UseMealPlanEditorProps): UseMealPlanEditorReturn {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ErrorInfo | null>(null);
  const [dailySummary, setDailySummary] = useState<MealPlanContentDailySummary>({
    kcal: 0,
    proteins: 0,
    fats: 0,
    carbs: 0,
  });
  const [startupData, setStartupData] = useState<MealPlanStartupData | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [mode] = useState<"create" | "edit">(mealPlanId ? "edit" : "create");

  const form = useForm<MealPlanFormData>({
    resolver: zodResolver(mealPlanFormSchema),
    defaultValues: {
      planName: "",
      meals: [],
    },
    mode: "onChange",
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "meals",
  });

  /**
   * Loads meal plan from API (Edit Mode).
   */
  const loadMealPlanFromApi = useCallback(
    async (id: string) => {
      const data = await mealPlansApi.getById(id);

      // Extract startup data from flat fields
      const extractedStartupData: MealPlanStartupData = {
        patient_age: data.patient_age,
        patient_weight: data.patient_weight,
        patient_height: data.patient_height,
        activity_level: data.activity_level,
        target_kcal: data.target_kcal,
        target_macro_distribution: data.target_macro_distribution,
        meal_names: data.meal_names,
        exclusions_guidelines: data.exclusions_guidelines,
      };

      setStartupData(extractedStartupData);
      setDailySummary(data.plan_content.daily_summary);

      // Reset form with loaded data
      form.reset({
        planName: data.name,
        meals: data.plan_content.meals,
      });
    },
    [form]
  );

  /**
   * Loads meal plan from sessionStorage bridge (Create Mode).
   */
  const loadMealPlanFromBridge = useCallback(async () => {
    const storedData = sessionStorage.getItem("mealPlanBridge");
    if (!storedData) {
      throw new Error("No meal plan data available. Please start from the dashboard.");
    }

    const bridge: StateBridge = JSON.parse(storedData);
    sessionStorage.removeItem("mealPlanBridge");

    // Parse JSON structure from AI message
    const { meals, dailySummary: parsedDailySummary } = parseJsonMealPlan(bridge.lastAssistantMessage);

    // If daily summary from JSON is empty, fall back to calculated values
    const finalDailySummary = resolveDailySummary(parsedDailySummary, bridge.startupData);

    setDailySummary(finalDailySummary);
    setStartupData(bridge.startupData || null);
    setSessionId(bridge.sessionId);

    // Reset form with parsed data
    form.reset({
      planName: "",
      meals,
    });
  }, [form]);

  /**
   * Initialize editor: Load data from bridge (Create Mode) or API (Edit Mode).
   */
  useEffect(() => {
    const initializeEditor = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (mealPlanId) {
          await loadMealPlanFromApi(mealPlanId);
        } else {
          await loadMealPlanFromBridge();
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to initialize editor. Please try again.";
        setError({ key: errorMessage });
      } finally {
        setIsLoading(false);
      }
    };

    initializeEditor();
  }, [mealPlanId, loadMealPlanFromApi, loadMealPlanFromBridge]);

  /**
   * Scrolls to an element by its selector and focuses it.
   * Also sets form field error with translated message.
   */
  const scrollToField = useCallback(
    (selector: string, errorKey: string, params?: Record<string, string | number>) => {
      const element = document.querySelector(selector);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        // Focus the input if it's an input element
        if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
          setTimeout(() => element.focus(), 100);
        }

        // Translate the error message
        let translatedMessage = t(errorKey as TranslationKey);
        if (params) {
          for (const [key, value] of Object.entries(params)) {
            translatedMessage = translatedMessage.replace(new RegExp(`\\{${key}\\}`, "g"), String(value));
          }
        }

        // Set form field error with translated message
        if (selector === "#plan-name") {
          form.setError("planName", {
            type: "validation",
            message: translatedMessage,
          });
        } else if (selector.startsWith("#meal-name-")) {
          const match = selector.match(/#meal-name-(\d+)/);
          if (match) {
            const mealIndex = parseInt(match[1], 10);
            // Note: Using 'as any' here is necessary because react-hook-form's types
            // don't perfectly handle dynamic field paths constructed at runtime.
            // The path is validated by the regex match above, so this is type-safe in practice.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            form.setError(`meals.${mealIndex}.name` as any, {
              type: "validation",
              message: translatedMessage,
            });
          }
        }

        setError({ key: errorKey, params });
      }
    },
    [form, t]
  );

  /**
   * Handles form submission (save).
   */
  const handleSave = useCallback(async () => {
    const isValid = await form.trigger();
    if (!isValid) {
      const errors = form.formState.errors;

      // Check plan name error first
      if (errors.planName) {
        scrollToField("#plan-name", "editor.validation.planNameRequired");
        return;
      }

      // Check meals errors
      if (errors.meals) {
        // Check if it's an array-level error (e.g., "at least one meal required")
        if (errors.meals.message) {
          setError({ key: "editor.validation.mealsRequired" });
          // Scroll to meals section
          const mealsSection = document.querySelector('[data-testid="meal-plan-editor-meals-section"]');
          if (mealsSection) {
            mealsSection.scrollIntoView({ behavior: "smooth", block: "center" });
          }
          return;
        }

        // Check individual meal name errors
        // In react-hook-form, field array errors are accessed by index as object keys
        const mealsError = errors.meals as Record<number, { name?: { message?: string } }> | undefined;
        if (mealsError) {
          // Iterate through numeric keys (meal indices)
          for (const key in mealsError) {
            const index = Number(key);
            if (!isNaN(index) && mealsError[index]?.name) {
              scrollToField(`#meal-name-${index}`, "editor.validation.mealNameRequired", { index: index + 1 });
              return;
            }
          }
        }

        // Fallback for meals error
        setError({ key: "editor.validation.fixMealErrors" });
        const mealsSection = document.querySelector('[data-testid="meal-plan-editor-meals-section"]');
        if (mealsSection) {
          mealsSection.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        return;
      }

      // Fallback error
      setError({ key: "editor.validation.fixFormErrors" });
    }

    setIsLoading(true);
    setError(null);

    try {
      const formData = form.getValues();
      const planContent: MealPlanContent = {
        daily_summary: dailySummary,
        meals: formData.meals,
      };

      if (mode === "create") {
        const command: CreateMealPlanCommand = {
          name: formData.planName.trim(),
          source_chat_session_id: sessionId || null,
          plan_content: planContent,
          startup_data: startupData || {
            patient_age: null,
            patient_weight: null,
            patient_height: null,
            activity_level: null,
            target_kcal: null,
            target_macro_distribution: null,
            meal_names: null,
            exclusions_guidelines: null,
          },
        };

        await mealPlansApi.create(command);
        window.location.href = "/app/dashboard";
      } else {
        if (!mealPlanId) {
          throw new Error("Meal plan ID is required for update");
        }

        const command: UpdateMealPlanCommand = {
          name: formData.planName.trim(),
          plan_content: planContent,
        };

        await mealPlansApi.update(mealPlanId, command);
        window.location.href = "/app/dashboard";
      }
    } catch (err) {
      setIsLoading(false);

      // Check if this is a validation error with structured details
      if (isValidationError(err)) {
        const validationDetails: ValidationErrorDetail[] = err.validationDetails;

        // Format validation errors using the mapper
        const formattedErrors = formatValidationErrors(validationDetails);

        // Create a map of field paths to errors for inline display
        const fieldErrorsMap = new Map<string, FormattedValidationError>();
        formattedErrors.forEach((error) => {
          if (error.fieldPath) {
            fieldErrorsMap.set(error.fieldPath, error);
          }
        });

        // Set form field errors for inline display
        formattedErrors.forEach((formattedError) => {
          if (formattedError.fieldPath) {
            // Format error message with translated field names
            let errorMessage = t(formattedError.translationKey as TranslationKey);
            if (formattedError.params) {
              // Replace placeholders in the translated message
              for (const [key, value] of Object.entries(formattedError.params)) {
                if (key === "fieldKey" && typeof value === "string") {
                  // Translate the field name and replace {field} placeholder
                  const translatedField = t(value as TranslationKey);
                  errorMessage = errorMessage.replace(/\{field\}/g, translatedField);
                } else {
                  // Replace other placeholders
                  errorMessage = errorMessage.replace(new RegExp(`\\{${key}\\}`, "g"), String(value));
                }
              }
            }

            // Map field path to react-hook-form path
            if (formattedError.fieldPath.startsWith("meals.")) {
              // Extract meal index and field (handles both direct fields and nested summary fields)
              const match = formattedError.fieldPath.match(/^meals\.(\d+)\.(.+)$/);
              if (match) {
                const mealIndex = parseInt(match[1], 10);
                const fieldPath = match[2]; // This could be "name", "ingredients", "preparation", or "summary.kcal", etc.
                // Note: Using 'as any' here is necessary because react-hook-form's types
                // don't perfectly handle dynamic field paths constructed at runtime.
                // The path is validated by the regex match above, so this is type-safe in practice.
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                form.setError(`meals.${mealIndex}.${fieldPath}` as any, {
                  type: "validation",
                  message: errorMessage,
                });
              }
            } else if (formattedError.fieldPath === "name" || formattedError.fieldPath === "planName") {
              form.setError("planName", {
                type: "validation",
                message: errorMessage,
              });
            }
          }
        });

        // Scroll to first error field
        const firstError = formattedErrors[0];
        if (firstError?.fieldPath) {
          const selector = getFieldSelector(firstError.fieldPath);
          if (selector) {
            const element = document.querySelector(selector);
            if (element) {
              element.scrollIntoView({ behavior: "smooth", block: "center" });
              if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
                setTimeout(() => element.focus(), 100);
              }
            }
          }
        }

        // Set general error message
        setError({
          key: "editor.validation.fixMealErrors",
          params: {},
          fieldErrors: fieldErrorsMap,
        });
        return;
      }

      // For other API errors
      if (err instanceof Error) {
        const errorMessage = err.message;

        // Check if it's a validation error (but without structured details)
        if (errorMessage.includes("Validation failed") || errorMessage.includes("→")) {
          setError({
            key: "editor.validation.fixMealErrors",
            params: {},
          });
        } else {
          // Other API errors
          setError({ key: errorMessage });
        }
      } else {
        setError({ key: "An error occurred while saving. Please try again." });
      }
    }
  }, [form, dailySummary, mode, sessionId, startupData, mealPlanId, scrollToField, t]);

  return {
    form,
    fields,
    append,
    remove,
    isLoading,
    error,
    dailySummary,
    startupData,
    sessionId,
    mode,
    handleSave,
  };
}
