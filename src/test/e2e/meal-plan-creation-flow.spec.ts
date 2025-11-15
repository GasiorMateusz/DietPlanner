import { test } from "@playwright/test";
import { LoginPage, DashboardPage, AIChatPage, MultiDayPlanViewPage } from "./pages";
import { getTestUserId, cleanupMealPlansByNamePattern } from "./utils/test-cleanup";

test.describe("Multi-Day Meal Plan Creation and Editing Flow", () => {
  const TEST_MEAL_PLAN_NAME = "test multi-day meal plan";

  // Increase timeout for this test suite due to AI operations
  test.setTimeout(300 * 1000); // 5 minutes (increased for multi-day operations)

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
      const deletedPlans = await cleanupMealPlansByNamePattern(userId, TEST_MEAL_PLAN_NAME);

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

  test("should create 3-day plan, make it vegetarian, edit to 4 days, and view", async ({ page }) => {
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
    const viewPage = new MultiDayPlanViewPage(page);

    // Step 0: Login to application (already waits for redirect)
    await loginPage.login(E2E_USERNAME, E2E_PASSWORD);

    // Step 1: Open "create new meal plan" dialog
    await dashboardPage.openCreateMealPlanDialog();

    // Step 2: Fill the form with 3-day plan data
    await dashboardPage.startupFormDialog.fillForm({
      age: 20,
      weight: 70,
      height: 180,
      activityLevel: "moderate",
      targetKcal: 2000,
      macroDistribution: {
        protein: 30,
        fat: 25,
        carbs: 45,
      },
      mealNames: "Breakfast, Lunch, Dinner, Snack",
      exclusionsGuidelines: "No nuts, gluten-free preferred",
      numberOfDays: 3,
      ensureMealVariety: true,
      differentGuidelinesPerDay: false,
    });

    // Step 3: Submit form and navigate to conversation
    await dashboardPage.startupFormDialog.submit();
    await dashboardPage.startupFormDialog.waitForNavigationToCreatePage();

    // Step 4: Wait for conversation to initialize
    await aiChatPage.waitForInitialization();

    // Step 5: Give instruction in chat to make the plan vegetarian
    // Step 6: Wait for response and accept (opens modal)
    await aiChatPage.sendMessage("make the plan vegetarian");
    await aiChatPage.waitForAIResponse();
    await aiChatPage.accept();

    // Step 7: Fill plan name in modal and save (navigates to view page)
    await aiChatPage.fillPlanNameInModal(TEST_MEAL_PLAN_NAME);
    await aiChatPage.submitPlanNameModal();
    await viewPage.waitForLoad();

    // Step 8: Navigate back to dashboard
    await viewPage.navigateToDashboard();
    await dashboardPage.waitForDashboard();
    await dashboardPage.verifyMealPlanVisible(TEST_MEAL_PLAN_NAME);

    // Step 9: Click Edit button (navigates to /app/edit/[id] - AI chat in edit mode)
    await dashboardPage.mealPlanList.clickEdit(TEST_MEAL_PLAN_NAME);
    await dashboardPage.mealPlanList.waitForNavigationToEditPage();

    // Step 10: Wait for AI chat to initialize in edit mode
    await aiChatPage.waitForInitialization();

    // Step 11: Ask to make it 4 days and accept (opens modal in edit mode)
    await aiChatPage.sendMessage("make it 4 days");
    await aiChatPage.waitForAIResponse();
    await aiChatPage.accept();
    
    // Step 12: In edit mode, accepting opens a modal with plan name pre-filled
    // The checkbox "Create as new plan" is unchecked by default, so it will overwrite the existing plan
    await aiChatPage.waitForSavePlanModal();
    // Plan name should already be filled with existing plan name
    // Just submit the modal to overwrite the existing plan
    await aiChatPage.submitPlanNameModal();
    // Wait for navigation to view page - test ends here successfully after saving changes
    await viewPage.waitForLoad();
  });
});
