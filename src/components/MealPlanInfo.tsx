import type { MealPlanContentDailySummary } from "../types";
import { formatRelativeTime } from "../lib/utils/date";

interface MealPlanInfoProps {
  name: string;
  createdAt: string;
  updatedAt: string;
  dailySummary?: MealPlanContentDailySummary;
}

/**
 * Displays meal plan name and metadata (creation/update dates) in a readable format.
 * Optionally displays daily summary values (kcal, macros) as preview.
 */
export function MealPlanInfo({ name, createdAt, updatedAt, dailySummary }: MealPlanInfoProps) {
  return (
    <div className="flex-1 min-w-0">
      <h3 className="text-lg font-semibold text-foreground mb-1 truncate">{name}</h3>
      <div className="text-sm text-muted-foreground space-y-1">
        <div>Updated {formatRelativeTime(updatedAt)}</div>
        {createdAt !== updatedAt && <div>Created {formatRelativeTime(createdAt)}</div>}
      </div>
      {dailySummary && (
        <div className="mt-3 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Kcal:</span>
            <span className="font-medium">{dailySummary.kcal}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">P:</span>
            <span className="font-medium">{dailySummary.proteins}g</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">F:</span>
            <span className="font-medium">{dailySummary.fats}g</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">C:</span>
            <span className="font-medium">{dailySummary.carbs}g</span>
          </div>
        </div>
      )}
    </div>
  );
}
