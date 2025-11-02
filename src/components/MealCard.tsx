import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import type { MealPlanMeal } from "../types";

interface MealCardProps {
  meal: MealPlanMeal;
  mealIndex: number;
  isRemoveable: boolean;
  onNameChange: (index: number, value: string) => void;
  onIngredientsChange: (index: number, value: string) => void;
  onPreparationChange: (index: number, value: string) => void;
  onRemove: (index: number) => void;
}

/**
 * Repeatable component representing a single meal within the meal plan.
 * Contains editable fields for name, ingredients, and preparation,
 * plus a read-only summary display.
 */
export function MealCard({
  meal,
  mealIndex,
  isRemoveable,
  onNameChange,
  onIngredientsChange,
  onPreparationChange,
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
        <Input
          id={`meal-name-${mealIndex}`}
          value={meal.name}
          onChange={(e) => onNameChange(mealIndex, e.target.value)}
          placeholder="e.g., Breakfast, Lunch, Dinner"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`meal-ingredients-${mealIndex}`}>Ingredients</Label>
        <Textarea
          id={`meal-ingredients-${mealIndex}`}
          value={meal.ingredients}
          onChange={(e) => onIngredientsChange(mealIndex, e.target.value)}
          placeholder="List all ingredients with quantities..."
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`meal-preparation-${mealIndex}`}>Preparation</Label>
        <Textarea
          id={`meal-preparation-${mealIndex}`}
          value={meal.preparation}
          onChange={(e) => onPreparationChange(mealIndex, e.target.value)}
          placeholder="Step-by-step preparation instructions..."
          rows={4}
        />
      </div>

      {/* Read-only meal summary */}
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
    </div>
  );
}
