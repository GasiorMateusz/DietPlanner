# Testing Setup

This project uses a comprehensive testing strategy with Vitest for unit/integration tests and Playwright for E2E tests.

## Test Structure

```
src/test/
├── e2e/           # End-to-end tests (Playwright)
├── unit/          # Unit tests (Vitest)
├── integration/   # Integration tests (Vitest)
├── mocks/         # Mock data and MSW handlers
└── utils/         # Testing utilities

```

## Available Test Commands

### Unit Tests

- `npm run test:unit` - Run all unit tests once
- `npm run test:watch` - Run tests in watch mode
- `npm run test:ui` - Open Vitest UI for test visualization

### Integration Tests

- `npm run test:integration` - Run all integration tests

### E2E Tests

- `npm run test:e2e` - Run all Playwright E2E tests
- `npm run test:e2e:ui` - Open Playwright UI
- `npm run test:e2e:debug` - Run tests in debug mode
- `npm run test:e2e:headed` - Run tests with visible browser

### Coverage

- `npm run test:coverage` - Generate coverage report

### Run All Tests

- `npm run test:all` - Run all test suites sequentially

## Testing Guidelines

### Vitest (Unit/Integration)

#### Best Practices

- Use `vi` object for test doubles (`vi.fn()`, `vi.spyOn()`, `vi.stubGlobal()`)
- Leverage `vi.mock()` factory patterns for mocking modules
- Use `vi.useFakeTimers()` with `act()` for testing time-dependent code
- Create setup files in `src/test/utils/` for reusable configuration
- Use inline snapshots for readable assertions
- Handle optional dependencies with conditional mocking

#### Example

```typescript
import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";

describe("MyComponent", () => {
  it("should work correctly", () => {
    const { result } = renderHook(() => useMyHook());
    expect(result.current).toBe("expected");
  });
});
```

### Playwright (E2E)

#### Best Practices

- Use browser contexts for isolating test environments
- Implement Page Object Model for maintainable tests
- Use locators for resilient element selection
- Leverage API testing for backend validation
- Use visual comparison with `expect(page).toHaveScreenshot()`
- Use the codegen tool for recording tests: `npx playwright codegen`

#### Example

```typescript
import { test, expect } from "@playwright/test";

test("should load homepage", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/DietPlanner/);
});
```

## MSW (Mock Service Worker)

MSW is set up for API mocking in unit tests. Handlers are defined in `src/test/mocks/handlers.ts`.

To use MSW in your tests:

```typescript
import { server } from "@/test/mocks/server";

test("mocks API call", () => {
  server.use(
    http.get("/api/users", () => {
      return HttpResponse.json({ users: [] });
    })
  );
});
```

## Test Utilities

Custom render function with providers:

```typescript
import { render } from '@/test/utils/test-utils';

render(<MyComponent />);
```

## Coverage Configuration

Coverage thresholds are configured in `vitest.config.ts`. Current exclusions:

- `node_modules/`
- `src/test/`
- `**/*.d.ts`
- `**/*.config.*`
