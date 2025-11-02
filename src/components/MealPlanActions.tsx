import { Button } from "@/components/ui/button";

interface MealPlanActionsProps {
  mealPlanId: string;
  onEdit: (id: string) => void;
  onExport: (id: string) => void;
  onDelete: (id: string) => void;
}

/**
 * Container for action buttons (Edit/View, Export, Delete) for a meal plan item.
 */
export function MealPlanActions({ mealPlanId, onEdit, onExport, onDelete }: MealPlanActionsProps) {
  const handleEdit = () => {
    if (mealPlanId) {
      onEdit(mealPlanId);
    }
  };

  const handleExport = () => {
    if (mealPlanId) {
      onExport(mealPlanId);
    }
  };

  const handleDelete = () => {
    if (mealPlanId) {
      onDelete(mealPlanId);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleEdit}
        aria-label={`Edit meal plan ${mealPlanId}`}
        data-testid="meal-plan-edit-button"
      >
        Edit / View
      </Button>
      <Button variant="outline" size="sm" onClick={handleExport} aria-label={`Export meal plan ${mealPlanId}`}>
        Export
      </Button>
      <Button variant="destructive" size="sm" onClick={handleDelete} aria-label={`Delete meal plan ${mealPlanId}`}>
        Delete
      </Button>
    </div>
  );
}
