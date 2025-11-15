import type { Page, Locator } from "@playwright/test";

/**
 * Page Object Model for the Startup Form Dialog.
 * Encapsulates interactions with the meal plan creation form dialog.
 */
export class StartupFormDialog {
  readonly page: Page;
  readonly dialog: Locator;
  readonly form: Locator;
  readonly patientAgeInput: Locator;
  readonly patientWeightInput: Locator;
  readonly patientHeightInput: Locator;
  readonly activityLevelSelect: Locator;
  readonly targetKcalInput: Locator;
  readonly proteinPercInput: Locator;
  readonly fatPercInput: Locator;
  readonly carbsPercInput: Locator;
  readonly mealNamesInput: Locator;
  readonly exclusionsGuidelinesTextarea: Locator;
  readonly numberOfDaysSelect: Locator;
  readonly ensureMealVarietyCheckbox: Locator;
  readonly differentGuidelinesPerDayCheckbox: Locator;
  readonly perDayGuidelinesTextarea: Locator;
  readonly cancelButton: Locator;
  readonly generateButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.getByTestId("startup-form-dialog");
    this.form = page.getByTestId("startup-form");
    this.patientAgeInput = page.getByTestId("startup-form-patient-age");
    this.patientWeightInput = page.getByTestId("startup-form-patient-weight");
    this.patientHeightInput = page.getByTestId("startup-form-patient-height");
    this.activityLevelSelect = page.getByTestId("startup-form-activity-level");
    this.targetKcalInput = page.getByTestId("startup-form-target-kcal");
    this.proteinPercInput = page.locator("#p_perc");
    this.fatPercInput = page.locator("#f_perc");
    this.carbsPercInput = page.locator("#c_perc");
    this.mealNamesInput = page.locator("#meal_names");
    this.exclusionsGuidelinesTextarea = page.locator("#exclusions_guidelines");
    this.numberOfDaysSelect = page.getByTestId("startup-form-number-of-days");
    this.ensureMealVarietyCheckbox = page.getByTestId("startup-form-meal-variety");
    this.differentGuidelinesPerDayCheckbox = page.getByTestId("startup-form-different-guidelines");
    this.perDayGuidelinesTextarea = page.getByTestId("startup-form-per-day-guidelines");
    this.cancelButton = page.getByTestId("startup-form-cancel-button");
    this.generateButton = page.getByTestId("startup-form-generate-button");
  }

  /**
   * Waits for the dialog to be visible.
   */
  async waitForVisible(): Promise<void> {
    await this.dialog.waitFor({ state: "visible" });
  }

  /**
   * Fills the patient age field.
   */
  async fillPatientAge(age: number): Promise<void> {
    await this.patientAgeInput.fill(age.toString());
  }

  /**
   * Fills the patient weight field.
   */
  async fillPatientWeight(weight: number): Promise<void> {
    await this.patientWeightInput.fill(weight.toString());
  }

  /**
   * Fills the patient height field.
   */
  async fillPatientHeight(height: number): Promise<void> {
    await this.patientHeightInput.fill(height.toString());
  }

  /**
   * Selects the activity level.
   */
  async selectActivityLevel(level: "sedentary" | "light" | "moderate" | "high"): Promise<void> {
    await this.activityLevelSelect.selectOption(level);
  }

  /**
   * Fills the target calories field.
   */
  async fillTargetKcal(kcal: number): Promise<void> {
    await this.targetKcalInput.fill(kcal.toString());
  }

  /**
   * Fills the protein percentage field.
   */
  async fillProteinPerc(percentage: number): Promise<void> {
    await this.proteinPercInput.fill(percentage.toString());
  }

  /**
   * Fills the fat percentage field.
   */
  async fillFatPerc(percentage: number): Promise<void> {
    await this.fatPercInput.fill(percentage.toString());
  }

  /**
   * Fills the carbs percentage field.
   */
  async fillCarbsPerc(percentage: number): Promise<void> {
    await this.carbsPercInput.fill(percentage.toString());
  }

  /**
   * Fills the macro distribution fields.
   */
  async fillMacroDistribution(data: { protein?: number; fat?: number; carbs?: number }): Promise<void> {
    if (data.protein !== undefined) {
      await this.fillProteinPerc(data.protein);
    }
    if (data.fat !== undefined) {
      await this.fillFatPerc(data.fat);
    }
    if (data.carbs !== undefined) {
      await this.fillCarbsPerc(data.carbs);
    }
  }

  /**
   * Fills the meal names field.
   */
  async fillMealNames(names: string): Promise<void> {
    await this.mealNamesInput.fill(names);
  }

  /**
   * Fills the exclusions/guidelines field.
   */
  async fillExclusionsGuidelines(text: string): Promise<void> {
    await this.exclusionsGuidelinesTextarea.fill(text);
  }

  /**
   * Sets the number of days for multi-day plans.
   */
  async setNumberOfDays(days: number): Promise<void> {
    await this.numberOfDaysSelect.selectOption(days.toString());
  }

  /**
   * Toggles the "ensure meal variety" checkbox.
   */
  async setEnsureMealVariety(checked: boolean): Promise<void> {
    const isChecked = await this.ensureMealVarietyCheckbox.isChecked();
    if (isChecked !== checked) {
      await this.ensureMealVarietyCheckbox.click();
    }
  }

  /**
   * Toggles the "different guidelines per day" checkbox.
   */
  async setDifferentGuidelinesPerDay(checked: boolean): Promise<void> {
    const isChecked = await this.differentGuidelinesPerDayCheckbox.isChecked();
    if (isChecked !== checked) {
      await this.differentGuidelinesPerDayCheckbox.click();
    }
  }

  /**
   * Fills the per-day guidelines textarea.
   */
  async fillPerDayGuidelines(text: string): Promise<void> {
    await this.perDayGuidelinesTextarea.fill(text);
  }

  /**
   * Fills the form with standard test data.
   */
  async fillForm(data: {
    age?: number;
    weight?: number;
    height?: number;
    activityLevel?: "sedentary" | "light" | "moderate" | "high";
    targetKcal?: number;
    macroDistribution?: { protein?: number; fat?: number; carbs?: number };
    mealNames?: string;
    exclusionsGuidelines?: string;
    numberOfDays?: number;
    ensureMealVariety?: boolean;
    differentGuidelinesPerDay?: boolean;
    perDayGuidelines?: string;
  }): Promise<void> {
    if (data.age !== undefined) {
      await this.fillPatientAge(data.age);
    }
    if (data.weight !== undefined) {
      await this.fillPatientWeight(data.weight);
    }
    if (data.height !== undefined) {
      await this.fillPatientHeight(data.height);
    }
    if (data.activityLevel !== undefined) {
      await this.selectActivityLevel(data.activityLevel);
    }
    if (data.targetKcal !== undefined) {
      await this.fillTargetKcal(data.targetKcal);
    }
    if (data.macroDistribution !== undefined) {
      await this.fillMacroDistribution(data.macroDistribution);
    }
    if (data.mealNames !== undefined) {
      await this.fillMealNames(data.mealNames);
    }
    if (data.exclusionsGuidelines !== undefined) {
      await this.fillExclusionsGuidelines(data.exclusionsGuidelines);
    }
    if (data.numberOfDays !== undefined) {
      await this.setNumberOfDays(data.numberOfDays);
    }
    if (data.ensureMealVariety !== undefined) {
      await this.setEnsureMealVariety(data.ensureMealVariety);
    }
    if (data.differentGuidelinesPerDay !== undefined) {
      await this.setDifferentGuidelinesPerDay(data.differentGuidelinesPerDay);
    }
    if (data.perDayGuidelines !== undefined) {
      await this.fillPerDayGuidelines(data.perDayGuidelines);
    }
  }

  /**
   * Submits the form by clicking the Generate button.
   */
  async submit(): Promise<void> {
    await this.generateButton.click();
  }

  /**
   * Cancels the dialog.
   */
  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }

  /**
   * Waits for navigation to the create page after submission.
   */
  async waitForNavigationToCreatePage(): Promise<void> {
    await this.page.waitForURL(/\/app\/create/, { timeout: 10000 });
  }
}
