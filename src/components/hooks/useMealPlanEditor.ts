import { useEffect, useState, useCallback } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { mealPlanFormSchema, type MealPlanFormData } from "@/lib/validation/meal-plan-form.schema";
import { mealPlansApi } from "@/lib/api/meal-plans.client";
import { parseXmlMealPlan } from "@/lib/utils/meal-plan-parser";
import { resolveDailySummary } from "@/lib/utils/meal-plan-calculations";
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
  params?: Record<string, string>;
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

    // Parse XML structure from AI message
    const { meals, dailySummary: parsedDailySummary } = parseXmlMealPlan(bridge.lastAssistantMessage);

    // If daily summary from XML is empty, fall back to calculated values
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
   */
  const scrollToField = (selector: string, errorKey: string, params?: Record<string, string>) => {
    const element = document.querySelector(selector);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      // Focus the input if it's an input element
      if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
        setTimeout(() => element.focus(), 100);
      }
      setError({ key: errorKey, params });
    }
  };

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
              scrollToField(`#meal-name-${index}`, "editor.validation.mealNameRequired", { index: String(index + 1) });
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
      // For API errors, store the raw message (not a translation key)
      // These are typically server errors that don't have translations
      const errorMessage = err instanceof Error ? err.message : "An error occurred while saving. Please try again.";
      setError({ key: errorMessage });
      setIsLoading(false);
    }
  }, [form, dailySummary, mode, sessionId, startupData, mealPlanId]);

  /**
   * Handles export button click (Edit Mode only).
   */
  const handleExport = useCallback(async () => {
    if (!mealPlanId) {
      return;
    }

    try {
      const blob = await mealPlansApi.export(mealPlanId);

      const filename = `meal-plan-${mealPlanId}.doc`;

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to export meal plan";
      setError({ key: errorMessage });
    }
  }, [mealPlanId]);

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
