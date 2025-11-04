import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";
import dotenv from "dotenv";

// Load .env.test if it exists
dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });

// Get environment variables with fallbacks
const getEnvVar = (key: string, fallback: string): string => {
  return process.env[key] || fallback;
};

const testEnv = {
  PUBLIC_SUPABASE_URL: getEnvVar(
    "PUBLIC_SUPABASE_URL",
    getEnvVar("NEXT_PUBLIC_SUPABASE_URL", "http://localhost:54321")
  ),
  PUBLIC_SUPABASE_KEY: getEnvVar("PUBLIC_SUPABASE_KEY", getEnvVar("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key")),
  SUPABASE_URL: getEnvVar("SUPABASE_URL", "http://localhost:54321"),
  SUPABASE_KEY: getEnvVar("SUPABASE_KEY", "test-anon-key"),
  OPENROUTER_API_KEY: getEnvVar("OPENROUTER_API_KEY", "test-api-key"),
};

export default defineConfig({
  plugins: [react()],
  envPrefix: ["PUBLIC_", "VITE_"], // Automatically expose PUBLIC_* and VITE_* vars
  define: {
    // Explicitly define environment variables for import.meta.env
    // This replaces import.meta.env.VAR_NAME at compile time with the actual value
    "import.meta.env.PUBLIC_SUPABASE_URL": JSON.stringify(testEnv.PUBLIC_SUPABASE_URL),
    "import.meta.env.PUBLIC_SUPABASE_KEY": JSON.stringify(testEnv.PUBLIC_SUPABASE_KEY),
    "import.meta.env.SUPABASE_URL": JSON.stringify(testEnv.SUPABASE_URL),
    "import.meta.env.SUPABASE_KEY": JSON.stringify(testEnv.SUPABASE_KEY),
    "import.meta.env.OPENROUTER_API_KEY": JSON.stringify(testEnv.OPENROUTER_API_KEY),
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["**/*.{test,spec}.{js,ts,jsx,tsx}"],
    exclude: [
      "node_modules",
      "dist",
      ".astro",
      "**/meal-plan-form.validation.test.ts", // Removed - validation now handled by Zod + RHF
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "src/test/",
        "**/*.d.ts",
        "**/*.config.*",
        "**/mockData",
        "**/*.spec.ts",
        "**/*.test.ts",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
