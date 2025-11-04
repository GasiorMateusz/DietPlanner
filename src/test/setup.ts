import "@testing-library/jest-dom";
import { vi } from "vitest";

// Global test utilities and mocks

// Set environment variables BEFORE any modules are imported
// These are used by vitest.config.ts to populate import.meta.env
// You can override these via process.env before running tests
process.env.PUBLIC_SUPABASE_URL =
  process.env.PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:54321";
process.env.PUBLIC_SUPABASE_KEY =
  process.env.PUBLIC_SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "test-anon-key";
process.env.SUPABASE_URL = process.env.SUPABASE_URL || "http://localhost:54321";
process.env.SUPABASE_KEY = process.env.SUPABASE_KEY || "test-anon-key";
process.env.OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "test-api-key";

// MSW server setup can be imported in tests that need it
// import { server } from './mocks/server';
// beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
// afterEach(() => server.resetHandlers());
// afterAll(() => server.close());

// Global mocks can be added here
// Example: vi.mock('@/lib/supabase', () => ({ ... }));

// Suppress console errors in tests (uncomment if needed)
// global.console = {
//   ...console,
//   error: vi.fn(),
// };
