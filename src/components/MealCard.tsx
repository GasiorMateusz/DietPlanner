import { Controller, type Control } from "react-hook-form";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import type { MealPlanFormData } from "../lib/validation/meal-plan-form.schema";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { TranslationKey } from "@/lib/i18n/types";

/**
 * Helper function to safely extract error message from nested summary errors.
 * React Hook Form's error types don't perfectly handle deeply nested structures,
 * so we need to safely access the error messages.
 */
function getSummaryErrorMessage(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  summaryErrors: any,
  fieldStateError?: { message?: string }
): string | null {
  if (fieldStateError?.message) {
    return fieldStateError.message;
  }

  if (!summaryErrors || typeof summaryErrors !== "object") {
    return null;
  }

  // Safely check for nested field errors (kcal, p, f, c)
  const errorFields = ["kcal", "p", "f", "c"] as const;
  for (const field of errorFields) {
    const fieldError = summaryErrors[field];
    if (
      fieldError &&
      typeof fieldError === "object" &&
      "message" in fieldError &&
      typeof fieldError.message === "string"
    ) {
      return fieldError.message;
    }
  }

  return null;
}

interface MealCardProps {
  mealIndex: number;
  control: Control<MealPlanFormData>;
  isRemoveable: boolean;
  onRemove: (index: number) => void;
}

/**
 * Repeatable component representing a single meal within the meal plan.
 * Contains editable fields for name, ingredients, and preparation,
 * plus a read-only summary display.
 */
export function MealCard({ mealIndex, control, isRemoveable, onRemove }: MealCardProps) {
  const { t } = useTranslation();
  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {t("editor.meal")} {mealIndex + 1}
        </h3>
        {isRemoveable && (
          <Button type="button" variant="destructive" size="sm" onClick={() => onRemove(mealIndex)}>
            {t("editor.remove")}
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor={`meal-name-${mealIndex}`}>
          {t("editor.mealName")} <span className="text-destructive">*</span>
        </Label>
        <Controller
          name={`meals.${mealIndex}.name`}
          control={control}
          render={({ field, fieldState }) => {
            const errorId = `meal-name-${mealIndex}-error`;
            const errorMessage = fieldState.error?.message;
            let displayMessage: string | null = null;

            if (errorMessage) {
              // Check if it's a translation key
              if (errorMessage.startsWith("editor.validation.") || errorMessage.startsWith("common.")) {
                displayMessage = t(errorMessage as TranslationKey);
              } else if (errorMessage === "Meal name is required") {
                // Check if it's a known English error message and translate it
                displayMessage = t("editor.validation.mealNameRequired").replace(/\{index\}/g, String(mealIndex + 1));
              } else {
                // Return the error message as-is
                displayMessage = errorMessage;
              }
            }

            return (
              <>
                <Input
                  id={`meal-name-${mealIndex}`}
                  {...field}
                  placeholder={t("editor.mealNamePlaceholder")}
                  aria-invalid={fieldState.invalid}
                  aria-describedby={fieldState.error ? errorId : undefined}
                  data-testid={`meal-card-name-input-${mealIndex}`}
                />
                {displayMessage && (
                  <p id={errorId} className="text-sm text-destructive mt-1" role="alert">
                    {displayMessage}
                  </p>
                )}
              </>
            );
          }}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`meal-ingredients-${mealIndex}`}>{t("editor.ingredients")}</Label>
        <Controller
          name={`meals.${mealIndex}.ingredients`}
          control={control}
          render={({ field }) => (
            <Textarea
              id={`meal-ingredients-${mealIndex}`}
              {...field}
              placeholder={t("editor.ingredientsPlaceholder")}
              rows={4}
            />
          )}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`meal-preparation-${mealIndex}`}>{t("editor.preparation")}</Label>
        <Controller
          name={`meals.${mealIndex}.preparation`}
          control={control}
          render={({ field }) => (
            <Textarea
              id={`meal-preparation-${mealIndex}`}
              {...field}
              placeholder={t("editor.preparationPlaceholder")}
              rows={4}
            />
          )}
        />
      </div>

      {/* Read-only meal summary */}
      <div className="border-t pt-4 mt-4" data-meal-index={mealIndex}>
        <div className="text-sm font-medium mb-2">{t("editor.mealSummary")}</div>
        <Controller
          name={`meals.${mealIndex}.summary`}
          control={control}
          render={({ field, fieldState, formState }) => {
            // Check for nested errors on summary fields (kcal, p, f, c)
            const summaryErrors = formState.errors.meals?.[mealIndex]?.summary;
            const hasSummaryError = fieldState.error || summaryErrors;

            return (
              <>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">{t("summary.kcal")}</div>
                    <div className="font-semibold">{field.value.kcal}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">{t("summary.proteins")}</div>
                    <div className="font-semibold">{field.value.p}g</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">{t("summary.fats")}</div>
                    <div className="font-semibold">{field.value.f}g</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">{t("summary.carbs")}</div>
                    <div className="font-semibold">{field.value.c}g</div>
                  </div>
                </div>
                {/* Show summary field errors if any */}
                {hasSummaryError &&
                  (() => {
                    const errorMessage = getSummaryErrorMessage(summaryErrors, fieldState.error);
                    if (!errorMessage) return null;

                    return (
                      <p className="text-sm text-destructive mt-2">
                        {errorMessage.startsWith("editor.validation.") || errorMessage.startsWith("common.")
                          ? t(errorMessage as TranslationKey)
                          : errorMessage}
                      </p>
                    );
                  })()}
              </>
            );
          }}
        />
      </div>
    </div>
  );
}
