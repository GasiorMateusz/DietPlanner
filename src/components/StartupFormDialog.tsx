import { Controller } from "react-hook-form";
import type { MealPlanStartupData } from "../types";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { useStartupForm } from "./hooks/useStartupForm";

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
  const { form, handleSubmit, handleClose } = useStartupForm({ onSubmit, onClose });

  return (
    <Dialog open={open} onOpenChange={(openState) => !openState && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="startup-form-dialog">
        <DialogHeader>
          <DialogTitle>Create New Meal Plan</DialogTitle>
          <DialogDescription>
            Fill in the patient information and dietary requirements to generate a personalized meal plan.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6" data-testid="startup-form">
          {form.formState.errors.root && (
            <div className="text-sm text-destructive">{form.formState.errors.root.message}</div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="patient_age">
                Patient Age <span className="text-muted-foreground">(years)</span>
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
                      placeholder="Age"
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
                Weight <span className="text-muted-foreground">(kg)</span>
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
                      placeholder="Weight"
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
                Height <span className="text-muted-foreground">(cm)</span>
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
                      placeholder="Height"
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
            <Label htmlFor="activity_level">Activity Level</Label>
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
                    <option value="">Select activity level</option>
                    <option value="sedentary">Sedentary</option>
                    <option value="light">Light</option>
                    <option value="moderate">Moderate</option>
                    <option value="high">High</option>
                  </Select>
                  {fieldState.error && <p className="text-sm text-destructive">{fieldState.error.message}</p>}
                </>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="target_kcal">
              Target Calories <span className="text-muted-foreground">(kcal/day)</span>
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
                    placeholder="Target calories"
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
            <Label>Target Macro Distribution (%)</Label>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="p_perc" className="text-xs">
                  Protein
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
                        placeholder="%"
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
                  Fat
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
                        placeholder="%"
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
                  Carbs
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
                        placeholder="%"
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
            <Label htmlFor="meal_names">Meal Names</Label>
            <Controller
              name="meal_names"
              control={form.control}
              render={({ field, fieldState }) => (
                <>
                  <Input
                    id="meal_names"
                    type="text"
                    placeholder="e.g., Breakfast, Lunch, Dinner, Snack"
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
            <Label htmlFor="exclusions_guidelines">Exclusions / Guidelines</Label>
            <Controller
              name="exclusions_guidelines"
              control={form.control}
              render={({ field, fieldState }) => (
                <>
                  <Textarea
                    id="exclusions_guidelines"
                    placeholder="Dietary restrictions, allergies, preferences, etc."
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
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting} data-testid="startup-form-generate-button">
              {form.formState.isSubmitting ? "Generating..." : "Generate"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
