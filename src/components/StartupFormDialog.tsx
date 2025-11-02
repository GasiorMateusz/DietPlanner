import { useState } from "react";
import type { FormEvent } from "react";
import type { MealPlanStartupData } from "../types";
import { mealPlanStartupDataSchema } from "../lib/validation/meal-plans.schemas";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select } from "./ui/select";
import { Textarea } from "./ui/textarea";

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
  const [formData, setFormData] = useState<Partial<MealPlanStartupData>>({
    patient_age: null,
    patient_weight: null,
    patient_height: null,
    activity_level: null,
    target_kcal: null,
    target_macro_distribution: null,
    meal_names: null,
    exclusions_guidelines: null,
  });

  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: keyof MealPlanStartupData, value: string | number | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleNumberInputChange = (field: keyof MealPlanStartupData, value: string) => {
    const numValue = value === "" ? null : parseFloat(value);
    if (value === "" || (!isNaN(numValue!) && numValue! >= 0)) {
      handleInputChange(field, numValue);
    }
  };

  const handleMacroChange = (macro: "p_perc" | "f_perc" | "c_perc", value: string) => {
    const numValue = value === "" ? null : parseFloat(value);
    if (value === "" || (!isNaN(numValue!) && numValue! >= 0 && numValue! <= 100)) {
      setFormData((prev) => ({
        ...prev,
        target_macro_distribution: {
          p_perc: prev.target_macro_distribution?.p_perc ?? 0,
          f_perc: prev.target_macro_distribution?.f_perc ?? 0,
          c_perc: prev.target_macro_distribution?.c_perc ?? 0,
          [macro]: numValue ?? 0,
        },
      }));
      if (errors[`target_macro_distribution.${macro}`]) {
        setErrors((prev) => ({
          ...prev,
          [`target_macro_distribution.${macro}`]: undefined,
        }));
      }
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      // Prepare data for validation (convert empty strings to null)
      const dataToValidate: Partial<MealPlanStartupData> = {
        patient_age:
          formData.patient_age === null || formData.patient_age === undefined ? null : Number(formData.patient_age),
        patient_weight:
          formData.patient_weight === null || formData.patient_weight === undefined
            ? null
            : Number(formData.patient_weight),
        patient_height:
          formData.patient_height === null || formData.patient_height === undefined
            ? null
            : Number(formData.patient_height),
        activity_level: formData.activity_level || null,
        target_kcal:
          formData.target_kcal === null || formData.target_kcal === undefined ? null : Number(formData.target_kcal),
        target_macro_distribution: formData.target_macro_distribution || null,
        meal_names: formData.meal_names?.trim() || null,
        exclusions_guidelines: formData.exclusions_guidelines?.trim() || null,
      };

      // Validate using Zod schema
      const validation = mealPlanStartupDataSchema.safeParse(dataToValidate);

      if (!validation.success) {
        const fieldErrors: Record<string, string> = {};
        validation.error.errors.forEach((error) => {
          const field = error.path.join(".");
          fieldErrors[field] = error.message;
        });
        setErrors(fieldErrors);
        setIsSubmitting(false);
        return;
      }

      // Submit validated data
      onSubmit(validation.data as MealPlanStartupData);
      // Reset form
      setFormData({
        patient_age: null,
        patient_weight: null,
        patient_height: null,
        activity_level: null,
        target_kcal: null,
        target_macro_distribution: null,
        meal_names: null,
        exclusions_guidelines: null,
      });
      setErrors({});
    } catch (err) {
      console.error("Form submission error:", err);
      setErrors({
        _form: "An error occurred. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        patient_age: null,
        patient_weight: null,
        patient_height: null,
        activity_level: null,
        target_kcal: null,
        target_macro_distribution: null,
        meal_names: null,
        exclusions_guidelines: null,
      });
      setErrors({});
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(openState) => !openState && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Meal Plan</DialogTitle>
          <DialogDescription>
            Fill in the patient information and dietary requirements to generate a personalized meal plan.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {errors._form && <div className="text-sm text-destructive">{errors._form}</div>}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="patient_age">
                Patient Age <span className="text-muted-foreground">(years)</span>
              </Label>
              <Input
                id="patient_age"
                type="number"
                min="1"
                max="150"
                placeholder="Age"
                value={formData.patient_age ?? ""}
                onChange={(e) => handleNumberInputChange("patient_age", e.target.value)}
                aria-invalid={!!errors.patient_age}
              />
              {errors.patient_age && <p className="text-sm text-destructive">{errors.patient_age}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="patient_weight">
                Weight <span className="text-muted-foreground">(kg)</span>
              </Label>
              <Input
                id="patient_weight"
                type="number"
                min="0"
                max="1000"
                step="0.1"
                placeholder="Weight"
                value={formData.patient_weight ?? ""}
                onChange={(e) => handleNumberInputChange("patient_weight", e.target.value)}
                aria-invalid={!!errors.patient_weight}
              />
              {errors.patient_weight && <p className="text-sm text-destructive">{errors.patient_weight}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="patient_height">
                Height <span className="text-muted-foreground">(cm)</span>
              </Label>
              <Input
                id="patient_height"
                type="number"
                min="0"
                max="300"
                step="0.1"
                placeholder="Height"
                value={formData.patient_height ?? ""}
                onChange={(e) => handleNumberInputChange("patient_height", e.target.value)}
                aria-invalid={!!errors.patient_height}
              />
              {errors.patient_height && <p className="text-sm text-destructive">{errors.patient_height}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="activity_level">Activity Level</Label>
            <Select
              id="activity_level"
              value={formData.activity_level ?? ""}
              onChange={(e) => handleInputChange("activity_level", e.target.value || null)}
              aria-invalid={!!errors.activity_level}
            >
              <option value="">Select activity level</option>
              <option value="sedentary">Sedentary</option>
              <option value="light">Light</option>
              <option value="moderate">Moderate</option>
              <option value="high">High</option>
            </Select>
            {errors.activity_level && <p className="text-sm text-destructive">{errors.activity_level}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="target_kcal">
              Target Calories <span className="text-muted-foreground">(kcal/day)</span>
            </Label>
            <Input
              id="target_kcal"
              type="number"
              min="1"
              max="10000"
              placeholder="Target calories"
              value={formData.target_kcal ?? ""}
              onChange={(e) => handleNumberInputChange("target_kcal", e.target.value)}
              aria-invalid={!!errors.target_kcal}
            />
            {errors.target_kcal && <p className="text-sm text-destructive">{errors.target_kcal}</p>}
          </div>

          <div className="space-y-2">
            <Label>Target Macro Distribution (%)</Label>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="p_perc" className="text-xs">
                  Protein
                </Label>
                <Input
                  id="p_perc"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="%"
                  value={formData.target_macro_distribution?.p_perc ?? ""}
                  onChange={(e) => handleMacroChange("p_perc", e.target.value)}
                  aria-invalid={!!errors["target_macro_distribution.p_perc"]}
                />
                {errors["target_macro_distribution.p_perc"] && (
                  <p className="text-xs text-destructive">{errors["target_macro_distribution.p_perc"]}</p>
                )}
              </div>
              <div>
                <Label htmlFor="f_perc" className="text-xs">
                  Fat
                </Label>
                <Input
                  id="f_perc"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="%"
                  value={formData.target_macro_distribution?.f_perc ?? ""}
                  onChange={(e) => handleMacroChange("f_perc", e.target.value)}
                  aria-invalid={!!errors["target_macro_distribution.f_perc"]}
                />
                {errors["target_macro_distribution.f_perc"] && (
                  <p className="text-xs text-destructive">{errors["target_macro_distribution.f_perc"]}</p>
                )}
              </div>
              <div>
                <Label htmlFor="c_perc" className="text-xs">
                  Carbs
                </Label>
                <Input
                  id="c_perc"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="%"
                  value={formData.target_macro_distribution?.c_perc ?? ""}
                  onChange={(e) => handleMacroChange("c_perc", e.target.value)}
                  aria-invalid={!!errors["target_macro_distribution.c_perc"]}
                />
                {errors["target_macro_distribution.c_perc"] && (
                  <p className="text-xs text-destructive">{errors["target_macro_distribution.c_perc"]}</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="meal_names">Meal Names</Label>
            <Input
              id="meal_names"
              type="text"
              placeholder="e.g., Breakfast, Lunch, Dinner, Snack"
              maxLength={500}
              value={formData.meal_names ?? ""}
              onChange={(e) => handleInputChange("meal_names", e.target.value)}
              aria-invalid={!!errors.meal_names}
            />
            {errors.meal_names && <p className="text-sm text-destructive">{errors.meal_names}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="exclusions_guidelines">Exclusions / Guidelines</Label>
            <Textarea
              id="exclusions_guidelines"
              placeholder="Dietary restrictions, allergies, preferences, etc."
              maxLength={2000}
              rows={4}
              value={formData.exclusions_guidelines ?? ""}
              onChange={(e) => handleInputChange("exclusions_guidelines", e.target.value)}
              aria-invalid={!!errors.exclusions_guidelines}
            />
            {errors.exclusions_guidelines && <p className="text-sm text-destructive">{errors.exclusions_guidelines}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Generating..." : "Generate"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
