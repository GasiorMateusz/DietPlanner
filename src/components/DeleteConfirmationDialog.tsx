import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";

interface DeleteConfirmationDialogProps {
  open: boolean;
  mealPlanId: string | null;
  mealPlanName?: string;
  onClose: () => void;
  onConfirm: (id: string) => void;
  isDeleting?: boolean;
}

/**
 * Confirmation modal that appears when user clicks Delete on a meal plan.
 * Requires explicit confirmation to prevent accidental deletions.
 */
export function DeleteConfirmationDialog({
  open,
  mealPlanId,
  mealPlanName,
  onClose,
  onConfirm,
  isDeleting = false,
}: DeleteConfirmationDialogProps) {
  const handleConfirm = () => {
    if (mealPlanId && !isDeleting) {
      onConfirm(mealPlanId);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(openState) => !openState && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Meal Plan</DialogTitle>
          <DialogDescription>
            {mealPlanName ? (
              <>
                Are you sure you want to delete <strong>&quot;{mealPlanName}&quot;</strong>? This action cannot be
                undone.
              </>
            ) : (
              "Are you sure you want to delete this meal plan? This action cannot be undone."
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={handleConfirm} disabled={!mealPlanId || isDeleting}>
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
