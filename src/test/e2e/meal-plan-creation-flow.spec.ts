import { test, expect } from "@playwright/test";
import { LoginPage, DashboardPage, AIChatPage, MealPlanEditorPage } from "./pages";
import {
  getTestUserId,
  cleanupMealPlansByNamePattern,
} from "./utils/test-cleanup";

test.describe("Meal Plan Creation and Editing Flow", () => {
  const TEST_MEAL_PLAN_NAME = "test meal plan";

  // Increase timeout for this test suite due to AI operations
  test.setTimeout(180 * 1000); // 3 minutes

  test.beforeEach(async () => {
    // Ensure we have test credentials before running tests
    const E2E_USERNAME = process.env.E2E_USERNAME;
    const E2E_PASSWORD = process.env.E2E_PASSWORD;

    if (!E2E_USERNAME || !E2E_PASSWORD) {
      test.skip();
      return;
    }
  });

  test.afterEach(async () => {
    const E2E_USERNAME = process.env.E2E_USERNAME;

    if (!E2E_USERNAME) {
      return;
    }

    try {
      // Get test user ID for cleanup (may be null if service role key not available)
      const userId = await getTestUserId(E2E_USERNAME);

      // Always attempt cleanup - even if userId is null, cleanup will try to find it
      // from existing meal plans or use service role key to bypass RLS
      const deletedPlans = await cleanupMealPlansByNamePattern(
        userId,
        TEST_MEAL_PLAN_NAME
      );

      if (deletedPlans > 0) {
        console.log(
          `Cleaned up ${deletedPlans} meal plan(s) after test` +
            (userId ? ` for user ${userId}` : " (found user ID from meal plan)")
        );
      } else {
        // Only warn if we couldn't clean up AND we don't have service role key
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!serviceRoleKey) {
          console.warn(
            "No meal plans cleaned up. This may be due to RLS policies. " +
              "Set SUPABASE_SERVICE_ROLE_KEY for reliable cleanup on test failures."
          );
        }
      }

      // Optional: Clean up chat sessions if needed
      // Uncomment if you want to clean up chat sessions after each test
      // const deletedSessions = await cleanupChatSessionsByUserId(userId);
      // if (deletedSessions > 0) {
      //   console.log(`Cleaned up ${deletedSessions} chat session(s) after test`);
      // }
    } catch (error) {
      console.error("Test teardown failed:", error);
      // Don't fail the test if cleanup fails, but log the error
    }
  });

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

    // Step 7: Add plan meal name
    await editorPage.waitForLoad();
    await editorPage.fillPlanName(TEST_MEAL_PLAN_NAME);

    // Step 8: Change first meal name to "changed meal name"
    await editorPage.fillMealName(0, "changed meal name");

    // Step 9: Save changes using "save changes"
    await editorPage.saveAndWaitForDashboard();

    // Step 10: Find this meal plan in the list and open it with Edit/view
    await dashboardPage.waitForDashboard();
    await dashboardPage.verifyMealPlanVisible(TEST_MEAL_PLAN_NAME);
    await dashboardPage.mealPlanList.openMealPlanInEditor(TEST_MEAL_PLAN_NAME);

    // Verify we're on the editor page and data is correct
    await editorPage.waitForLoad();
    await editorPage.verifyPlanName(TEST_MEAL_PLAN_NAME);
    await editorPage.verifyMealName(0, "changed meal name");
  });
});
