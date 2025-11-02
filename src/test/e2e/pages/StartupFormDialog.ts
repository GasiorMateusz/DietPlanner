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
   * Fills the form with standard test data.
   */
  async fillForm(data: {
    age?: number;
    weight?: number;
    height?: number;
    activityLevel?: "sedentary" | "light" | "moderate" | "high";
    targetKcal?: number;
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
