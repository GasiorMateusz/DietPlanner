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
   * Gets the view button for a specific meal plan.
   */
  getViewButton(mealPlanName: string): Locator {
    return this.getMealPlanListItem(mealPlanName).getByTestId("meal-plan-view-button").first();
  }

  /**
   * Waits for a meal plan to be visible in the list.
   */
  async waitForMealPlanVisible(mealPlanName: string, timeout = 10000): Promise<void> {
    // Use the scoped list item locator to avoid strict mode violations
    // when multiple meal plans with the same name exist
    await this.getMealPlanListItem(mealPlanName).waitFor({ state: "visible", timeout });
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
   * Waits for navigation to edit page (AI chat in edit mode) after clicking edit.
   */
  async waitForNavigationToEditPage(mealPlanId?: string): Promise<void> {
    if (mealPlanId) {
      await this.page.waitForURL(new RegExp(`/app/edit/${mealPlanId}`), { timeout: 10000 });
    } else {
      await this.page.waitForURL(/\/app\/edit\/[^/]+/, { timeout: 10000 });
    }
  }

  /**
   * @deprecated Editor removed - use waitForNavigationToEditPage instead
   */
  async waitForNavigationToEditor(mealPlanId?: string): Promise<void> {
    return this.waitForNavigationToEditPage(mealPlanId);
  }

  /**
   * Clicks the view button for a specific meal plan.
   */
  async clickView(mealPlanName: string): Promise<void> {
    const listItem = this.getMealPlanListItem(mealPlanName);
    await listItem.waitFor({ state: "visible" });

    const viewButton = this.getViewButton(mealPlanName);
    await viewButton.click();
  }

  /**
   * Waits for navigation to view page after clicking view.
   */
  async waitForNavigationToView(mealPlanId?: string): Promise<void> {
    if (mealPlanId) {
      await this.page.waitForURL(new RegExp(`/app/view/${mealPlanId}`), { timeout: 10000 });
    } else {
      await this.page.waitForURL(/\/app\/view\/[^/]+/, { timeout: 10000 });
    }
  }

  /**
   * Opens a meal plan in the view page by name.
   */
  async openMealPlanInView(mealPlanName: string): Promise<void> {
    await this.waitForMealPlanVisible(mealPlanName);
    await this.clickView(mealPlanName);
    await this.waitForNavigationToView();
  }
}
