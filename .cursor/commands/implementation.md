Your task is to implement a frontend view based on the provided implementation plan and project rules. Your goal is to create a detailed and accurate implementation that conforms to the plan, correctly represents the component structure, integrates with the API, and handles all specified user interactions.

## Required Information

Before starting, please provide:

1. **Implementation Plan**: Please attach or reference the implementation plan document (e.g., `.ai/[feature]-implementation-plan.md`)
2. **Any additional context**: Any specific requirements, constraints, or clarifications needed for this implementation

## Project Context

Before implementing, review the following project documentation and rules:

### Project Overview
- `@.ai/docs/project-summary.md` - Complete project overview, structure, and patterns

### Type Definitions
- `@src/types.ts` - All TypeScript types, DTOs, and interfaces used throughout the application

### Implementation Rules
The following rule files contain guidelines that must be followed during implementation:

- `@.cursor/rules/shared.mdc` - Core project rules (tech stack, structure, coding practices)
- `@.cursor/rules/frontend.mdc` - Frontend guidelines (Astro, Tailwind, accessibility)
- `@.cursor/rules/astro.mdc` - Astro-specific guidelines (pages, API routes, middleware)
- `@.cursor/rules/react.mdc` - React guidelines (components, hooks, optimization)
- `@.cursor/rules/ui-shadcn-helper.mdc` - Shadcn/ui component guidelines
- `@.cursor/rules/backend.mdc` - Backend guidelines (Supabase, validation)
- `@.cursor/rules/api-supabase-astro-init.mdc` - Supabase integration patterns

## Implementation Approach

**Important**: Implement incrementally:

1. Work on a maximum of 3 steps from the implementation plan
2. Briefly summarize what you've done
3. Describe the plan for the next 3 actions
4. **Stop and wait for feedback** before continuing

This iterative approach ensures the implementation stays aligned with requirements and allows for adjustments along the way.

## Implementation Checklist

When implementing, carefully analyze the implementation plan and follow these steps:

### 1. Component Structure
   - Identify all components listed in the implementation plan
   - Create a hierarchical structure of these components
   - Ensure that each component's responsibilities and relationships are clearly defined
   - Verify component placement follows project structure (React components in `src/components/`, Astro layouts in `src/layouts/`, etc.)

### 2. API Integration
   - Identify all API endpoints listed in the plan
   - Review existing API client utilities in `src/lib/api/`
   - Implement necessary API calls using established patterns
   - Handle API responses and update component state accordingly
   - Ensure proper error handling (401 redirects, validation errors, etc.)

### 3. User Interactions
   - List all user interactions specified in the implementation plan
   - Implement event handlers for each interaction
   - Ensure that each interaction triggers the appropriate action or state change
   - Verify accessibility (keyboard navigation, ARIA attributes, focus management)

### 4. State Management
   - Identify required state for each component
   - Use local state (`useState`) for component-specific state
   - Use custom hooks (`src/components/hooks/`) for reusable logic
   - Use React Context for global state (TranslationProvider, ThemeProvider)
   - Ensure that state changes trigger necessary re-renders
   - Apply memoization (`useMemo`, `useCallback`, `React.memo`) where appropriate

### 5. Styling and Layout
   - Apply Tailwind CSS utility classes as specified in the plan
   - Follow Shadcn/ui component patterns and theming
   - Ensure dark mode support using `dark:` variant
   - Ensure responsiveness if required by the plan
   - Use CSS variables for theming (Shadcn/ui pattern)

### 6. Error Handling and Edge Cases
   - Implement error handling for API calls (401, 400, 500 responses)
   - Handle network errors with user-friendly messages
   - Consider and handle potential edge cases listed in the plan
   - Use early returns and guard clauses for error conditions
   - Implement proper error logging

### 7. Performance Optimization
   - Implement any performance optimizations specified in the plan or rules
   - Use React.memo() for components that receive stable props
   - Use useCallback() for event handlers passed as props
   - Use useMemo() for expensive calculations
   - Ensure efficient rendering and minimal unnecessary re-renders
   - Consider code splitting for large components

### 8. Type Safety
   - Use types from `src/types.ts` for all DTOs and entities
   - Ensure proper TypeScript typing throughout
   - Use Zod schemas for runtime validation
   - Verify type compatibility with API endpoints

### 9. Internationalization (i18n)
   - Use `useTranslation()` hook for all user-facing text
   - Add translation keys to `src/lib/i18n/translations/en.json` and `pl.json`
   - Ensure language switching works correctly

### 10. Testing (if specified)
   - If specified in the plan, implement unit tests for components and functions
   - Use Vitest and React Testing Library following `.cursor/rules/vitest-unit-testing.mdc`
   - Thoroughly test all user interactions and API integrations
   - Use MSW for API mocking in tests

## Important Guidelines

Throughout the implementation process:

- **Strictly adhere to the provided implementation rules** - These rules take precedence over any general best practices that may conflict with them
- **Follow the project structure** - Place files in the correct directories as defined in `project-summary.md`
- **Use established patterns** - Review existing similar components to maintain consistency
- **Ensure accessibility** - Follow ARIA best practices from `frontend.mdc`
- **Handle errors early** - Use guard clauses and early returns for error conditions
- **Maintain type safety** - Use types from `src/types.ts` and ensure proper TypeScript typing

## Verification

Before completing each iteration, verify that:

1. ✅ The implementation accurately reflects the provided implementation plan
2. ✅ All specified rules are followed
3. ✅ Component structure matches the plan
4. ✅ API integration follows established patterns
5. ✅ User interactions work as specified
6. ✅ Error handling is properly implemented
7. ✅ Types are correctly used throughout
8. ✅ Code follows project conventions (naming, structure, formatting)

Ensure that your implementation accurately reflects the provided implementation plan and adheres to all specified rules. Pay special attention to component structure, API integration, handling of user interactions, and type safety.
