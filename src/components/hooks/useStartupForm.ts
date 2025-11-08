import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { mealPlanStartupDataSchema } from "@/lib/validation/meal-plans.schemas";
import type { MealPlanStartupData, TargetMacroDistribution } from "@/types";

interface UseStartupFormProps {
  onSubmit: (data: MealPlanStartupData) => void;
  onClose: () => void;
}

/**
 * Custom hook for managing startup form state and validation.
 * Handles complex number inputs with null values and macro distribution validation.
 */
export function useStartupForm({ onSubmit, onClose }: UseStartupFormProps) {
  // Use the zod-inferred type for the form so optional/null/undefined
  // shapes line up exactly with the schema used by zodResolver.
  type StartupFormType = z.infer<typeof mealPlanStartupDataSchema>;

  const form = useForm<StartupFormType>({
    resolver: zodResolver(mealPlanStartupDataSchema),
    defaultValues: {
      patient_age: null,
      patient_weight: null,
      patient_height: null,
      activity_level: null,
      target_kcal: null,
      target_macro_distribution: null,
      meal_names: null,
      exclusions_guidelines: null,
    },
    mode: "onBlur",
    shouldUnregister: false,
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    // Trim string fields
    // Convert the zod-inferred form data into our canonical MealPlanStartupData
    // by normalizing `undefined` -> `null` where our DTO expects nullable fields.
    const processedData: MealPlanStartupData = {
      patient_age: (data.patient_age ?? null) as number | null,
      patient_weight: (data.patient_weight ?? null) as number | null,
      patient_height: (data.patient_height ?? null) as number | null,
      activity_level: (data.activity_level ?? null) as MealPlanStartupData["activity_level"],
      target_kcal: (data.target_kcal ?? null) as number | null,
      target_macro_distribution: (data.target_macro_distribution ?? null) as TargetMacroDistribution | null,
      meal_names: data.meal_names?.trim() || null,
      exclusions_guidelines: data.exclusions_guidelines?.trim() || null,
    };

    onSubmit(processedData);
    form.reset();
  });

  const handleClose = () => {
    if (!form.formState.isSubmitting) {
      form.reset();
      onClose();
    }
  };

  return {
    form,
    handleSubmit,
    handleClose,
  };
}
