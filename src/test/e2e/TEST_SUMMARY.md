# E2E Test Summary - Meal Plan Creation Flow

## Overview

This document provides a comprehensive summary of the E2E test for the meal plan creation and editing flow. Use this as a reference when debugging, fixing, or extending the test.

## Test File Location

- **Test File**: `src/test/e2e/meal-plan-creation-flow.spec.ts`
- **Page Objects**: `src/test/e2e/pages/`
- **Test Configuration**: `playwright.config.ts`

## Test Scenario

### Objective

Verify the complete user flow for creating a meal plan, modifying it via AI chat, editing it manually, and verifying the saved changes.

### Test Steps

1. **Login** - Authenticate with test credentials
2. **Open Create Dialog** - Click "Create new meal plan" button
3. **Fill Startup Form** - Enter patient data (age: 20, weight: 70kg, height: 180cm, activity: moderate, target: 2000 kcal)
4. **Navigate to AI Chat** - Submit form and wait for AI chat interface
5. **Initialize Chat** - Wait for AI session to initialize
6. **Send AI Message** - Request vegetarian meal plan modification
7. **Accept Changes** - Accept AI modifications and navigate to editor
8. **Edit Meal Plan** - Set plan name to "test meal plan" and change first meal name to "changed meal name"
9. **Save Changes** - Save meal plan and return to dashboard
10. **Verify & Re-open** - Find the meal plan in the list, open it, and verify saved data

## Page Object Model Structure

The test uses a Page Object Model (POM) pattern for maintainability:

```
src/test/e2e/pages/
├── index.ts                    # Central export point
├── LoginPage.ts                # Login page interactions
├── DashboardPage.ts            # Dashboard page with sub-components
├── StartupFormDialog.ts        # Meal plan creation form dialog
├── AIChatPage.ts               # AI chat interface
├── MealPlanEditorPage.ts       # Meal plan editor form
└── MealPlanListPage.ts         # Meal plan list interactions
```

### Key Page Objects

#### LoginPage

- **Purpose**: Handle authentication flow
- **Key Methods**: `login()`, `fillForm()`, `waitForDashboardRedirect()`
- **Test IDs Used**: `login-email-input`, `login-password-input`, `login-submit-button`

#### DashboardPage

- **Purpose**: Main dashboard interactions
- **Composed Of**: `StartupFormDialog`, `MealPlanListPage`
- **Key Methods**: `openCreateMealPlanDialog()`, `verifyMealPlanVisible()`
- **Test IDs Used**: `dashboard-heading`, `dashboard-create-meal-plan-button`

#### StartupFormDialog

- **Purpose**: Meal plan creation form
- **Key Methods**: `fillForm()`, `submit()`, `waitForNavigationToCreatePage()`
- **Test IDs Used**: `startup-form-patient-age`, `startup-form-patient-weight`, `startup-form-patient-height`, `startup-form-activity-level`, `startup-form-target-kcal`, `startup-form-generate-button`

#### AIChatPage

- **Purpose**: AI conversation interface
- **Key Methods**: `waitForInitialization()`, `sendMessageAndAccept()`, `waitForAIResponse()`
- **Test IDs Used**: `ai-chat-initializing`, `ai-chat-message-input`, `ai-chat-send-button`, `ai-chat-accept-button`

#### MealPlanEditorPage

- **Purpose**: Meal plan editor form
- **Key Methods**: `fillPlanName()`, `fillMealName()`, `save()`, `verifyPlanName()`, `verifyMealName()`
- **Test IDs Used**: `meal-plan-editor-plan-name-input`, `meal-plan-editor-save-button`, `meal-card-name-input-{index}`

#### MealPlanListPage

- **Purpose**: Meal plan list interactions
- **Key Methods**: `waitForMealPlanVisible()`, `openMealPlanInEditor()`
- **Test IDs Used**: `meal-plan-list-item-{id}`, `meal-plan-edit-button`

## Environment Variables Required

Create a `.env.test` file in the project root with:

```env
# Test User Credentials (Required for test execution)
E2E_USERNAME=your-test-user@example.com
E2E_PASSWORD=your-test-password

# Playwright Configuration (Optional)
PLAYWRIGHT_BASE_URL=http://localhost:3000  # Optional, defaults to localhost:3000

# Supabase Database Configuration (Required)
# The application reads these from environment variables to connect to Supabase
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key

# OpenRouter AI Configuration (Required for AI chat tests)
OPENROUTER_API_KEY=your_openrouter_api_key
```

**Note**:

- The test will automatically skip if `E2E_USERNAME` or `E2E_PASSWORD` are not set.
- Supabase credentials are required for authentication and database operations during tests.
- OpenRouter API key is required for the AI chat functionality to work in tests.

## Test Data

### Form Input Values

- **Patient Age**: 20 years
- **Patient Weight**: 70 kg
- **Patient Height**: 180 cm
- **Activity Level**: moderate
- **Target Calories**: 2000 kcal/day

### Expected Values

- **Plan Name**: "test meal plan"
- **First Meal Name**: "changed meal name"

## Common Failure Points & Debugging

### 1. Login Failures

**Symptoms**: Test fails at login step
**Possible Causes**:

- Invalid credentials in `.env.test`
- Session cookies not clearing between tests
- Authentication service unavailable

**Debug Steps**:

- Verify `.env.test` file exists and has correct credentials
- Check browser console for authentication errors
- Verify Supabase connection

### 2. Dialog Not Opening

**Symptoms**: Test fails when trying to open create dialog
**Possible Causes**:

- Dialog component not rendering
- Button not visible/clickable
- Race condition (page not fully loaded)

**Debug Steps**:

- Check if `dashboard-create-meal-plan-button` test ID exists
- Verify dialog component is mounted
- Add explicit wait for dashboard to load

### 3. AI Chat Initialization Timeout

**Symptoms**: Test times out waiting for chat to initialize
**Possible Causes**:

- AI service (OpenRouter) unavailable or slow
- Session creation API failing
- Network issues

**Debug Steps**:

- Check API response in Network tab
- Verify OpenRouter API key is configured
- Increase timeout in `AIChatPage.waitForInitialization()`
- Check server logs for API errors

**Current Timeouts**:

- Initialization visible: 30 seconds
- Initialization complete: 60 seconds
- Message input enabled: 10 seconds

### 4. AI Response Timeout

**Symptoms**: Test times out waiting for AI response
**Possible Causes**:

- AI service slow to respond
- Message not properly formatted
- API endpoint errors

**Debug Steps**:

- Check AI service status
- Verify message was sent (check Network tab)
- Check response in browser DevTools
- Review API logs

**Current Timeout**: 60 seconds for AI response

### 5. Save Navigation Issues

**Symptoms**: Test fails after clicking save button
**Possible Causes**:

- Save API failing
- Navigation not triggered
- Validation errors preventing save

**Debug Steps**:

- Check if plan name is filled (required field)
- Verify API call succeeds (Network tab)
- Check for validation errors in form
- Verify redirect happens after save

### 6. Meal Plan Not Found in List

**Symptoms**: Test fails when trying to find meal plan in list
**Possible Causes**:

- Meal plan not saved correctly
- List not refreshing
- Search/filter hiding the item

**Debug Steps**:

- Verify meal plan exists in database
- Check if list needs refresh
- Verify search input is empty
- Check list rendering (skeleton states)

## Running the Test

### Prerequisites

1. Install Playwright browsers:

   ```bash
   npx playwright install chromium
   ```

2. Ensure `.env.test` file exists with credentials

3. Start the development server:
   ```bash
   npm run dev
   ```

### Run Commands

**Run all E2E tests**:

```bash
npm run test:e2e
```

**Run with UI** (interactive mode):

```bash
npm run test:e2e:ui
```

**Run in debug mode**:

```bash
npm run test:e2e:debug
```

**Run in headed mode** (see browser):

```bash
npm run test:e2e:headed
```

**Run specific test file**:

```bash
npx playwright test src/test/e2e/meal-plan-creation-flow.spec.ts
```

## Test Dependencies

### External Services

- **Supabase**: Authentication and database
  - **Database**: E2E tests use the Supabase database configured via `SUPABASE_URL` and `SUPABASE_KEY` environment variables
  - **Important**: Tests currently use the same database instance as configured in your environment. For production-ready testing, consider using a dedicated test Supabase project to avoid polluting development data.
  - **Test Data**: Meal plans created during tests persist in the database. There is currently no automatic cleanup (see Known Issues section).
  - **Authentication**: Uses Supabase Auth for user authentication during tests.
- **OpenRouter AI**: AI meal plan generation
  - Required for AI chat functionality in the meal plan creation flow
- **Dev Server**: Must be running on port 3000 (or configured port)
  - Playwright automatically starts the dev server if not already running

### Internal Dependencies

- All components must have `data-testid` attributes (already added)
- Page Object Model classes must be up-to-date with component changes
- Test IDs must match between components and page objects

## Component Test IDs Reference

### Authentication

- `login-form`
- `login-email-input`
- `login-password-input`
- `login-submit-button`

### Dashboard

- `dashboard-heading`
- `dashboard-create-meal-plan-button`
- `dashboard-search-input`

### Startup Form

- `startup-form-dialog`
- `startup-form`
- `startup-form-patient-age`
- `startup-form-patient-weight`
- `startup-form-patient-height`
- `startup-form-activity-level`
- `startup-form-target-kcal`
- `startup-form-generate-button`

### AI Chat

- `ai-chat-interface`
- `ai-chat-initializing`
- `ai-chat-message-history`
- `ai-chat-message-form`
- `ai-chat-message-input`
- `ai-chat-send-button`
- `ai-chat-accept-button`

### Editor

- `meal-plan-editor-plan-name-input`
- `meal-plan-editor-save-button`
- `meal-card-name-input-{index}` (dynamic, e.g., `meal-card-name-input-0`)

### List

- `meal-plan-list-item-{id}` (dynamic)
- `meal-plan-edit-button`

## Test Flow Diagram

```
1. Login → Dashboard
2. Dashboard → Create Dialog
3. Create Dialog → Fill Form → Submit
4. Submit → AI Chat Page
5. AI Chat → Wait Initialization
6. AI Chat → Send Message → Wait Response
7. AI Chat → Accept → Editor Page
8. Editor → Fill Plan Name → Fill Meal Name → Save
9. Save → Dashboard
10. Dashboard → Find Meal Plan → Click Edit
11. Editor (Edit Mode) → Verify Data
```

## Known Issues & TODOs

### Potential Issues

1. **Race Conditions**: Some steps may need additional waits if UI is slow
2. **AI Service Latency**: AI responses can vary in time (current timeout: 60s)
3. **Database Cleanup**:
   - No automatic cleanup of test data after test execution
   - Meal plans created during tests persist in the database
   - Multiple test runs will accumulate test data unless manually cleaned
   - **Recommendation**: Implement test data cleanup hooks or use a dedicated test database
4. **Parallel Execution**: Test may fail if run in parallel (consider test isolation)
5. **Database Isolation**:
   - Tests share the same database instance as development (based on environment variables)
   - Test data may interfere with development data and vice versa
   - **Recommendation**: Use a separate Supabase project for E2E testing with its own database

### Recommended Improvements

1. Add test data cleanup (afterEach hook)
2. Add retry logic for flaky steps
3. Add visual regression testing
4. Add API mocking for faster, more reliable tests
5. Split test into smaller, focused tests
6. Add test isolation (unique test data per run)

## Debugging Tips

1. **Use Playwright UI**: Run `npm run test:e2e:ui` for step-by-step debugging
2. **Check Trace Viewer**: Playwright automatically captures traces on failure
3. **Use Screenshots**: Check `test-results/` folder for screenshots on failure
4. **Console Logs**: Check browser console for JavaScript errors
5. **Network Tab**: Verify API calls are succeeding
6. **Add Pauses**: Temporarily add `await page.pause()` to inspect state

## Contact & Resources

- **Playwright Docs**: https://playwright.dev/
- **Page Object Model Pattern**: https://playwright.dev/docs/pom
- **Test Best Practices**: See `.cursor/rules/playwright-e2e-itesting.mdc`

## Test Maintenance Checklist

When modifying components:

- [ ] Update corresponding Page Object class
- [ ] Update test IDs if element IDs change
- [ ] Verify test still passes
- [ ] Update this document if test flow changes
- [ ] Check if new test IDs need to be added

When test fails:

- [ ] Check if component changed (test IDs, structure)
- [ ] Verify all external services are running
- [ ] Check environment variables
- [ ] Review timeout values (may need adjustment)
- [ ] Check browser console and network logs
