import type { Page, Locator } from "@playwright/test";

/**
 * Page Object Model for the Meal Plan List component.
 * Encapsulates interactions with the meal plan list on the dashboard.
 */
export class MealPlanListPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Gets the list item locator for a meal plan by its name.
   */
  getMealPlanListItem(mealPlanName: string): Locator {
    return this.page.locator('li[data-testid*="meal-plan-list-item"]').filter({ hasText: mealPlanName }).first();
  }

  /**
   * Gets the edit button for a specific meal plan.
   */
  getEditButton(mealPlanName: string): Locator {
    return this.getMealPlanListItem(mealPlanName).getByTestId("meal-plan-edit-button").first();
  }

  /**
   * Waits for a meal plan to be visible in the list.
   */
  async waitForMealPlanVisible(mealPlanName: string, timeout = 10000): Promise<void> {
    await this.page.getByText(mealPlanName, { exact: false }).waitFor({ state: "visible", timeout });
  }

  /**
   * Clicks the edit button for a specific meal plan.
   */
  async clickEdit(mealPlanName: string): Promise<void> {
    const listItem = this.getMealPlanListItem(mealPlanName);
    await listItem.waitFor({ state: "visible" });

    const editButton = this.getEditButton(mealPlanName);
    await editButton.click();
  }

  /**
   * Waits for navigation to editor after clicking edit.
   */
  async waitForNavigationToEditor(mealPlanId?: string): Promise<void> {
    if (mealPlanId) {
      await this.page.waitForURL(new RegExp(`/app/editor/${mealPlanId}`), { timeout: 10000 });
    } else {
      await this.page.waitForURL(/\/app\/editor\/[^/]+/, { timeout: 10000 });
    }
  }

  /**
   * Opens a meal plan in the editor by name.
   */
  async openMealPlanInEditor(mealPlanName: string): Promise<void> {
    await this.waitForMealPlanVisible(mealPlanName);
    await this.clickEdit(mealPlanName);
    await this.waitForNavigationToEditor();
  }
}
