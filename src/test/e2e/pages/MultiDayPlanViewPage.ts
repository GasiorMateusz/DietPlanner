import type { Page, Locator } from "@playwright/test";

/**
 * Page Object Model for the Multi-Day Plan View page.
 * Encapsulates interactions with the multi-day meal plan view interface.
 */
export class MultiDayPlanViewPage {
  readonly page: Page;
  readonly backButton: Locator;
  readonly exportButton: Locator;
  readonly editButton: Locator;
  readonly planName: Locator;
  readonly planSummary: Locator;
  readonly daysList: Locator;
  readonly numberOfDaysText: Locator;
  readonly dayCards: Locator;

  constructor(page: Page) {
    this.page = page;
    this.backButton = page.getByTestId("back-button");
    this.exportButton = page.getByTestId("export-button");
    this.editButton = page.getByTestId("edit-button");
    this.planName = page.locator("h1").first();
    this.planSummary = page.locator('[data-testid*="plan-summary"]').or(page.locator("text=Summary")).first();
    this.daysList = page.locator("text=All Days").locator("..").locator("..");
    // Number of days is displayed in a paragraph after the h1 (plan name) in the PlanSummary component
    // The structure is: <div><h1>Plan Name</h1><p>4 days</p></div>
    // Use a more specific selector: find p that contains a number followed by "days" or "day"
    this.numberOfDaysText = page.locator("h1").first().locator("..").locator("p").first();
    // Day cards have "Day X" heading (h3 elements with text like "Day 1", "Day 2", etc.)
    this.dayCards = page.locator('h3').filter({ hasText: /Day \d+/ });
  }

  /**
   * Waits for the view page to load.
   */
  async waitForLoad(): Promise<void> {
    await this.page.waitForURL(/\/app\/view\/[^/]+/, { timeout: 10000 });
    await this.backButton.waitFor({ state: "visible", timeout: 10000 });
  }

  /**
   * Gets the plan name text.
   */
  async getPlanName(): Promise<string> {
    await this.planName.waitFor({ state: "visible" });
    return (await this.planName.textContent()) || "";
  }

  /**
   * Verifies the plan name matches the expected value.
   */
  async verifyPlanName(expectedName: string): Promise<void> {
    const actualName = await this.getPlanName();
    if (!actualName.includes(expectedName)) {
      throw new Error(`Expected plan name to contain "${expectedName}", but got "${actualName}"`);
    }
  }

  /**
   * Clicks the back button to return to dashboard.
   */
  async clickBack(): Promise<void> {
    await this.backButton.click();
  }

  /**
   * Navigates back to dashboard (clicks back button and waits for navigation).
   */
  async navigateToDashboard(): Promise<void> {
    await this.clickBack();
    await this.page.waitForURL(/\/app\/dashboard/, { timeout: 10000 });
  }

  /**
   * Clicks the edit button to navigate to editor.
   */
  async clickEdit(): Promise<void> {
    await this.editButton.click();
  }

  /**
   * Waits for navigation to editor after clicking edit.
   */
  async waitForNavigationToEditor(): Promise<void> {
    await this.page.waitForURL(/\/app\/edit\/[^/]+/, { timeout: 10000 });
  }

  /**
   * Clicks edit and waits for navigation to editor.
   */
  async editAndWaitForEditor(): Promise<void> {
    await this.clickEdit();
    await this.waitForNavigationToEditor();
  }

  /**
   * Gets the number of days from the plan summary.
   * Extracts the number from text like "4 days" or "4 dni".
   */
  async getNumberOfDays(): Promise<number> {
    await this.numberOfDaysText.waitFor({ state: "visible" });
    const text = (await this.numberOfDaysText.textContent()) || "";
    // Extract number from text like "4 days" or "4 dni"
    const match = text.match(/(\d+)/);
    if (!match) {
      throw new Error(`Could not extract number of days from text: "${text}"`);
    }
    return parseInt(match[1], 10);
  }

  /**
   * Counts the actual day cards displayed in the days list.
   */
  async countDayCards(): Promise<number> {
    await this.daysList.waitFor({ state: "visible" });
    return await this.dayCards.count();
  }

  /**
   * Verifies the plan has the expected number of days.
   * Checks both the summary text and the actual day cards count.
   */
  async verifyNumberOfDays(expectedDays: number): Promise<void> {
    const summaryDays = await this.getNumberOfDays();
    const cardCount = await this.countDayCards();

    if (summaryDays !== expectedDays) {
      throw new Error(
        `Expected plan to have ${expectedDays} days in summary, but got ${summaryDays}`
      );
    }

    if (cardCount !== expectedDays) {
      throw new Error(
        `Expected ${expectedDays} day cards, but found ${cardCount}`
      );
    }
  }
}

