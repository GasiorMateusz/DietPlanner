import React from "react";
import MealPlanEditor from "./MealPlanEditor";
import { TranslationProvider } from "@/lib/i18n/TranslationProvider";

interface MealPlanEditorWrapperProps {
  mealPlanId?: string;
}

/**
 * Wrapper component that provides translation context to MealPlanEditor.
 * This ensures MealPlanEditor can access translations even though it's in a separate React island.
 */
export function MealPlanEditorWrapper({ mealPlanId }: MealPlanEditorWrapperProps) {
  return (
    <TranslationProvider>
      <MealPlanEditor mealPlanId={mealPlanId} />
    </TranslationProvider>
  );
}
