import { useState, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { Select } from "./ui/select";
import { Alert, AlertDescription } from "./ui/alert";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { mealPlansApi } from "@/lib/api/meal-plans.client";
import type { ExportContentOptions, ExportFormat, ExportOptions } from "@/types";

interface ExportOptionsModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Meal plan ID to export */
  mealPlanId: string;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Optional callback when export completes successfully */
  onExportComplete?: () => void;
  /** Optional callback when export fails */
  onExportError?: (error: string) => void;
}

/**
 * Modal component for selecting export options before generating an export file.
 * Allows users to choose content sections and format (DOC or HTML).
 */
export function ExportOptionsModal({
  isOpen,
  mealPlanId,
  onClose,
  onExportComplete,
  onExportError,
}: ExportOptionsModalProps) {
  const { t } = useTranslation();

  // Default state: all content options checked, format: DOC
  const [contentOptions, setContentOptions] = useState<ExportContentOptions>({
    dailySummary: true,
    mealsSummary: true,
    ingredients: true,
    preparation: true,
  });
  const [format, setFormat] = useState<ExportFormat>("doc");
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setContentOptions({
        dailySummary: true,
        mealsSummary: true,
        ingredients: true,
        preparation: true,
      });
      setFormat("doc");
      setError(null);
      setIsExporting(false);
    }
  }, [isOpen]);

  /**
   * Validates that at least one content option is selected.
   */
  const validateOptions = useCallback((): boolean => {
    return (
      contentOptions.dailySummary ||
      contentOptions.mealsSummary ||
      contentOptions.ingredients ||
      contentOptions.preparation
    );
  }, [contentOptions]);

  /**
   * Handles checkbox toggle for content options.
   */
  const handleContentOptionToggle = useCallback((option: keyof ExportContentOptions) => {
    setContentOptions((prev) => ({
      ...prev,
      [option]: !prev[option],
    }));
    // Clear error when user makes a change
    setError(null);
  }, []);

  /**
   * Handles format selection change.
   */
  const handleFormatChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormat(e.target.value as ExportFormat);
  }, []);

  /**
   * Handles export button click.
   */
  const handleExport = useCallback(async () => {
    // Validate options
    if (!validateOptions()) {
      setError(t("export.modal.validationError"));
      return;
    }

    setIsExporting(true);
    setError(null);

    try {
      const options: ExportOptions = {
        content: contentOptions,
        format,
      };

      // Call API to export - returns both blob and filename from Content-Disposition header
      const { blob, filename } = await mealPlansApi.export(mealPlanId, options);

      // Create blob URL and trigger download using filename from API
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Success: close modal and call completion callback
      setIsExporting(false);
      onExportComplete?.();
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t("export.modal.error");
      setError(errorMessage);
      setIsExporting(false);
      onExportError?.(errorMessage);
    }
  }, [mealPlanId, contentOptions, format, validateOptions, t, onClose, onExportComplete, onExportError]);

  /**
   * Checks if export button should be disabled.
   */
  const isExportDisabled = !validateOptions() || isExporting;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("export.modal.title")}</DialogTitle>
          <DialogDescription>{t("export.modal.description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Content Options Section */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">{t("export.modal.contentOptions")}</Label>
            <div className="space-y-3 pl-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="daily-summary"
                  checked={contentOptions.dailySummary}
                  onCheckedChange={() => handleContentOptionToggle("dailySummary")}
                  disabled={isExporting}
                />
                <Label htmlFor="daily-summary" className="font-normal cursor-pointer">
                  {t("export.modal.dailySummary")}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="meals-summary"
                  checked={contentOptions.mealsSummary}
                  onCheckedChange={() => handleContentOptionToggle("mealsSummary")}
                  disabled={isExporting}
                />
                <Label htmlFor="meals-summary" className="font-normal cursor-pointer">
                  {t("export.modal.mealsSummary")}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="ingredients"
                  checked={contentOptions.ingredients}
                  onCheckedChange={() => handleContentOptionToggle("ingredients")}
                  disabled={isExporting}
                />
                <Label htmlFor="ingredients" className="font-normal cursor-pointer">
                  {t("export.modal.ingredients")}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="preparation"
                  checked={contentOptions.preparation}
                  onCheckedChange={() => handleContentOptionToggle("preparation")}
                  disabled={isExporting}
                />
                <Label htmlFor="preparation" className="font-normal cursor-pointer">
                  {t("export.modal.preparation")}
                </Label>
              </div>
            </div>
          </div>

          {/* Format Options Section */}
          <div className="space-y-3">
            <Label htmlFor="format-select" className="text-base font-semibold">
              {t("export.modal.formatOptions")}
            </Label>
            <Select id="format-select" value={format} onChange={handleFormatChange} disabled={isExporting}>
              <option value="doc">{t("export.modal.formatDoc")}</option>
              <option value="html">{t("export.modal.formatHtml")}</option>
            </Select>
          </div>

          {/* Validation Error */}
          {error && (
            <Alert className="border-destructive bg-destructive/10 text-destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isExporting}>
            {t("export.modal.cancelButton")}
          </Button>
          <Button type="button" onClick={handleExport} disabled={isExportDisabled}>
            {isExporting ? t("export.modal.exporting") : t("export.modal.exportButton")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
