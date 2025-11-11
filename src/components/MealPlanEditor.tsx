import { Controller } from "react-hook-form";
import { Alert, AlertDescription } from "./ui/alert";
import { Skeleton } from "./ui/skeleton";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { DailySummaryStaticDisplay } from "./DailySummaryStaticDisplay";
import { MealCard } from "./MealCard";
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
  const { form, fields, append, remove, isLoading, error, dailySummary, mode, handleSave, handleExport } =
    useMealPlanEditor({ mealPlanId });

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
            render={({ field, fieldState }) => (
              <>
                <Input
                  id="plan-name"
                  {...field}
                  placeholder={t("editor.planNamePlaceholder")}
                  aria-invalid={fieldState.invalid}
                  data-testid="meal-plan-editor-plan-name-input"
                />
                {fieldState.error && (
                  <p className="text-sm text-destructive mt-1">
                    {(() => {
                      const errorMessage = fieldState.error.message;
                      if (!errorMessage) return null;

                      // Check if it's a translation key
                      if (
                        errorMessage.startsWith("editor.validation.") ||
                        errorMessage.startsWith("common.")
                      ) {
                        return t(errorMessage as TranslationKey);
                      }

                      // Check if it's a known English error message and translate it
                      if (errorMessage === "Plan name is required") {
                        return t("editor.validation.planNameRequired");
                      }

                      // Return the error message as-is
                      return errorMessage;
                    })()}
                  </p>
                )}
              </>
            )}
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

        {/* Form Actions */}
        <div className="flex gap-4 pt-4 border-t">
          <Button type="submit" variant="default" disabled={isLoading} data-testid="meal-plan-editor-save-button">
            {isLoading ? t("editor.saving") : t("editor.saveChanges")}
          </Button>

          {mode === "edit" && (
            <Button type="button" variant="outline" onClick={handleExport}>
              {t("editor.exportToDoc")}
            </Button>
          )}

          <Button type="button" variant="ghost" onClick={handleCancel}>
            {t("common.cancel")}
          </Button>
        </div>
      </form>
    </div>
  );
}
