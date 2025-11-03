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
  reporter: "html",
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
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    // Pass environment variables from .env.test to the dev server
    // These will be available as import.meta.env in the Astro application
    env: envTest.parsed
      ? {
          // Explicitly set required variables
          SUPABASE_URL: envTest.parsed.SUPABASE_URL || process.env.SUPABASE_URL || "",
          SUPABASE_KEY: envTest.parsed.SUPABASE_KEY || process.env.SUPABASE_KEY || "",
          PUBLIC_SUPABASE_URL: envTest.parsed.PUBLIC_SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL || "",
          PUBLIC_SUPABASE_KEY: envTest.parsed.PUBLIC_SUPABASE_KEY || process.env.PUBLIC_SUPABASE_KEY || "",
          OPENROUTER_API_KEY: envTest.parsed.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY || "",
          // Pass through all other variables from .env.test
          ...Object.fromEntries(
            Object.entries(envTest.parsed).filter(
              ([key]) => !["E2E_USERNAME", "E2E_PASSWORD", "PLAYWRIGHT_BASE_URL"].includes(key)
            )
          ),
        }
      : {
          // Fallback to process.env if .env.test doesn't exist
          SUPABASE_URL: process.env.SUPABASE_URL || "",
          SUPABASE_KEY: process.env.SUPABASE_KEY || "",
          PUBLIC_SUPABASE_URL: process.env.PUBLIC_SUPABASE_URL || "",
          PUBLIC_SUPABASE_KEY: process.env.PUBLIC_SUPABASE_KEY || "",
          OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || "",
        },
  },
});
