import type { Page, Locator } from "@playwright/test";

/**
 * Page Object Model for the Meal Plan Editor page.
 * Encapsulates interactions with the meal plan editor form.
 */
export class MealPlanEditorPage {
  readonly page: Page;
  readonly planNameInput: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.planNameInput = page.getByTestId("meal-plan-editor-plan-name-input");
    this.saveButton = page.getByTestId("meal-plan-editor-save-button");
  }

  /**
   * Waits for the editor page to load.
   */
  async waitForLoad(): Promise<void> {
    await this.page.waitForURL(/\/app\/editor/, { timeout: 10000 });
    await this.planNameInput.waitFor({ state: "visible" });
  }

  /**
   * Fills the meal plan name.
   */
  async fillPlanName(name: string): Promise<void> {
    await this.planNameInput.fill(name);
  }

  /**
   * Gets the meal name input for a specific meal index.
   */
  getMealNameInput(mealIndex: number): Locator {
    return this.page.getByTestId(`meal-card-name-input-${mealIndex}`);
  }

  /**
   * Fills the meal name for a specific meal.
   */
  async fillMealName(mealIndex: number, name: string): Promise<void> {
    const mealNameInput = this.getMealNameInput(mealIndex);
    await mealNameInput.waitFor({ state: "visible" });
    await mealNameInput.fill(name);
  }

  /**
   * Gets the current value of the plan name input.
   */
  async getPlanName(): Promise<string> {
    return (await this.planNameInput.inputValue()) || "";
  }

  /**
   * Gets the current value of a meal name input.
   */
  async getMealName(mealIndex: number): Promise<string> {
    const mealNameInput = this.getMealNameInput(mealIndex);
    return (await mealNameInput.inputValue()) || "";
  }

  /**
   * Clicks the save button.
   */
  async save(): Promise<void> {
    // Playwright auto-waits for button to be enabled before clicking
    await this.saveButton.click();
  }

  /**
   * Waits for navigation to dashboard after saving.
   */
  async waitForNavigationToDashboard(): Promise<void> {
    await this.page.waitForURL(/\/app\/dashboard/, { timeout: 10000 });
  }

  /**
   * Performs the complete save flow.
   */
  async saveAndWaitForDashboard(): Promise<void> {
    await this.save();
    await this.waitForNavigationToDashboard();
  }

  /**
   * Verifies that the plan name matches the expected value.
   */
  async verifyPlanName(expectedName: string): Promise<void> {
    const actualName = await this.getPlanName();
    if (actualName !== expectedName) {
      throw new Error(`Expected plan name "${expectedName}", but got "${actualName}"`);
    }
  }

  /**
   * Verifies that a meal name matches the expected value.
   */
  async verifyMealName(mealIndex: number, expectedName: string): Promise<void> {
    const actualName = await this.getMealName(mealIndex);
    if (actualName !== expectedName) {
      throw new Error(`Expected meal ${mealIndex} name "${expectedName}", but got "${actualName}"`);
    }
  }
}
