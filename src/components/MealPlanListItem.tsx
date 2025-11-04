import type { MealPlanListItemDto } from "../types";
import { MealPlanInfo } from "./MealPlanInfo";
import { MealPlanActions } from "./MealPlanActions";

interface MealPlanListItemProps {
  mealPlan: MealPlanListItemDto;
  onEdit: (id: string) => void;
  onExport: (id: string) => void;
  onDelete: (id: string, name: string) => void;
}

/**
 * Individual meal plan row in the list.
 * Displays plan name, timestamps, and action buttons.
 */
export function MealPlanListItem({ mealPlan, onEdit, onExport, onDelete }: MealPlanListItemProps) {
  const handleDelete = () => {
    if (mealPlan.id && mealPlan.name) {
      onDelete(mealPlan.id, mealPlan.name);
    }
  };

  return (
    <li
      className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
      data-testid={`meal-plan-list-item-${mealPlan.id}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <MealPlanInfo
          name={mealPlan.name}
          createdAt={mealPlan.created_at}
          updatedAt={mealPlan.updated_at}
          dailySummary={mealPlan.daily_summary}
        />
        <MealPlanActions mealPlanId={mealPlan.id} onEdit={onEdit} onExport={onExport} onDelete={handleDelete} />
      </div>
    </li>
  );
}
