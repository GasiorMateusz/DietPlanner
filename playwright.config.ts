import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env.test file
const envTestPath = path.resolve(process.cwd(), ".env.test");
const envTest = dotenv.config({ path: envTestPath });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./src/test/e2e",
  /* Maximum time one test can run for (default: 30s) */
  timeout: 120 * 1000, // 2 minutes for e2e tests with AI operations
  /* Maximum time to wait for an action (default: 5s) */
  expect: {
    timeout: 10 * 1000, // 10 seconds for assertions
  },
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: "list",
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    // Start a fresh server for each run to avoid reusing a stale/dev server instance
    // (this improves reliability when .env.test is used to configure the app)
    reuseExistingServer: false,
    timeout: 120 * 1000,
    // Merge the current process.env with variables parsed from .env.test (if present).
    // This ensures the dev server receives both the runtime environment and any test-specific
    // variables defined in .env.test (PUBLIC_* vars, SUPABASE_*, etc.).
    env: Object.fromEntries(
      Object.entries({ ...(process.env || {}), ...(envTest.parsed || {}) }).map(([k, v]) => [k, v ?? ""])
    ),
  },
});
