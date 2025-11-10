import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { useTranslation } from "@/lib/i18n/useTranslation";

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
  const { t } = useTranslation();
  const handleConfirm = () => {
    if (mealPlanId && !isDeleting) {
      onConfirm(mealPlanId);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(openState) => !openState && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("dialog.deleteMealPlan.title")}</DialogTitle>
          <DialogDescription>
            {mealPlanName ? (
              <>{t("dialog.deleteMealPlan.descriptionWithName").replace("{name}", mealPlanName)}</>
            ) : (
              t("dialog.deleteMealPlan.description")
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isDeleting}>
            {t("common.cancel")}
          </Button>
          <Button type="button" variant="destructive" onClick={handleConfirm} disabled={!mealPlanId || isDeleting}>
            {isDeleting ? t("common.deleting") : t("common.delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
