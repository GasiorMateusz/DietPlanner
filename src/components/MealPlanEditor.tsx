import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "./ui/alert";
import { Skeleton } from "./ui/skeleton";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { DailySummaryStaticDisplay } from "./DailySummaryStaticDisplay";
import { MealCard } from "./MealCard";
import { parseXmlMealPlan } from "../lib/utils/meal-plan-parser";
import type {
  MealPlanMeal,
  MealPlanContentDailySummary,
  MealPlanStartupData,
  GetMealPlanByIdResponseDto,
  CreateMealPlanCommand,
  UpdateMealPlanCommand,
  MealPlanContent,
} from "../types";

/**
 * Internal state structure for the MealPlanEditor component.
 * Represents the form state before submission to API.
 */
interface MealPlanEditorState {
  /** Whether component is in Create or Edit mode */
  mode: "create" | "edit";
  /** Loading state during initialization or save */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Meal plan name (required for save) */
  planName: string;
  /** Array of meal objects (minimum 1 required) */
  meals: MealPlanMeal[];
  /** Daily nutritional summary (read-only, from AI/initial data) */
  dailySummary: MealPlanContentDailySummary;
  /** Optional session ID from AI chat (Create Mode only) */
  sessionId?: string | null;
  /** Optional startup data for display */
  startupData?: MealPlanStartupData | null;
  /** Optional meal plan ID (Edit Mode only) */
  mealPlanId?: string;
}

/**
 * State bridge structure for passing data from AI Chat to Editor.
 * Stored in window object temporarily.
 */
interface StateBridge {
  /** Session ID from AI chat */
  sessionId: string;
  /** Last assistant message content (meal plan text) */
  lastAssistantMessage: string;
  /** Optional startup data */
  startupData?: MealPlanStartupData;
}

interface MealPlanEditorProps {
  /** Optional meal plan ID for Edit Mode */
  mealPlanId?: string;
}

/**
 * Main React component for the Meal Plan Editor.
 * Supports both Create Mode (from AI chat) and Edit Mode (existing meal plan).
 */
export default function MealPlanEditor({ mealPlanId }: MealPlanEditorProps) {
  const [editorState, setEditorState] = useState<MealPlanEditorState>({
    mode: mealPlanId ? "edit" : "create",
    isLoading: true,
    error: null,
    planName: "",
    meals: [],
    dailySummary: {
      kcal: 0,
      proteins: 0,
      fats: 0,
      carbs: 0,
    },
    mealPlanId,
  });

  /**
   * Initialize editor: Load data from window bridge (Create Mode) or API (Edit Mode).
   */
  useEffect(() => {
    const initializeEditor = async () => {
      try {
        setEditorState((prev) => ({ ...prev, isLoading: true, error: null }));

        if (mealPlanId) {
          // Edit Mode: Fetch existing meal plan from API
          await loadMealPlanFromApi(mealPlanId);
        } else {
          // Create Mode: Read from window bridge
          await loadMealPlanFromBridge();
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to initialize editor. Please try again.";
        setEditorState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
      }
    };

    initializeEditor();
  }, [mealPlanId]);

  /**
   * Loads meal plan data from API (Edit Mode).
   */
  const loadMealPlanFromApi = async (id: string) => {
    const response = await fetch(`/api/meal-plans/${id}`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        window.location.href = "/login";
        throw new Error("Unauthorized");
      }
      if (response.status === 404) {
        throw new Error("Meal plan not found or you don't have access to it.");
      }
      const errorData = await response.json().catch(() => ({
        error: "Failed to load meal plan",
      }));
      throw new Error(errorData.error || "Failed to load meal plan");
    }

    const data: GetMealPlanByIdResponseDto = await response.json();

    // Extract startup data from flat fields
    const startupData: MealPlanStartupData = {
      patient_age: data.patient_age,
      patient_weight: data.patient_weight,
      patient_height: data.patient_height,
      activity_level: data.activity_level,
      target_kcal: data.target_kcal,
      target_macro_distribution: data.target_macro_distribution,
      meal_names: data.meal_names,
      exclusions_guidelines: data.exclusions_guidelines,
    };

    setEditorState({
      mode: "edit",
      isLoading: false,
      error: null,
      planName: data.name,
      meals: data.plan_content.meals,
      dailySummary: data.plan_content.daily_summary,
      startupData,
      mealPlanId: id,
    });
  };

  /**
   * Handles plan name change.
   */
  const handlePlanNameChange = (value: string) => {
    setEditorState((prev) => ({ ...prev, planName: value }));
  };

  /**
   * Handles adding a new meal card.
   */
  const handleMealAdd = () => {
    const newMeal: MealPlanMeal = {
      name: "",
      ingredients: "",
      preparation: "",
      summary: {
        kcal: 0,
        p: 0,
        f: 0,
        c: 0,
      },
    };
    setEditorState((prev) => ({
      ...prev,
      meals: [...prev.meals, newMeal],
    }));
  };

  /**
   * Handles removing a meal card by index.
   */
  const handleMealRemove = (index: number) => {
    if (editorState.meals.length <= 1) {
      return; // Don't remove if only one meal remains
    }
    setEditorState((prev) => ({
      ...prev,
      meals: prev.meals.filter((_, i) => i !== index),
    }));
  };

  /**
   * Handles updating a meal field value.
   */
  const handleMealChange = (index: number, field: keyof MealPlanMeal, value: string) => {
    setEditorState((prev) => ({
      ...prev,
      meals: prev.meals.map((meal, i) => (i === index ? { ...meal, [field]: value } : meal)),
    }));
  };

  /**
   * Validates form before saving.
   * Returns error message if validation fails, null if valid.
   */
  const validateForm = (): string | null => {
    if (!editorState.planName.trim()) {
      return "Plan name is required";
    }

    if (editorState.meals.length === 0) {
      return "At least one meal is required";
    }

    for (let i = 0; i < editorState.meals.length; i++) {
      if (!editorState.meals[i].name.trim()) {
        return `Meal ${i + 1} name is required`;
      }
    }

    return null;
  };

  /**
   * Handles form submission (save).
   */
  const handleSave = async () => {
    const validationError = validateForm();
    if (validationError) {
      setEditorState((prev) => ({ ...prev, error: validationError }));
      return;
    }

    setEditorState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const planContent: MealPlanContent = {
        daily_summary: editorState.dailySummary,
        meals: editorState.meals,
      };

      if (editorState.mode === "create") {
        // Create Mode: POST /api/meal-plans
        const command: CreateMealPlanCommand = {
          name: editorState.planName.trim(),
          source_chat_session_id: editorState.sessionId || null,
          plan_content: planContent,
          startup_data: editorState.startupData || {
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

        const response = await fetch("/api/meal-plans", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(command),
        });

        if (!response.ok) {
          if (response.status === 401) {
            window.location.href = "/login";
            return;
          }
          const errorData = await response.json().catch(() => ({
            error: "Failed to create meal plan",
          }));
          throw new Error(errorData.error || errorData.details || "Failed to create meal plan");
        }

        // On success, redirect to dashboard
        window.location.href = "/app/dashboard";
      } else {
        // Edit Mode: PUT /api/meal-plans/{id}
        if (!editorState.mealPlanId) {
          throw new Error("Meal plan ID is required for update");
        }

        const command: UpdateMealPlanCommand = {
          name: editorState.planName.trim(),
          plan_content: planContent,
        };

        const response = await fetch(`/api/meal-plans/${editorState.mealPlanId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(command),
        });

        if (!response.ok) {
          if (response.status === 401) {
            window.location.href = "/login";
            return;
          }
          if (response.status === 404) {
            throw new Error("Meal plan not found or you don't have access to it.");
          }
          const errorData = await response.json().catch(() => ({
            error: "Failed to update meal plan",
          }));
          throw new Error(errorData.error || errorData.details || "Failed to update meal plan");
        }

        // On success, redirect to dashboard
        window.location.href = "/app/dashboard";
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred while saving. Please try again.";
      setEditorState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    }
  };

  /**
   * Handles export button click (Edit Mode only).
   */
  const handleExport = () => {
    if (editorState.mealPlanId) {
      window.open(`/api/meal-plans/${editorState.mealPlanId}/export`, "_blank");
    }
  };

  /**
   * Handles cancel button click - navigates back to dashboard.
   */
  const handleCancel = () => {
    window.location.href = "/app/dashboard";
  };

  /**
   * Checks if form is ready to be saved.
   */
  const isFormReady = (): boolean => {
    if (editorState.isLoading) return false;
    if (!editorState.planName.trim()) return false;
    if (editorState.meals.length === 0) return false;
    return editorState.meals.every((meal) => meal.name.trim() !== "");
  };


  /**
   * Loads meal plan data from sessionStorage bridge (Create Mode).
   * Parses AI-generated meal plan text into structured format.
   */
  const loadMealPlanFromBridge = async () => {
    // Read from sessionStorage
    const storedData = sessionStorage.getItem("mealPlanBridge");

    if (!storedData) {
      throw new Error("No meal plan data available. Please start from the dashboard.");
    }

    const bridge: StateBridge = JSON.parse(storedData);

    // Clear sessionStorage after reading
    sessionStorage.removeItem("mealPlanBridge");

    // Parse XML structure from AI message
    const { meals, dailySummary } = parseXmlMealPlan(bridge.lastAssistantMessage);

    // If daily summary from XML is empty, fall back to calculated values
    const finalDailySummary =
      dailySummary.kcal > 0
        ? dailySummary
        : {
            kcal: bridge.startupData?.target_kcal || 0,
            proteins:
              bridge.startupData?.target_kcal && bridge.startupData?.target_macro_distribution
                ? Math.round(
                    (bridge.startupData.target_kcal * bridge.startupData.target_macro_distribution.p_perc) / 100 / 4
                  )
                : 0,
            fats:
              bridge.startupData?.target_kcal && bridge.startupData?.target_macro_distribution
                ? Math.round(
                    (bridge.startupData.target_kcal * bridge.startupData.target_macro_distribution.f_perc) / 100 / 9
                  )
                : 0,
            carbs:
              bridge.startupData?.target_kcal && bridge.startupData?.target_macro_distribution
                ? Math.round(
                    (bridge.startupData.target_kcal * bridge.startupData.target_macro_distribution.c_perc) / 100 / 4
                  )
                : 0,
          };

    setEditorState({
      mode: "create",
      isLoading: false,
      error: null,
      planName: "",
      meals,
      dailySummary: finalDailySummary,
      sessionId: bridge.sessionId,
      startupData: bridge.startupData,
    });
  };

  // Show loading state
  if (editorState.isLoading) {
    return (
      <div className="container mx-auto p-4 sm:p-8 max-w-4xl">
        <Skeleton className="h-12 w-64 mb-6" />
        <Skeleton className="h-32 w-full mb-6" />
        <Skeleton className="h-64 w-full mb-6" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Show error state
  if (editorState.error) {
    return (
      <div className="container mx-auto p-4 sm:p-8 max-w-4xl">
        <Alert className="border-destructive bg-destructive/10 text-destructive">
          <AlertDescription>{editorState.error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Main form UI
  return (
    <div className="container mx-auto p-4 sm:p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">
        {editorState.mode === "create" ? "Create Meal Plan" : "Edit Meal Plan"}
      </h1>

      {/* Error Alert */}
      {editorState.error && (
        <Alert className="mb-6 border-destructive bg-destructive/10 text-destructive">
          <AlertDescription>{editorState.error}</AlertDescription>
        </Alert>
      )}

      {/* Form Content */}
      <div className="space-y-6">
        {/* Plan Name Input */}
        <div className="space-y-2">
          <Label htmlFor="plan-name">
            Meal Plan Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="plan-name"
            value={editorState.planName}
            onChange={(e) => handlePlanNameChange(e.target.value)}
            placeholder="Enter meal plan name..."
            required
          />
        </div>

        {/* Daily Summary Display */}
        <DailySummaryStaticDisplay summary={editorState.dailySummary} />

        {/* Meals List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Meals</h2>
            <Button type="button" variant="outline" onClick={handleMealAdd}>
              Add Meal
            </Button>
          </div>

          {editorState.meals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No meals added yet. Click "Add Meal" to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {editorState.meals.map((meal, index) => (
                <MealCard
                  key={index}
                  meal={meal}
                  mealIndex={index}
                  isRemoveable={editorState.meals.length > 1}
                  onNameChange={(idx, value) => handleMealChange(idx, "name", value)}
                  onIngredientsChange={(idx, value) => handleMealChange(idx, "ingredients", value)}
                  onPreparationChange={(idx, value) => handleMealChange(idx, "preparation", value)}
                  onRemove={handleMealRemove}
                />
              ))}
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex gap-4 pt-4 border-t">
          <Button type="button" variant="default" onClick={handleSave} disabled={!isFormReady()}>
            {editorState.isLoading ? "Saving..." : "Save changes"}
          </Button>

          {editorState.mode === "edit" && (
            <Button type="button" variant="outline" onClick={handleExport}>
              Export to .doc
            </Button>
          )}

          <Button type="button" variant="ghost" onClick={handleCancel}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
