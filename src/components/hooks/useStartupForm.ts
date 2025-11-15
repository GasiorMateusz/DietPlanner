import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { multiDayStartupFormDataSchema } from "@/lib/validation/meal-plans.schemas";
import type { MultiDayStartupFormData, TargetMacroDistribution } from "@/types";

interface UseStartupFormProps {
  onSubmit: (data: MultiDayStartupFormData) => void;
  onClose: () => void;
}

export function useStartupForm({ onSubmit, onClose }: UseStartupFormProps) {
  type StartupFormType = z.infer<typeof multiDayStartupFormDataSchema>;

  const form = useForm<StartupFormType>({
    resolver: zodResolver(multiDayStartupFormDataSchema),
    defaultValues: {
      patient_age: null,
      patient_weight: null,
      patient_height: null,
      activity_level: null,
      target_kcal: null,
      target_macro_distribution: {
        p_perc: 0,
        f_perc: 0,
        c_perc: 0,
      },
      meal_names: null,
      exclusions_guidelines: null,
      number_of_days: 1,
      ensure_meal_variety: true,
      different_guidelines_per_day: false,
      per_day_guidelines: null,
    },
    mode: "onBlur",
    shouldUnregister: false,
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    // If all macro percentages are 0, treat as null (not specified)
    const macroDist =
      data.target_macro_distribution &&
      data.target_macro_distribution.p_perc === 0 &&
      data.target_macro_distribution.f_perc === 0 &&
      data.target_macro_distribution.c_perc === 0
        ? null
        : (data.target_macro_distribution ?? null);

    const processedData: MultiDayStartupFormData = {
      patient_age: (data.patient_age ?? null) as number | null,
      patient_weight: (data.patient_weight ?? null) as number | null,
      patient_height: (data.patient_height ?? null) as number | null,
      activity_level: (data.activity_level ?? null) as MultiDayStartupFormData["activity_level"],
      target_kcal: (data.target_kcal ?? null) as number | null,
      target_macro_distribution: macroDist as TargetMacroDistribution | null,
      meal_names: data.meal_names?.trim() || null,
      exclusions_guidelines: data.exclusions_guidelines?.trim() || null,
      number_of_days: data.number_of_days,
      ensure_meal_variety: data.ensure_meal_variety ?? true,
      different_guidelines_per_day: data.different_guidelines_per_day ?? false,
      per_day_guidelines: data.per_day_guidelines?.trim() || null,
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
