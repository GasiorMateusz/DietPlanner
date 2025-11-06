import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { MealPlanStartupData } from "@/types";
import { mealPlanStartupDataSchema } from "@/lib/validation/meal-plans.schemas";

interface UseStartupFormProps {
  onSubmit: (data: MealPlanStartupData) => void;
  onClose: () => void;
}

/**
 * Custom hook for managing startup form state and validation.
 * Handles complex number inputs with null values and macro distribution validation.
 */
export function useStartupForm({ onSubmit, onClose }: UseStartupFormProps) {
  const form = useForm<MealPlanStartupData>({
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
    const processedData: MealPlanStartupData = {
      ...data,
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
