import type { Page, Locator } from "@playwright/test";
import { StartupFormDialog } from "./StartupFormDialog";
import { MealPlanListPage } from "./MealPlanListPage";

/**
 * Page Object Model for the Dashboard page.
 * Encapsulates dashboard-level interactions and provides access to sub-components.
 */
export class DashboardPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly createMealPlanButton: Locator;
  readonly searchInput: Locator;
  readonly startupFormDialog: StartupFormDialog;
  readonly mealPlanList: MealPlanListPage;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByTestId("dashboard-heading");
    this.createMealPlanButton = page.getByTestId("dashboard-create-meal-plan-button");
    this.searchInput = page.getByTestId("dashboard-search-input");
    this.startupFormDialog = new StartupFormDialog(page);
    this.mealPlanList = new MealPlanListPage(page);
  }

  /**
   * Navigates to the dashboard page.
   */
  async goto(): Promise<void> {
    await this.page.goto("/app/dashboard");
  }

  /**
   * Waits for the dashboard to be loaded.
   */
  async waitForLoad(): Promise<void> {
    await this.page.waitForURL(/\/app\/dashboard/, { timeout: 10000 });
    await this.heading.waitFor({ state: "visible" });
  }

  /**
   * Opens the create meal plan dialog.
   */
  async openCreateMealPlanDialog(): Promise<void> {
    await this.createMealPlanButton.click();
    await this.startupFormDialog.waitForVisible();
  }

  /**
   * Searches for meal plans by name.
   */
  async searchMealPlans(query: string): Promise<void> {
    await this.searchInput.fill(query);
  }

  /**
   * Verifies that a meal plan with the given name is visible in the list.
   */
  async verifyMealPlanVisible(mealPlanName: string): Promise<void> {
    await this.mealPlanList.waitForMealPlanVisible(mealPlanName);
  }

  /**
   * Waits for the dashboard to load and verifies it's ready.
   */
  async waitForDashboard(): Promise<void> {
    await this.waitForLoad();
  }
}
