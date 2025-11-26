# Unit Tests Plan for Multi-Day Meal Plans - Business Logic

## Overview

This plan outlines the creation of comprehensive unit tests for multi-day meal plan business logic. The tests will focus on pure business logic functions that can be tested in isolation, preparing for future refactoring.

## Test Files Structure

```
.ai/multi-day/
├── tests/
│   └── unit/
│       ├── multi-day-plan.service.test.ts
│       ├── validation/
│       │   └── multi-day-plans.schemas.test.ts
│       └── utils/
│           └── multi-day-plan-parser.test.ts
```

## 1. Parser Tests

**File**: `.ai/multi-day/tests/unit/utils/multi-day-plan-parser.test.ts`

**Function**: `parseJsonMultiDayPlan`

**Test Cases**:
- ✅ Parses complete valid multi-day plan with 1-7 days
- ✅ Handles optional day names
- ✅ Maps JSON fields (protein/fat/carb → p/f/c)
- ✅ Rounds decimal values correctly
- ✅ Validates day_number range (1-7)
- ✅ Validates summary.number_of_days matches days length
- ✅ Validates daily_summary structure for each day
- ✅ Validates meals array structure
- ✅ Throws error for missing multi_day_plan key
- ✅ Throws error for empty days array
- ✅ Throws error for invalid day_number
- ✅ Throws error for missing daily_summary
- ✅ Throws error for missing/empty meals
- ✅ Throws error for malformed JSON
- ✅ Extracts JSON from messages with extra text
- ✅ Handles messages starting with JSON
- ✅ Handles messages with JSON in middle

## 2. Validation Schema Tests

**File**: `.ai/multi-day/tests/unit/validation/multi-day-plans.schemas.test.ts`

**Schemas to Test**:
- `multiDayStartupFormDataSchema`
- `createMultiDayPlanSchema`
- `updateMultiDayPlanSchema`
- `listMultiDayPlansQuerySchema`
- `exportMultiDayPlanQuerySchema`

**Test Cases**:

### multiDayStartupFormDataSchema
- ✅ Validates number_of_days (1-7, integer)
- ✅ Validates ensure_meal_variety (boolean, default true)
- ✅ Validates different_guidelines_per_day (boolean, default false)
- ✅ Requires per_day_guidelines when different_guidelines_per_day is true
- ✅ Validates per_day_guidelines max length (2000)
- ✅ Inherits mealPlanStartupDataSchema validations

### createMultiDayPlanSchema
- ✅ Validates name (min 1, max 255, required)
- ✅ Validates source_chat_session_id (UUID, required)
- ✅ Validates number_of_days (1-7, required)
- ✅ Validates common_exclusions_guidelines (max 2000, nullable)
- ✅ Validates common_allergens (array of strings, nullable)
- ✅ Validates day_plans array (min 1, required)
- ✅ Validates each day_plan.day_number (1-7)
- ✅ Validates each day_plan.plan_content structure
- ✅ Validates each day_plan.startup_data structure

### updateMultiDayPlanSchema
- ✅ All fields optional
- ✅ Validates name when provided
- ✅ Validates day_plans when provided
- ✅ Validates common_exclusions_guidelines when provided
- ✅ Validates common_allergens when provided

### listMultiDayPlansQuerySchema
- ✅ Validates search (max 100, optional)
- ✅ Validates sort (enum, default: updated_at)
- ✅ Validates order (enum, default: desc)

### exportMultiDayPlanQuerySchema
- ✅ Validates format (enum: doc/html, required)
- ✅ Validates boolean flags (default: true)

## 3. Service Function Tests

**File**: `.ai/multi-day/tests/unit/multi-day-plan.service.test.ts`

**Functions to Test**:
- `listMultiDayPlans`
- `createMultiDayPlan`
- `getMultiDayPlanById`
- `updateMultiDayPlan`
- `deleteMultiDayPlan`

### listMultiDayPlans Tests
- ✅ Returns empty array when no plans exist
- ✅ Returns all plans for user
- ✅ Filters by search term (case-insensitive)
- ✅ Sorts by created_at (asc/desc)
- ✅ Sorts by updated_at (asc/desc)
- ✅ Sorts by name (asc/desc)
- ✅ Handles database errors
- ✅ Filters by user_id correctly

### createMultiDayPlan Tests
- ✅ Creates multi-day plan successfully
- ✅ Creates all day plans
- ✅ Marks day plans with is_day_plan = true
- ✅ Links day plans via junction table
- ✅ Sorts days by day_number in response
- ✅ Generates default day names when missing
- ✅ Handles day_number validation (1-7)
- ✅ Handles database error during plan creation
- ✅ Handles database error during day plan creation
- ✅ Handles database error during day plan linking
- ✅ Handles database error during is_day_plan update

### getMultiDayPlanById Tests
- ✅ Returns plan with all linked day plans
- ✅ Sorts days by day_number
- ✅ Parses common_allergens as array
- ✅ Parses common_allergens as JSON string
- ✅ Handles null common_allergens
- ✅ Throws NotFoundError when plan doesn't exist
- ✅ Throws NotFoundError when plan has no day links
- ✅ Handles database errors
- ✅ Validates user ownership

### updateMultiDayPlan Tests
- ✅ Updates plan name only
- ✅ Updates common_exclusions_guidelines only
- ✅ Updates common_allergens only
- ✅ Replaces all day plans when day_plans provided
- ✅ Deletes old day plans before creating new ones
- ✅ Updates number_of_days correctly
- ✅ Handles partial updates (some fields)
- ✅ Throws NotFoundError when plan doesn't exist
- ✅ Handles database errors during update
- ✅ Handles database errors during day plan deletion
- ✅ Handles database errors during day plan creation

### deleteMultiDayPlan Tests
- ✅ Deletes plan and all linked day plans
- ✅ Handles plans with no day links
- ✅ Throws NotFoundError when plan doesn't exist
- ✅ Handles database errors during day plan deletion
- ✅ Handles database errors during plan deletion
- ✅ Validates user ownership

## Mocking Strategy

### Supabase Client Mocking
- Mock Supabase client methods (from, select, eq, etc.)
- Return controlled responses for success cases
- Return error responses for error cases
- Mock chainable query builder

### Service Dependencies
- Mock `MealPlanService.createMealPlan`
- Mock `MealPlanService.getMealPlanById`
- Mock `MealPlanService.deleteMealPlan`

### Test Fixtures
Create reusable fixtures for:
- Valid multi-day plan commands
- Valid day plan structures
- Valid JSON responses from AI
- Invalid data for error cases
- Mock Supabase responses

## Implementation Order

1. **Parser Tests** (Priority: High)
   - Pure functions, no dependencies
   - Easiest to implement
   - Foundation for other tests

2. **Validation Schema Tests** (Priority: High)
   - Tests Zod schemas directly
   - Medium complexity
   - No external dependencies

3. **Service Tests** (Priority: Medium)
   - Requires Supabase mocking
   - Most complex
   - Requires MealPlanService mocking

## Success Criteria

- ✅ All business logic functions have test coverage
- ✅ Edge cases and error scenarios tested
- ✅ Tests are isolated (no database dependencies)
- ✅ Tests follow existing project patterns (Vitest)
- ✅ Tests can run independently
- ✅ Tests provide clear failure messages
- ✅ Test coverage > 80% for business logic

## Notes

- Focus on business logic, not database operations
- Use mocks to isolate units under test
- Test error handling paths thoroughly
- Test data transformations (JSON mapping, sorting)
- Test validation rules comprehensively
- Prepare for refactoring by ensuring tests catch regressions

## Reference Files

### Source Files to Test
- `src/lib/multi-day-plans/multi-day-plan.service.ts` - Service functions
- `src/lib/validation/meal-plans.schemas.ts` - Validation schemas
- `src/lib/utils/meal-plan-parser.ts` - Parser functions (parseJsonMultiDayPlan)

### Existing Test Examples
- `src/test/unit/lib/utils/meal-plan-parser.test.ts` - Parser test pattern
- `src/test/unit/lib/utils/meal-plan-calculations.test.ts` - Calculation test pattern
- `src/test/unit/lib/account/account.service.test.ts` - Service test pattern with mocking

### Test Configuration
- `vitest.config.ts` - Test configuration
- `src/test/setup.ts` - Test setup file

## Test Data Examples

### Valid Multi-Day Plan JSON
```json
{
  "multi_day_plan": {
    "days": [
      {
        "day_number": 1,
        "name": "Day 1",
        "meal_plan": {
          "daily_summary": {
            "kcal": 2000,
            "proteins": 150,
            "fats": 65,
            "carbs": 250
          },
          "meals": [
            {
              "name": "Breakfast",
              "ingredients": "Eggs, toast",
              "preparation": "Cook eggs",
              "summary": {
                "kcal": 500,
                "protein": 30,
                "fat": 20,
                "carb": 50
              }
            }
          ]
        }
      }
    ],
    "summary": {
      "number_of_days": 1,
      "average_kcal": 2000,
      "average_proteins": 150,
      "average_fats": 65,
      "average_carbs": 250
    }
  }
}
```

### Valid Create Command
```typescript
{
  name: "Test Plan",
  source_chat_session_id: "uuid-here",
  number_of_days: 3,
  common_exclusions_guidelines: "No dairy",
  common_allergens: ["peanuts"],
  day_plans: [
    {
      day_number: 1,
      name: "Day 1",
      plan_content: { /* ... */ },
      startup_data: { /* ... */ }
    }
  ]
}
```

## Next Steps

1. Create test directory structure
2. Set up test fixtures and helpers
3. Implement parser tests first
4. Implement validation schema tests
5. Implement service tests with proper mocking
6. Run tests and ensure all pass
7. Check test coverage
8. Refine tests based on coverage gaps

