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
    // Wait a bit for form validation to complete
    await this.page.waitForTimeout(100);
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
    // Wait a bit for form validation to complete
    await this.page.waitForTimeout(100);
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
   * Uses Promise.all to wait for both click and navigation simultaneously,
   * similar to LoginPage.login() to avoid race conditions.
   */
  async saveAndWaitForDashboard(): Promise<void> {
    // Wait for button to be visible and enabled before clicking
    await this.saveButton.waitFor({ state: "visible", timeout: 5000 });
    await this.saveButton.waitFor({ state: "attached" });

    // Ensure button is enabled (not disabled)
    await this.page.waitForFunction(
      (testId) => {
        const button = document.querySelector(`[data-testid="${testId}"]`) as HTMLButtonElement;
        return button && !button.disabled;
      },
      "meal-plan-editor-save-button",
      { timeout: 10000 }
    );

    // Verify form values before saving
    const planName = await this.getPlanName();
    if (!planName || planName.trim() === "") {
      throw new Error("Plan name is empty. Cannot save without plan name.");
    }

    // Check for any existing error messages before saving
    const errorAlert = this.page.locator('[role="alert"]').first();
    const hasError = await errorAlert.isVisible().catch(() => false);
    if (hasError) {
      const errorText = await errorAlert.textContent();
      throw new Error(`Form has validation errors before save: ${errorText}`);
    }

    // Wait a bit more to ensure form state is stable
    await this.page.waitForTimeout(200);

    // Use Promise.all to wait for both click and navigation simultaneously
    // Wait for URL change AND dashboard elements to appear (more reliable)
    try {
      await Promise.all([
        // Wait for URL change
        this.page.waitForURL(/\/app\/dashboard/, { timeout: 20000 }),
        // Also wait for dashboard elements to ensure page is loaded
        this.page.waitForSelector('[data-testid="dashboard-heading"]', { timeout: 20000, state: "visible" }),
        this.save(),
      ]);
    } catch (error) {
      // If navigation failed, check for error messages
      const errorAfterSave = await errorAlert.isVisible().catch(() => false);
      if (errorAfterSave) {
        const errorText = await errorAlert.textContent();
        throw new Error(`Save failed with error: ${errorText}. Original error: ${error}`);
      }
      // Check if we're still on the editor page (save might have failed silently)
      const currentUrl = this.page.url();
      if (currentUrl.includes("/app/editor")) {
        // Check for any validation errors in form fields
        const planNameError = this.page
          .locator('input[data-testid="meal-plan-editor-plan-name-input"]')
          .evaluate((el) => {
            const input = el as HTMLInputElement;
            return input.ariaInvalid === "true" || input.getAttribute("aria-invalid") === "true";
          })
          .catch(() => false);

        if (await planNameError) {
          throw new Error("Plan name validation failed. Form may not be valid.");
        }

        throw new Error(`Navigation to dashboard failed. Still on editor page: ${currentUrl}`);
      }
      throw error;
    }

    // Additional wait to ensure page is fully loaded
    await this.page.waitForLoadState("networkidle");
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
