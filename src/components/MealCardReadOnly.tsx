import type { MealPlanMeal } from "../types";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface MealCardReadOnlyProps {
  meal: MealPlanMeal;
  mealIndex: number;
}

/**
 * Read-only version of MealCard for displaying meals in chat view.
 * Shows meal information without edit controls.
 */
export function MealCardReadOnly({ meal, mealIndex }: MealCardReadOnlyProps) {
  const { t } = useTranslation();
  return (
    <div className="border rounded-lg p-4 space-y-4">
      <h3 className="text-lg font-semibold">
        {t("editor.meal")} {mealIndex + 1}: {meal.name || `${t("editor.meal")} ${mealIndex + 1}`}
      </h3>

      {meal.ingredients && (
        <div className="space-y-1">
          <div className="text-sm font-medium text-muted-foreground">{t("editor.ingredients")}</div>
          <div className="text-sm whitespace-pre-wrap">{meal.ingredients}</div>
        </div>
      )}

      {meal.preparation && (
        <div className="space-y-1">
          <div className="text-sm font-medium text-muted-foreground">{t("editor.preparation")}</div>
          <div className="text-sm whitespace-pre-wrap">{meal.preparation}</div>
        </div>
      )}

      {/* Read-only meal summary */}
      {(meal.summary.kcal > 0 || meal.summary.p > 0 || meal.summary.f > 0 || meal.summary.c > 0) && (
        <div className="border-t pt-4 mt-4">
          <div className="text-sm font-medium mb-2">{t("editor.mealSummary")}</div>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">{t("summary.kcal")}</div>
              <div className="font-semibold">{meal.summary.kcal}</div>
            </div>
            <div>
              <div className="text-muted-foreground">{t("summary.proteins")}</div>
              <div className="font-semibold">{meal.summary.p}g</div>
            </div>
            <div>
              <div className="text-muted-foreground">{t("summary.fats")}</div>
              <div className="font-semibold">{meal.summary.f}g</div>
            </div>
            <div>
              <div className="text-muted-foreground">{t("summary.carbs")}</div>
              <div className="font-semibold">{meal.summary.c}g</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
