import { Controller } from "react-hook-form";
import type { MealPlanStartupData } from "../types";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { useStartupForm } from "./hooks/useStartupForm";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface StartupFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: MealPlanStartupData) => void;
}

/**
 * Modal dialog containing the startup form for creating a new meal plan.
 * Collects patient data, targets, and guidelines before initiating AI generation.
 */
export function StartupFormDialog({ open, onClose, onSubmit }: StartupFormDialogProps) {
  const { t } = useTranslation();
  const { form, handleSubmit, handleClose } = useStartupForm({ onSubmit, onClose });

  return (
    <Dialog open={open} onOpenChange={(openState) => !openState && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="startup-form-dialog">
        <DialogHeader>
          <DialogTitle>{t("startup.title")}</DialogTitle>
          <DialogDescription>
            {t("startup.description")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6" data-testid="startup-form">
          {form.formState.errors.root && (
            <div className="text-sm text-destructive">{form.formState.errors.root.message}</div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="patient_age">
                {t("startup.patientAge")} <span className="text-muted-foreground">({t("startup.patientAgeYears")})</span>
              </Label>
              <Controller
                name="patient_age"
                control={form.control}
                render={({ field, fieldState }) => (
                  <>
                    <Input
                      id="patient_age"
                      type="number"
                      min="1"
                      max="150"
                      placeholder={t("startup.patientAgePlaceholder")}
                      value={field.value ?? ""}
                      onChange={(e) => {
                        const val = e.target.value === "" ? null : parseFloat(e.target.value);
                        if (e.target.value === "" || (val !== null && !isNaN(val) && val >= 0)) {
                          field.onChange(val);
                        }
                      }}
                      onBlur={field.onBlur}
                      aria-invalid={fieldState.invalid}
                      data-testid="startup-form-patient-age"
                    />
                    {fieldState.error && <p className="text-sm text-destructive">{fieldState.error.message}</p>}
                  </>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="patient_weight">
                {t("startup.patientWeight")} <span className="text-muted-foreground">({t("startup.patientWeightKg")})</span>
              </Label>
              <Controller
                name="patient_weight"
                control={form.control}
                render={({ field, fieldState }) => (
                  <>
                    <Input
                      id="patient_weight"
                      type="number"
                      min="0"
                      max="1000"
                      step="0.1"
                      placeholder={t("startup.patientWeightPlaceholder")}
                      value={field.value ?? ""}
                      onChange={(e) => {
                        const val = e.target.value === "" ? null : parseFloat(e.target.value);
                        if (e.target.value === "" || (val !== null && !isNaN(val) && val >= 0)) {
                          field.onChange(val);
                        }
                      }}
                      onBlur={field.onBlur}
                      aria-invalid={fieldState.invalid}
                      data-testid="startup-form-patient-weight"
                    />
                    {fieldState.error && <p className="text-sm text-destructive">{fieldState.error.message}</p>}
                  </>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="patient_height">
                {t("startup.patientHeight")} <span className="text-muted-foreground">({t("startup.patientHeightCm")})</span>
              </Label>
              <Controller
                name="patient_height"
                control={form.control}
                render={({ field, fieldState }) => (
                  <>
                    <Input
                      id="patient_height"
                      type="number"
                      min="0"
                      max="300"
                      step="0.1"
                      placeholder={t("startup.patientHeightPlaceholder")}
                      value={field.value ?? ""}
                      onChange={(e) => {
                        const val = e.target.value === "" ? null : parseFloat(e.target.value);
                        if (e.target.value === "" || (val !== null && !isNaN(val) && val >= 0)) {
                          field.onChange(val);
                        }
                      }}
                      onBlur={field.onBlur}
                      aria-invalid={fieldState.invalid}
                      data-testid="startup-form-patient-height"
                    />
                    {fieldState.error && <p className="text-sm text-destructive">{fieldState.error.message}</p>}
                  </>
                )}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="activity_level">{t("startup.activityLevel")}</Label>
            <Controller
              name="activity_level"
              control={form.control}
              render={({ field, fieldState }) => (
                <>
                  <Select
                    id="activity_level"
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value || null)}
                    onBlur={field.onBlur}
                    aria-invalid={fieldState.invalid}
                    data-testid="startup-form-activity-level"
                  >
                    <option value="">{t("startup.activityLevelSelect")}</option>
                    <option value="sedentary">{t("startup.activityLevelSedentary")}</option>
                    <option value="light">{t("startup.activityLevelLight")}</option>
                    <option value="moderate">{t("startup.activityLevelModerate")}</option>
                    <option value="high">{t("startup.activityLevelHigh")}</option>
                  </Select>
                  {fieldState.error && <p className="text-sm text-destructive">{fieldState.error.message}</p>}
                </>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="target_kcal">
              {t("startup.targetKcal")} <span className="text-muted-foreground">(kcal/day)</span>
            </Label>
            <Controller
              name="target_kcal"
              control={form.control}
              render={({ field, fieldState }) => (
                <>
                  <Input
                    id="target_kcal"
                    type="number"
                    min="1"
                    max="10000"
                    placeholder={t("startup.targetKcalPlaceholder")}
                    value={field.value ?? ""}
                    onChange={(e) => {
                      const val = e.target.value === "" ? null : parseFloat(e.target.value);
                      if (e.target.value === "" || (val !== null && !isNaN(val) && val >= 0)) {
                        field.onChange(val);
                      }
                    }}
                    onBlur={field.onBlur}
                    aria-invalid={fieldState.invalid}
                    data-testid="startup-form-target-kcal"
                  />
                  {fieldState.error && <p className="text-sm text-destructive">{fieldState.error.message}</p>}
                </>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label>{t("startup.targetMacroDistribution")}</Label>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="p_perc" className="text-xs">
                  {t("startup.macroProtein")}
                </Label>
                <Controller
                  name="target_macro_distribution.p_perc"
                  control={form.control}
                  rules={{
                    validate: () => {
                      const macros = form.getValues("target_macro_distribution");
                      if (!macros) return true;
                      const total = (macros.p_perc ?? 0) + (macros.f_perc ?? 0) + (macros.c_perc ?? 0);
                      if (total !== 100 && total > 0) {
                        return "Macro percentages must sum to 100%";
                      }
                      return true;
                    },
                  }}
                  render={({ field, fieldState }) => (
                    <>
                      <Input
                        id="p_perc"
                        type="number"
                        min="0"
                        max="100"
                        placeholder={t("startup.macroPercentPlaceholder")}
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const val = e.target.value === "" ? null : parseFloat(e.target.value);
                          if (e.target.value === "" || (val !== null && !isNaN(val) && val >= 0 && val <= 100)) {
                            const current = form.getValues("target_macro_distribution") || {
                              p_perc: 0,
                              f_perc: 0,
                              c_perc: 0,
                            };
                            const newMacros = {
                              ...current,
                              p_perc: val ?? 0,
                            };
                            field.onChange(val ?? 0);
                            form.setValue("target_macro_distribution", newMacros);
                            // Trigger validation on all macro fields
                            form.trigger([
                              "target_macro_distribution.p_perc",
                              "target_macro_distribution.f_perc",
                              "target_macro_distribution.c_perc",
                            ]);
                          }
                        }}
                        onBlur={field.onBlur}
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.error && <p className="text-xs text-destructive">{fieldState.error.message}</p>}
                    </>
                  )}
                />
              </div>
              <div>
                <Label htmlFor="f_perc" className="text-xs">
                  {t("startup.macroFat")}
                </Label>
                <Controller
                  name="target_macro_distribution.f_perc"
                  control={form.control}
                  rules={{
                    validate: () => {
                      const macros = form.getValues("target_macro_distribution");
                      if (!macros) return true;
                      const total = (macros.p_perc ?? 0) + (macros.f_perc ?? 0) + (macros.c_perc ?? 0);
                      if (total !== 100 && total > 0) {
                        return "Macro percentages must sum to 100%";
                      }
                      return true;
                    },
                  }}
                  render={({ field, fieldState }) => (
                    <>
                      <Input
                        id="f_perc"
                        type="number"
                        min="0"
                        max="100"
                        placeholder={t("startup.macroPercentPlaceholder")}
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const val = e.target.value === "" ? null : parseFloat(e.target.value);
                          if (e.target.value === "" || (val !== null && !isNaN(val) && val >= 0 && val <= 100)) {
                            const current = form.getValues("target_macro_distribution") || {
                              p_perc: 0,
                              f_perc: 0,
                              c_perc: 0,
                            };
                            const newMacros = {
                              ...current,
                              f_perc: val ?? 0,
                            };
                            field.onChange(val ?? 0);
                            form.setValue("target_macro_distribution", newMacros);
                            // Trigger validation on all macro fields
                            form.trigger([
                              "target_macro_distribution.p_perc",
                              "target_macro_distribution.f_perc",
                              "target_macro_distribution.c_perc",
                            ]);
                          }
                        }}
                        onBlur={field.onBlur}
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.error && <p className="text-xs text-destructive">{fieldState.error.message}</p>}
                    </>
                  )}
                />
              </div>
              <div>
                <Label htmlFor="c_perc" className="text-xs">
                  {t("startup.macroCarbs")}
                </Label>
                <Controller
                  name="target_macro_distribution.c_perc"
                  control={form.control}
                  rules={{
                    validate: () => {
                      const macros = form.getValues("target_macro_distribution");
                      if (!macros) return true;
                      const total = (macros.p_perc ?? 0) + (macros.f_perc ?? 0) + (macros.c_perc ?? 0);
                      if (total !== 100 && total > 0) {
                        return "Macro percentages must sum to 100%";
                      }
                      return true;
                    },
                  }}
                  render={({ field, fieldState }) => (
                    <>
                      <Input
                        id="c_perc"
                        type="number"
                        min="0"
                        max="100"
                        placeholder={t("startup.macroPercentPlaceholder")}
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const val = e.target.value === "" ? null : parseFloat(e.target.value);
                          if (e.target.value === "" || (val !== null && !isNaN(val) && val >= 0 && val <= 100)) {
                            const current = form.getValues("target_macro_distribution") || {
                              p_perc: 0,
                              f_perc: 0,
                              c_perc: 0,
                            };
                            const newMacros = {
                              ...current,
                              c_perc: val ?? 0,
                            };
                            field.onChange(val ?? 0);
                            form.setValue("target_macro_distribution", newMacros);
                            // Trigger validation on all macro fields
                            form.trigger([
                              "target_macro_distribution.p_perc",
                              "target_macro_distribution.f_perc",
                              "target_macro_distribution.c_perc",
                            ]);
                          }
                        }}
                        onBlur={field.onBlur}
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.error && <p className="text-xs text-destructive">{fieldState.error.message}</p>}
                    </>
                  )}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="meal_names">{t("startup.mealTimes")}</Label>
            <Controller
              name="meal_names"
              control={form.control}
              render={({ field, fieldState }) => (
                <>
                  <Input
                    id="meal_names"
                    type="text"
                    placeholder={t("startup.mealTimesPlaceholder")}
                    maxLength={500}
                    {...field}
                    value={field.value ?? ""}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.error && <p className="text-sm text-destructive">{fieldState.error.message}</p>}
                </>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="exclusions_guidelines">{t("startup.dietaryRestrictions")}</Label>
            <Controller
              name="exclusions_guidelines"
              control={form.control}
              render={({ field, fieldState }) => (
                <>
                  <Textarea
                    id="exclusions_guidelines"
                    placeholder={t("startup.dietaryRestrictionsPlaceholder")}
                    maxLength={2000}
                    rows={4}
                    {...field}
                    value={field.value ?? ""}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.error && <p className="text-sm text-destructive">{fieldState.error.message}</p>}
                </>
              )}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={form.formState.isSubmitting}
              data-testid="startup-form-cancel-button"
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting} data-testid="startup-form-generate-button">
              {form.formState.isSubmitting ? t("common.loading") : t("dashboard.createPlan")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
