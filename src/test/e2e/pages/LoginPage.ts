import type { Page, Locator } from "@playwright/test";

/**
 * Page Object Model for the Login page.
 * Encapsulates all interactions with the login form.
 */
export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly form: Locator;
  readonly formSelector: string;

  constructor(page: Page) {
    this.page = page;
    this.formSelector = '[data-testid="login-form"]';
    this.form = page.getByTestId("login-form");
    this.emailInput = page.getByTestId("login-email-input");
    this.passwordInput = page.getByTestId("login-password-input");
    this.submitButton = page.getByTestId("login-submit-button");
  }

  /**
   * Navigates to the login page.
   */
  async goto(): Promise<void> {
    await this.page.goto("/auth/login");
    // Wait for the form to be visible (React component needs to load)
    await this.form.waitFor({ state: "visible", timeout: 10000 });

    // Wait for client hydration marker added by the React component (data-hydrated="true").
    // This prevents Playwright from clicking the submit button before handlers are attached
    // (which would cause a native form GET submit).
    try {
      await this.page.waitForFunction(
        (selector: string) => {
          const el = document.querySelector(selector);
          return !!el && el.getAttribute("data-hydrated") === "true";
        },
        this.formSelector,
        { timeout: 10000 }
      );
    } catch {
      // If the hydration marker doesn't appear within the timeout, proceed anyway so tests
      // can fail with the real error (keeps behavior visible for debugging).
    }
  }

  /**
   * Fills the login form with credentials.
   * Waits for inputs to be visible before filling.
   */
  async fillForm(email: string, password: string): Promise<void> {
    // Wait for inputs to be visible before filling
    await this.emailInput.waitFor({ state: "visible", timeout: 10000 });
    await this.passwordInput.waitFor({ state: "visible", timeout: 10000 });

    // Clear any existing values first
    await this.emailInput.clear();
    await this.passwordInput.clear();

    // Fill the form with credentials
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);

    // Verify the values were set (for debugging)
    const emailValue = await this.emailInput.inputValue();
    const passwordValue = await this.passwordInput.inputValue();

    if (emailValue !== email) {
      throw new Error(`Failed to fill email field. Expected "${email}", got "${emailValue}"`);
    }

    if (passwordValue !== password) {
      throw new Error(
        `Failed to fill password field. Expected "${password.length} chars", got "${passwordValue.length} chars"`
      );
    }
  }

  /**
   * Submits the login form.
   */
  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Performs complete login flow.
   * Waits for navigation to dashboard after successful login.
   */
  async login(email: string, password: string): Promise<void> {
    await this.goto();

    // Ensure form is fully loaded before filling
    await this.page.waitForLoadState("domcontentloaded");
    await this.fillForm(email, password);

    // Wait for submit button to be enabled before clicking
    await this.submitButton.waitFor({ state: "visible", timeout: 5000 });

    // Submit and wait for navigation to dashboard
    // Use Promise.all to wait for both click and navigation simultaneously
    await Promise.all([this.page.waitForURL(/\/app\/dashboard/, { timeout: 20000 }), this.submit()]);

    // Additional wait to ensure page is fully loaded
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Waits for successful login redirect to dashboard.
   * Note: This is called automatically by login(), but can be used separately if needed.
   */
  async waitForDashboardRedirect(): Promise<void> {
    await this.page.waitForURL(/\/app\/dashboard/, { timeout: 20000 });
    await this.page.waitForLoadState("networkidle");
  }
}
