import { Controller, type Control } from "react-hook-form";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import type { MealPlanFormData } from "../lib/validation/meal-plan-form.schema";
import { useTranslation } from "@/lib/i18n/useTranslation";

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
          render={({ field, fieldState }) => (
            <Input
              id={`meal-name-${mealIndex}`}
              {...field}
              placeholder={t("editor.mealNamePlaceholder")}
              aria-invalid={fieldState.invalid}
              data-testid={`meal-card-name-input-${mealIndex}`}
            />
          )}
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
      <div className="border-t pt-4 mt-4">
        <div className="text-sm font-medium mb-2">{t("editor.mealSummary")}</div>
        <Controller
          name={`meals.${mealIndex}.summary`}
          control={control}
          render={({ field }) => (
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
          )}
        />
      </div>
    </div>
  );
}
