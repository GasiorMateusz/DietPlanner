import { Controller, type Control } from "react-hook-form";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import type { MealPlanFormData } from "../lib/validation/meal-plan-form.schema";

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
export function MealCard({
  mealIndex,
  control,
  isRemoveable,
  onRemove,
}: MealCardProps) {
  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Meal {mealIndex + 1}</h3>
        {isRemoveable && (
          <Button type="button" variant="destructive" size="sm" onClick={() => onRemove(mealIndex)}>
            Remove
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor={`meal-name-${mealIndex}`}>
          Meal Name <span className="text-destructive">*</span>
        </Label>
        <Controller
          name={`meals.${mealIndex}.name`}
          control={control}
          render={({ field, fieldState }) => (
            <>
              <Input
                id={`meal-name-${mealIndex}`}
                {...field}
                placeholder="e.g., Breakfast, Lunch, Dinner"
                aria-invalid={fieldState.invalid}
                data-testid={`meal-card-name-input-${mealIndex}`}
              />
              {fieldState.error && (
                <p className="text-sm text-destructive">{fieldState.error.message}</p>
              )}
            </>
          )}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`meal-ingredients-${mealIndex}`}>Ingredients</Label>
        <Controller
          name={`meals.${mealIndex}.ingredients`}
          control={control}
          render={({ field }) => (
            <Textarea
              id={`meal-ingredients-${mealIndex}`}
              {...field}
              placeholder="List all ingredients with quantities..."
              rows={4}
            />
          )}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`meal-preparation-${mealIndex}`}>Preparation</Label>
        <Controller
          name={`meals.${mealIndex}.preparation`}
          control={control}
          render={({ field }) => (
            <Textarea
              id={`meal-preparation-${mealIndex}`}
              {...field}
              placeholder="Step-by-step preparation instructions..."
              rows={4}
            />
          )}
        />
      </div>

      {/* Read-only meal summary */}
      <div className="border-t pt-4 mt-4">
        <div className="text-sm font-medium mb-2">Meal Summary</div>
        <Controller
          name={`meals.${mealIndex}.summary`}
          control={control}
          render={({ field }) => (
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Kcal</div>
                <div className="font-semibold">{field.value.kcal}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Proteins</div>
                <div className="font-semibold">{field.value.p}g</div>
              </div>
              <div>
                <div className="text-muted-foreground">Fats</div>
                <div className="font-semibold">{field.value.f}g</div>
              </div>
              <div>
                <div className="text-muted-foreground">Carbs</div>
                <div className="font-semibold">{field.value.c}g</div>
              </div>
            </div>
          )}
        />
      </div>
    </div>
  );
}
