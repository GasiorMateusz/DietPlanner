import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DeleteAccountConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting?: boolean;
  error?: string | null;
}

/**
 * Confirmation dialog component that warns users about the permanent nature of account deletion.
 * It displays a clear warning message explaining that all meal plans will be deleted,
 * but conversation history will be preserved. The dialog requires explicit confirmation
 * before proceeding with account deletion.
 */
export function DeleteAccountConfirmationDialog({
  open,
  onClose,
  onConfirm,
  isDeleting = false,
  error = null,
}: DeleteAccountConfirmationDialogProps) {
  const handleConfirm = () => {
    if (!isDeleting) {
      onConfirm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(openState) => !openState && !isDeleting && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Account</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete your account? This action is permanent and cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <Alert className="border-destructive bg-destructive/10 text-destructive" role="alert">
          <AlertDescription>
            <strong>Warning:</strong> Deleting your account will permanently remove:
            <ul className="mt-2 ml-4 list-disc space-y-1">
              <li>Your account and profile information</li>
              <li>All your meal plans</li>
            </ul>
            <p className="mt-2">Your conversation history will be preserved for analytical purposes.</p>
          </AlertDescription>
        </Alert>

        {error && (
          <Alert className="border-destructive bg-destructive/10 text-destructive" role="alert">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting}
            aria-label="Confirm account deletion"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
