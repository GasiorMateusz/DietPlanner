import { Button } from "@/components/ui/button";

import { useTranslation } from "@/lib/i18n/useTranslation";

interface MealPlanActionsProps {
  mealPlanId: string;
  onEdit: (id: string) => void;
  onExport: (id: string) => void;
  onDelete: (id: string) => void;
  onView?: (id: string) => void;
}

/**
 * Container for action buttons (View, Edit, Export, Delete) for a meal plan item.
 */
export function MealPlanActions({ mealPlanId, onEdit, onExport, onDelete, onView }: MealPlanActionsProps) {
  const { t } = useTranslation();

  const handleView = () => {
    if (mealPlanId && onView) {
      onView(mealPlanId);
    } else if (mealPlanId) {
      // Fallback to edit if onView not provided
      onEdit(mealPlanId);
    }
  };

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
      {onView && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleView}
          aria-label={`View meal plan ${mealPlanId}`}
          data-testid="meal-plan-view-button"
        >
          {t("common.view") || "View"}
        </Button>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={handleEdit}
        aria-label={`Edit meal plan ${mealPlanId}`}
        data-testid="meal-plan-edit-button"
      >
        {t("common.edit") || "Edit"}
      </Button>
      <Button variant="outline" size="sm" onClick={handleExport} aria-label={`Export meal plan ${mealPlanId}`}>
        {t("common.export") || "Export"}
      </Button>
      <Button variant="destructive" size="sm" onClick={handleDelete} aria-label={`Delete meal plan ${mealPlanId}`}>
        {t("common.delete") || "Delete"}
      </Button>
    </div>
  );
}
