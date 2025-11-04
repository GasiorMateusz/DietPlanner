import type { MealPlanListItemDto } from "../types";
import { Alert, AlertDescription } from "./ui/alert";
import { Skeleton } from "./ui/skeleton";
import { EmptyState } from "./EmptyState";
import { MealPlanListItem } from "./MealPlanListItem";

interface MealPlanListProps {
  mealPlans: MealPlanListItemDto[];
  isLoading: boolean;
  error: string | null;
  onEdit: (id: string) => void;
  onExport: (id: string) => void;
  onDelete: (id: string, name: string) => void;
  onCreateClick?: () => void;
}

/**
 * Displays the list of meal plans.
 * Shows either an empty state message or a list of meal plan items.
 * Handles loading and error states.
 */
export function MealPlanList({
  mealPlans,
  isLoading,
  error,
  onEdit,
  onExport,
  onDelete,
  onCreateClick,
}: MealPlanListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="border rounded-lg p-4">
            <Skeleton className="h-6 w-1/3 mb-2" />
            <Skeleton className="h-4 w-1/2 mb-4" />
            <Skeleton className="h-4 w-1/4" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="border-destructive/50 text-destructive [&>svg]:text-destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (mealPlans.length === 0) {
    return <EmptyState onCreateClick={onCreateClick} />;
  }

  return (
    <ul className="space-y-4" role="list">
      {mealPlans.map((mealPlan) => (
        <MealPlanListItem
          key={mealPlan.id}
          mealPlan={mealPlan}
          onEdit={onEdit}
          onExport={onExport}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}
