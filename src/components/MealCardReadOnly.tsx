import type { MealPlanMeal } from "../types";

interface MealCardReadOnlyProps {
  meal: MealPlanMeal;
  mealIndex: number;
}

/**
 * Read-only version of MealCard for displaying meals in chat view.
 * Shows meal information without edit controls.
 */
export function MealCardReadOnly({ meal, mealIndex }: MealCardReadOnlyProps) {
  return (
    <div className="border rounded-lg p-4 space-y-4">
      <h3 className="text-lg font-semibold">
        Meal {mealIndex + 1}: {meal.name || `Meal ${mealIndex + 1}`}
      </h3>

      {meal.ingredients && (
        <div className="space-y-1">
          <div className="text-sm font-medium text-muted-foreground">Ingredients</div>
          <div className="text-sm whitespace-pre-wrap">{meal.ingredients}</div>
        </div>
      )}

      {meal.preparation && (
        <div className="space-y-1">
          <div className="text-sm font-medium text-muted-foreground">Preparation</div>
          <div className="text-sm whitespace-pre-wrap">{meal.preparation}</div>
        </div>
      )}

      {/* Read-only meal summary */}
      {(meal.summary.kcal > 0 || meal.summary.p > 0 || meal.summary.f > 0 || meal.summary.c > 0) && (
        <div className="border-t pt-4 mt-4">
          <div className="text-sm font-medium mb-2">Meal Summary</div>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Kcal</div>
              <div className="font-semibold">{meal.summary.kcal}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Proteins</div>
              <div className="font-semibold">{meal.summary.p}g</div>
            </div>
            <div>
              <div className="text-muted-foreground">Fats</div>
              <div className="font-semibold">{meal.summary.f}g</div>
            </div>
            <div>
              <div className="text-muted-foreground">Carbs</div>
              <div className="font-semibold">{meal.summary.c}g</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

