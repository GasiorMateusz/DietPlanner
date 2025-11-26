import { useState, useCallback } from "react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { Select } from "./ui/select";
import { Alert, AlertDescription } from "./ui/alert";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useMultiDayPlanExport } from "./hooks/useMultiDayPlanExport";
import type { ExportContentOptions, ExportFormat } from "@/types";

interface ExportButtonProps {
  planId: string;
}

export function ExportButton({ planId }: ExportButtonProps) {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [contentOptions, setContentOptions] = useState<ExportContentOptions>({
    dailySummary: true,
    mealsSummary: true,
    ingredients: true,
    preparation: true,
  });
  const [format, setFormat] = useState<ExportFormat>("doc");
  const [validationError, setValidationError] = useState<string | null>(null);
  const { exportPlan, isExporting, error: exportError } = useMultiDayPlanExport(planId);

  const validateOptions = useCallback((): boolean => {
    return (
      contentOptions.dailySummary ||
      contentOptions.mealsSummary ||
      contentOptions.ingredients ||
      contentOptions.preparation
    );
  }, [contentOptions]);

  const handleContentOptionToggle = useCallback((option: keyof ExportContentOptions) => {
    setContentOptions((prev) => ({
      ...prev,
      [option]: !prev[option],
    }));
    // Clear validation error when user makes a change
    setValidationError(null);
  }, []);

  const handleFormatChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormat(e.target.value as ExportFormat);
  }, []);

  const handleExport = useCallback(async () => {
    // Validate options
    if (!validateOptions()) {
      setValidationError(t("export.modal.validationError"));
      return;
    }

    setValidationError(null);

    try {
      await exportPlan({
        content: contentOptions,
        format,
      });
      setIsModalOpen(false);
    } catch {
      // Error handled by hook
    }
  }, [contentOptions, format, exportPlan, validateOptions, t]);

  const handleOpenChange = useCallback((open: boolean) => {
    if (open) {
      setContentOptions({
        dailySummary: true,
        mealsSummary: true,
        ingredients: true,
        preparation: true,
      });
      setFormat("doc");
      setValidationError(null);
    }
    setIsModalOpen(open);
  }, []);

  return (
    <>
      <Button onClick={() => setIsModalOpen(true)} variant="outline" data-testid="export-button">
        {t("view.export")}
      </Button>
      <Dialog open={isModalOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t("export.modal.title")}</DialogTitle>
            <DialogDescription>{t("export.modal.description")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
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

            <div className="space-y-3">
              <Label htmlFor="format-select" className="text-base font-semibold">
                {t("export.modal.formatOptions")}
              </Label>
              <Select id="format-select" value={format} onChange={handleFormatChange} disabled={isExporting}>
                <option value="doc">{t("export.modal.formatDoc")}</option>
                <option value="html">{t("export.modal.formatHtml")}</option>
              </Select>
            </div>

            {validationError && (
              <Alert className="border-destructive bg-destructive/10 text-destructive">
                <AlertDescription>{validationError}</AlertDescription>
              </Alert>
            )}

            {exportError && (
              <Alert className="border-destructive bg-destructive/10 text-destructive">
                <AlertDescription>{exportError.message}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={isExporting}>
              {t("export.modal.cancelButton")}
            </Button>
            <Button type="button" onClick={handleExport} disabled={!validateOptions() || isExporting}>
              {isExporting ? t("export.modal.exporting") : t("export.modal.exportButton")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
