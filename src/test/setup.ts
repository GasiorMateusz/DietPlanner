import "@testing-library/jest-dom";
import { vi } from "vitest";

// Global test utilities and mocks

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:54321";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";

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
