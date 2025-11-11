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

    // Wait for submit button to be enabled and visible before clicking
    await this.submitButton.waitFor({ state: "visible", timeout: 10000 });
    
    // Wait a bit for any async operations to complete
    await this.page.waitForTimeout(500);

    // Submit the form and wait for either navigation or error
    await this.submit();

    // Wait for either navigation to dashboard OR error message to appear
    // Use Promise.race to detect which happens first
    try {
      await Promise.race([
        // Success: navigation to dashboard
        this.page.waitForURL(/\/app\/dashboard/, { timeout: 20000 }),
        // Failure: error message appears
        this.page
          .waitForSelector('[data-testid="login-form"] [role="alert"]', { timeout: 10000 })
          .then(async () => {
            // Get error message for better debugging
            const errorText = await this.page
              .locator('[data-testid="login-form"] [role="alert"]')
              .textContent()
              .catch(() => "Unknown error");
            // Log the email used for debugging (but not the password)
            console.error(`Login failed for email: ${email}`);
            throw new Error(`Login failed: ${errorText}. Please verify E2E_USERNAME and E2E_PASSWORD in .env.test are correct.`);
          }),
      ]);

      // If we get here, navigation succeeded
      // Additional wait to ensure page is fully loaded
      await this.page.waitForLoadState("networkidle");
    } catch (error) {
      // If it's our custom error, re-throw it
      if (error instanceof Error && error.message.includes("Login failed")) {
        throw error;
      }
      // Otherwise, it might be a timeout - check if we're on dashboard or still on login
      const currentUrl = this.page.url();
      if (currentUrl.includes("/app/dashboard")) {
        // Navigation succeeded, just continue
        await this.page.waitForLoadState("networkidle");
      } else {
        // Still on login page, check for error
        const errorElement = await this.page
          .locator('[data-testid="login-form"] [role="alert"]')
          .first()
          .textContent()
          .catch(() => null);
        if (errorElement) {
          throw new Error(`Login failed: ${errorElement}`);
        }
        throw new Error(`Login timeout. Current URL: ${currentUrl}`);
      }
    }
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
