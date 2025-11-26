import type { MealPlanListItemDto, MultiDayPlanListItemDto } from "../types";
import { MealPlanInfo } from "./MealPlanInfo";
import { MealPlanActions } from "./MealPlanActions";

interface MealPlanListItemProps {
  mealPlan?: MealPlanListItemDto;
  multiDayPlan?: MultiDayPlanListItemDto;
  onEdit: (id: string) => void;
  onView?: (id: string) => void;
  onExport: (id: string) => void;
  onDelete: (id: string, name: string) => void;
}

/**
 * Individual meal plan row in the list.
 * Displays plan name, timestamps, and action buttons.
 * Supports both single-day and multi-day plans.
 */
export function MealPlanListItem({
  mealPlan,
  multiDayPlan,
  onEdit,
  onView,
  onExport,
  onDelete,
}: MealPlanListItemProps) {
  const plan = multiDayPlan || mealPlan;
  if (!plan) return null;

  const handleDelete = () => {
    if (plan.id && plan.name) {
      onDelete(plan.id, plan.name);
    }
  };

  return (
    <li
      className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
      data-testid={`meal-plan-list-item-${plan.id}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <MealPlanInfo
          name={plan.name}
          createdAt={plan.created_at}
          updatedAt={plan.updated_at}
          dailySummary={mealPlan?.daily_summary}
          multiDaySummary={
            multiDayPlan
              ? {
                  number_of_days: multiDayPlan.number_of_days,
                  average_kcal: multiDayPlan.average_kcal,
                  common_exclusions_guidelines: multiDayPlan.common_exclusions_guidelines,
                }
              : undefined
          }
        />
        <MealPlanActions
          mealPlanId={plan.id}
          onView={onView}
          onEdit={onEdit}
          onExport={onExport}
          onDelete={handleDelete}
        />
      </div>
    </li>
  );
}
