import { useState } from "react";
import { Controller } from "react-hook-form";
import { Alert, AlertDescription } from "./ui/alert";
import { Skeleton } from "./ui/skeleton";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { DailySummaryStaticDisplay } from "./DailySummaryStaticDisplay";
import { MealCard } from "./MealCard";
import { ExportOptionsModal } from "./ExportOptionsModal";
import { useMealPlanEditor } from "./hooks/useMealPlanEditor";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { TranslationKey } from "@/lib/i18n/types";

interface MealPlanEditorProps {
  /** Optional meal plan ID for Edit Mode */
  mealPlanId?: string;
}

/**
 * Main React component for the Meal Plan Editor.
 * Supports both Create Mode (from AI chat) and Edit Mode (existing meal plan).
 */
export default function MealPlanEditor({ mealPlanId }: MealPlanEditorProps) {
  const { t } = useTranslation();
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const { form, fields, append, remove, isLoading, error, dailySummary, mode, handleSave } = useMealPlanEditor({
    mealPlanId,
  });

  /**
   * Handles cancel button click - navigates back to dashboard.
   */
  const handleCancel = () => {
    window.location.href = "/app/dashboard";
  };

  /**
   * Handles adding a new meal card.
   */
  const handleMealAdd = () => {
    append({
      name: "",
      ingredients: "",
      preparation: "",
      summary: {
        kcal: 0,
        p: 0,
        f: 0,
        c: 0,
      },
    });
  };

  /**
   * Handles removing a meal card by index.
   */
  const handleMealRemove = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  // Show loading state
  if (isLoading && fields.length === 0) {
    return (
      <div className="container mx-auto p-4 sm:p-8 max-w-4xl">
        <Skeleton className="h-12 w-64 mb-6" />
        <Skeleton className="h-32 w-full mb-6" />
        <Skeleton className="h-64 w-full mb-6" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Show error state
  if (error && fields.length === 0) {
    return (
      <div className="container mx-auto p-4 sm:p-8 max-w-4xl">
        <Alert className="border-destructive bg-destructive/10 text-destructive">
          <AlertDescription>
            {error.key.startsWith("editor.validation.") || error.key.startsWith("common.")
              ? error.params
                ? t(error.key as TranslationKey).replace(/\{(\w+)\}/g, (_, key) => error.params?.[key] || "")
                : t(error.key as TranslationKey)
              : error.key}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Main form UI
  return (
    <div className="container mx-auto p-4 sm:p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">
        {mode === "create" ? t("editor.title.create") : t("editor.title.edit")}
      </h1>

      {/* Error Alert */}
      {error && (
        <Alert className="mb-6 border-destructive bg-destructive/10 text-destructive">
          <AlertDescription>
            {error.key.startsWith("editor.validation.") || error.key.startsWith("common.")
              ? error.params
                ? t(error.key as TranslationKey).replace(/\{(\w+)\}/g, (_, key) => error.params?.[key] || "")
                : t(error.key as TranslationKey)
              : error.key}
          </AlertDescription>
        </Alert>
      )}

      {/* Form Content */}
      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
      >
        {/* Plan Name Input */}
        <div className="space-y-2">
          <Label htmlFor="plan-name">
            {t("editor.planName")} <span className="text-destructive">*</span>
          </Label>
          <Controller
            name="planName"
            control={form.control}
            render={({ field, fieldState }) => {
              const errorId = "plan-name-error";
              const errorMessage = fieldState.error?.message;
              let displayMessage: string | null = null;

              if (errorMessage) {
                // Check if it's a translation key
                if (errorMessage.startsWith("editor.validation.") || errorMessage.startsWith("common.")) {
                  displayMessage = t(errorMessage as TranslationKey);
                } else if (errorMessage === "Plan name is required") {
                  // Check if it's a known English error message and translate it
                  displayMessage = t("editor.validation.planNameRequired");
                } else {
                  // Return the error message as-is
                  displayMessage = errorMessage;
                }
              }

              return (
                <>
                  <Input
                    id="plan-name"
                    {...field}
                    placeholder={t("editor.planNamePlaceholder")}
                    aria-invalid={fieldState.invalid}
                    aria-describedby={fieldState.error ? errorId : undefined}
                    data-testid="meal-plan-editor-plan-name-input"
                  />
                  {displayMessage && (
                    <p id={errorId} className="text-sm text-destructive mt-1" role="alert">
                      {displayMessage}
                    </p>
                  )}
                </>
              );
            }}
          />
        </div>

        {/* Daily Summary Display */}
        <DailySummaryStaticDisplay summary={dailySummary} />

        {/* Meals List */}
        <div className="space-y-4" data-testid="meal-plan-editor-meals-section">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">{t("editor.meals")}</h2>
            <Button type="button" variant="outline" onClick={handleMealAdd}>
              {t("editor.addMeal")}
            </Button>
          </div>

          {fields.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">{t("editor.noMeals")}</div>
          ) : (
            <div className="space-y-4">
              {fields.map((field, index) => (
                <MealCard
                  key={field.id}
                  mealIndex={index}
                  control={form.control}
                  isRemoveable={fields.length > 1}
                  onRemove={handleMealRemove}
                />
              ))}
            </div>
          )}
        </div>

        {/* Macro Warning Alert */}
        <Alert className="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
          <AlertDescription>{t("editor.macroWarning")}</AlertDescription>
        </Alert>

        {/* Form Actions */}
        <div className="flex gap-4 pt-4 border-t">
          <Button type="submit" variant="default" disabled={isLoading} data-testid="meal-plan-editor-save-button">
            {isLoading ? t("editor.saving") : t("editor.saveChanges")}
          </Button>

          {mode === "edit" && mealPlanId && (
            <Button type="button" variant="outline" onClick={() => setIsExportModalOpen(true)}>
              {t("editor.export")}
            </Button>
          )}

          <Button type="button" variant="ghost" onClick={handleCancel}>
            {t("common.cancel")}
          </Button>
        </div>
      </form>

      {/* Export Options Modal */}
      {mode === "edit" && mealPlanId && (
        <ExportOptionsModal
          isOpen={isExportModalOpen}
          mealPlanId={mealPlanId}
          onClose={() => setIsExportModalOpen(false)}
        />
      )}
    </div>
  );
}
