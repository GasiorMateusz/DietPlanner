# Unit Test Analysis: DailySummaryStaticDisplay Fragment

## Summary

This document analyzes which elements from the `DailySummaryStaticDisplay` component tree are worth testing with unit tests, their priority, and rationale.

## Already Tested ✅

The following utilities from this fragment already have comprehensive test coverage:

- **`meal-plan-parser.ts`** - Extensive tests (1054 lines)
  - `parseXmlMealPlan()` - Complete coverage
  - `extractComments()` - Complete coverage
  - `removeXmlTags()` - Complete coverage

- **`chat-helpers.ts`** - All utility functions tested
  - `extractCurrentMealPlan()` - Complete coverage
  - `validateChatMessage()` - Complete coverage
  - `createStateBridge()` - Complete coverage
  - `getChatErrorMessage()` - Complete coverage

- **`lib/utils.ts`** (cn function) - Basic tests exist

## Worth Testing (Prioritized)

### 🔴 High Priority

#### 1. **MealPlanEditor Component - Validation Logic**

**File:** `src/components/MealPlanEditor.tsx`

**What to test:**

- `validateForm()` function (lines 224-240)
  - Empty plan name
  - Zero meals
  - Meals with empty names
  - Valid form state

**Why:**

- Pure function, easy to test
- Critical business logic (prevents invalid data submission)
- High risk if broken (would allow invalid meal plans)
- Low complexity, high ROI

**Test approach:**

```typescript
// Extract validateForm as pure function or test via component
describe("MealPlanEditor.validateForm", () => {
  it("should reject empty plan name");
  it("should reject zero meals");
  it("should reject meals with empty names");
  it("should accept valid form");
});
```

---

#### 2. **MealPlanEditor Component - Daily Summary Calculation Logic**

**File:** `src/components/MealPlanEditor.tsx`

**What to test:**

- Daily summary fallback calculation in `loadMealPlanFromBridge()` (lines 460-483)
  - Calculation from `target_kcal` and `target_macro_distribution`
  - Protein calculation: `(kcal * p_perc) / 100 / 4`
  - Fat calculation: `(kcal * f_perc) / 100 / 9`
  - Carb calculation: `(kcal * c_perc) / 100 / 4`
  - Edge cases: missing data, null values, zero values

**Why:**

- Contains mathematical calculations prone to errors
- Used when XML parsing doesn't provide daily summary
- Incorrect calculations would mislead users about nutrition
- Pure logic that can be isolated and tested

**Test approach:**

```typescript
// Extract calculation logic into pure function
describe("calculateDailySummaryFromTargets", () => {
  it("should calculate correctly from target_kcal and macro distribution");
  it("should handle missing target_kcal");
  it("should handle missing macro distribution");
  it("should round values correctly");
  it("should handle zero values");
});
```

---

#### 3. **DailySummaryStaticDisplay Component**

**File:** `src/components/DailySummaryStaticDisplay.tsx`

**What to test:**

- Renders all four nutritional values (kcal, proteins, fats, carbs)
- Displays correct units ("g" for proteins/fats/carbs, none for kcal)
- Handles zero values
- Handles large numbers
- Accessibility (proper heading structure)

**Why:**

- Simple but critical display component
- Used in two important contexts (AIChatInterface, MealPlanEditor)
- Easy to test with React Testing Library
- Catches display bugs early

**Test approach:**

```typescript
describe("DailySummaryStaticDisplay", () => {
  it("should render all nutritional values");
  it("should display correct units");
  it("should handle zero values");
  it("should format large numbers correctly");
});
```

---

### 🟡 Medium Priority

#### 4. **MealPlanEditor Component - State Management Logic**

**File:** `src/components/MealPlanEditor.tsx`

**What to test:**

- `handleMealAdd()` - Adds meal with correct structure
- `handleMealRemove()` - Removes correct meal, prevents removing last meal
- `handleMealChange()` - Updates correct field of correct meal
- `handlePlanNameChange()` - Updates plan name correctly
- `isFormReady()` - Returns correct boolean based on state

**Why:**

- State mutations are error-prone
- Complex state structure with nested objects
- Used frequently during user interactions
- Bugs would cause data loss or corruption

**Test approach:**

```typescript
// Test via React Testing Library or extract pure state update functions
describe("MealPlanEditor state management", () => {
  it("should add meal with correct structure");
  it("should remove meal at correct index");
  it("should prevent removing last meal");
  it("should update meal field correctly");
  it("should track form ready state");
});
```

---

#### 5. **AIChatInterface Component - State Management**

**File:** `src/components/AIChatInterface.tsx`

**What to test:**

- Message submission flow (optimistic updates)
- Error handling and rollback
- Auto-scroll behavior (via ref)
- Current meal plan extraction via `useMemo`

**Why:**

- Complex state with optimistic updates
- Error recovery logic
- User experience critical (message handling)
- Requires mocking fetch/API calls

**Test approach:**

```typescript
// Requires significant setup with MSW or fetch mocking
describe("AIChatInterface", () => {
  it("should add user message optimistically");
  it("should rollback on API error");
  it("should extract meal plan from messages");
  // More complex integration-style tests
});
```

**Note:** This is medium priority because it requires more setup complexity and might be better suited for integration/E2E tests.

---

#### 6. **MealCard Component - Callback Handling**

**File:** `src/components/MealCard.tsx`

**What to test:**

- Calls `onNameChange` with correct index and value
- Calls `onIngredientsChange` with correct index and value
- Calls `onPreparationChange` with correct index and value
- Calls `onRemove` with correct index
- `isRemoveable` prop controls button visibility

**Why:**

- Ensures parent component receives correct events
- Simple component but critical for editor functionality
- Easy to test with React Testing Library

**Test approach:**

```typescript
describe("MealCard", () => {
  it("should call onChange callbacks with correct values");
  it("should show remove button when isRemoveable is true");
  it("should hide remove button when isRemoveable is false");
});
```

---

### 🟢 Low Priority / Not Recommended

#### 7. **MealCardReadOnly Component**

**File:** `src/components/MealCardReadOnly.tsx`

**Why skip:**

- Pure presentation component
- No logic, just conditional rendering
- Simple enough that bugs would be caught in E2E tests
- Low risk component

**Alternative:** Test via E2E when testing AIChatInterface.

---

#### 8. **MealPlanEditor - API Integration**

**File:** `src/components/MealPlanEditor.tsx`

**Functions:** `loadMealPlanFromApi()`, `handleSave()`, `handleExport()`

**Why skip for unit tests:**

- Heavy integration with fetch API
- Requires mocking multiple dependencies
- Better suited for integration/E2E tests
- Would require extensive mocking setup

**Alternative:** Test via integration tests or E2E tests.

---

#### 9. **AIChatInterface - API Integration**

**File:** `src/components/AIChatInterface.tsx`

**Functions:** `createAiSession()`, `sendMessage()`, initialization logic

**Why skip for unit tests:**

- Complex async flows
- Requires sessionStorage mocking
- Requires fetch/API mocking
- Better suited for integration/E2E tests

**Alternative:** Test via integration tests or E2E tests.

---

## Testing Strategy Recommendations

### Immediate Actions (High Priority)

1. **Extract validation logic** from `MealPlanEditor` into a pure function

   ```typescript
   // src/lib/validation/meal-plan.schemas.ts or similar
   export function validateMealPlanForm(state: MealPlanEditorState): string | null;
   ```

2. **Extract calculation logic** into a pure function

   ```typescript
   // src/lib/utils/meal-plan-calculations.ts
   export function calculateDailySummaryFromTargets(
     targetKcal: number | null,
     macroDistribution: TargetMacroDistribution | null
   ): MealPlanContentDailySummary;
   ```

3. **Test `DailySummaryStaticDisplay`** - Simple component test

### Medium-Term Actions

4. Test state management functions in `MealPlanEditor` (via component tests)
5. Test `MealCard` callback handling
6. Consider integration tests for API-dependent logic

### Testing Tools Needed

- **React Testing Library** - For component rendering tests
- **Vitest** - Already configured ✓
- **MSW (Mock Service Worker)** - Already configured ✓ (for API mocking if needed)
- **@testing-library/user-event** - For user interaction simulation

## Summary Table

| Component/Function             | Priority  | Complexity | ROI      | Recommendation  |
| ------------------------------ | --------- | ---------- | -------- | --------------- |
| `validateForm()`               | 🔴 High   | Low        | High     | Extract & test  |
| Daily summary calculation      | 🔴 High   | Medium     | High     | Extract & test  |
| `DailySummaryStaticDisplay`    | 🔴 High   | Low        | Medium   | Component test  |
| `MealPlanEditor` state updates | 🟡 Medium | Medium     | Medium   | Component test  |
| `MealCard` callbacks           | 🟡 Medium | Low        | Medium   | Component test  |
| `AIChatInterface` state        | 🟡 Medium | High       | Low      | Integration/E2E |
| `MealCardReadOnly`             | 🟢 Low    | Very Low   | Very Low | Skip / E2E      |
| API integration logic          | 🟢 Low    | Very High  | Low      | Integration/E2E |

## Conclusion

Focus unit testing efforts on:

1. **Pure functions** (validation, calculations) - Easy to test, high value
2. **Simple presentation components** (`DailySummaryStaticDisplay`) - Quick wins
3. **State management logic** - Medium complexity, good ROI

Defer complex integration scenarios (API calls, browser APIs like sessionStorage) to integration or E2E tests where the full stack can be tested together.
