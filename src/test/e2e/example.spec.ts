import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages";

test.describe("Example E2E Test", () => {
  test("should load the landing page with login form", async ({ page }) => {
    // Navigate to root - should show landing page with login form
    await page.goto("/");

    // Verify we're on the root page
    await expect(page).toHaveURL("/");

    // Verify page title contains Diet Planner
    await expect(page).toHaveTitle(/Diet Planner/i);

    // Create LoginPage instance to access form locators
    const loginPage = new LoginPage(page);

    // Verify login form elements are visible on landing page
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toBeVisible();
    await expect(loginPage.form).toBeVisible();
  });
});
