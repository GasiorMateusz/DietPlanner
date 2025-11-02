import { test, expect } from "@playwright/test";
import { LoginPage, DashboardPage, AIChatPage, MealPlanEditorPage } from "./pages";

test.describe("Meal Plan Creation and Editing Flow", () => {
  test("should create meal plan, modify via AI chat, edit and save", async ({ page }) => {
    const E2E_USERNAME = process.env.E2E_USERNAME;
    const E2E_PASSWORD = process.env.E2E_PASSWORD;

    if (!E2E_USERNAME || !E2E_PASSWORD) {
      test.skip();
      return;
    }

    // Initialize Page Objects
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);
    const aiChatPage = new AIChatPage(page);
    const editorPage = new MealPlanEditorPage(page);

    // Step 0: Login to application (already waits for redirect)
    await loginPage.login(E2E_USERNAME, E2E_PASSWORD);

    // Step 1: Open "create new meal plan" dialog
    await dashboardPage.openCreateMealPlanDialog();

    // Step 2: Fill the form with correct data
    await dashboardPage.startupFormDialog.fillForm({
      age: 20,
      weight: 70,
      height: 180,
      activityLevel: "moderate",
      targetKcal: 2000,
    });

    // Step 3: Submit form and navigate to conversation
    await dashboardPage.startupFormDialog.submit();
    await dashboardPage.startupFormDialog.waitForNavigationToCreatePage();

    // Step 4: Wait for conversation to initialize
    await aiChatPage.waitForInitialization();

    // Step 5: Give instruction in chat to make the plan vegetarian
    // Step 6: Wait for response and accept
    await aiChatPage.sendMessageAndAccept("make the plan vegetarian");

    // Step 7: Add plan meal name "test meal plan"
    await editorPage.waitForLoad();
    await editorPage.fillPlanName("test meal plan");

    // Step 8: Change first meal name to "changed meal name"
    await editorPage.fillMealName(0, "changed meal name");

    // Step 9: Save changes using "save changes"
    await editorPage.saveAndWaitForDashboard();

    // Step 10: Find this meal plan in the list and open it with Edit/view
    await dashboardPage.waitForDashboard();
    await dashboardPage.verifyMealPlanVisible("test meal plan");
    await dashboardPage.mealPlanList.openMealPlanInEditor("test meal plan");

    // Verify we're on the editor page and data is correct
    await editorPage.waitForLoad();
    await editorPage.verifyPlanName("test meal plan");
    await editorPage.verifyMealName(0, "changed meal name");
  });
});
