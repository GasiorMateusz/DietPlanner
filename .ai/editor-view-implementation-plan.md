# View Implementation Plan: Meal Plan Editor

## 1. Overview

The Meal Plan Editor is a React component that allows dietitians to manually edit, finalize, and save meal plans. It operates in two modes: **Create Mode** (new meal plan from AI chat) and **Edit Mode** (modify existing meal plan). The component provides a structured form interface with editable fields for each meal, a static summary of daily nutritional values, and controls to add/remove meals. All fields are editable, with the exception of nutritional summary values which remain static as per PRD requirements. The component integrates with the REST API to save new meal plans or update existing ones, and includes optional export functionality for saved plans.

## 2. View Routing

- **Create Mode**: `/app/editor` (no ID parameter)
- **Edit Mode**: `/app/editor/{id}` (with UUID as parameter)
- **Astro Page**: `src/pages/app/editor.astro` or `src/pages/app/editor/[id].astro`
- **Component**: `src/components/MealPlanEditor.tsx` (React component with `client:load` hydration)

## 3. Component Structure

```
MealPlanEditor (Main Container)
├── LoadingState / EmptyState (when data not available)
├── ErrorState (if initialization fails)
└── FormContent (Main Edit Form)
    ├── PlanNameInput (Required field for meal plan name)
    ├── DailySummaryStaticDisplay (Read-only nutritional summary)
    ├── MealCard[] (Repeatable meal editor components)
    │   ├── MealNameInput (Editable)
    │   ├── IngredientsTextarea (Editable)
    │   ├── PreparationTextarea (Editable)
    │   └── MealSummaryStaticDisplay (Read-only for this meal)
    ├── MealManagementActions
    │   ├── AddMealButton (Adds new meal card)
    │   └── RemoveMealButton (Removes meal card, disabled when only 1 meal)
    └── FormActions
        ├── SaveButton (Disabled until name is filled, calls POST or PUT)
        ├── ExportButton (Visible only in Edit Mode)
        └── CancelButton (Navigate back to dashboard)
```

## 4. Component Details

### MealPlanEditor

- **Component Description**: Main React component that manages the entire editor state, handles data loading, form validation, and submission.

- **Main Elements**:
  - Loading skeleton/state display
  - Error alert display
  - Form container with all child components
  - React state for meals array and plan metadata

- **Handled Interactions**:
  - `useEffect` for initialization: Loads data from window variable (Create Mode) or fetches from API (Edit Mode)
  - `handleMealAdd`: Adds a new blank meal card to the array
  - `handleMealRemove`: Removes a meal card by index
  - `handleMealChange`: Updates a specific meal's field value
  - `handlePlanNameChange`: Updates the plan name
  - `handleSave`: Validates form, calls POST (Create) or PUT (Update) API, handles success/error
  - `handleExport`: Navigates to export URL or triggers download
  - `handleCancel`: Navigates back to dashboard

- **Handled Validation**:
  - **Plan name**: Required, non-empty string (validates per `createMealPlanSchema` or `updateMealPlanSchema`)
  - **Minimum meals**: At least 1 meal must exist (validates per `mealPlanContentSchema`)
  - **Each meal**: Name is required, non-empty string (validates per `mealPlanMealSchema`)
  - **Ingredients field**: Required string (can be empty), no length limit
  - **Preparation field**: Required string (can be empty), no length limit
  - **Daily summary**: Read-only, no validation (display only)
  - Save button is disabled when:
    - Plan name is empty or not filled
    - Any meal name is empty
    - Form is currently submitting

- **Types**:
  - **Props**: None (component reads from props/via URL params or window state)
  - **Internal State Type**: `MealPlanEditorState` (see Types section)
  - **API Response Types**: `GetMealPlanByIdResponseDto` (Edit Mode), `CreateMealPlanResponseDto`, `UpdateMealPlanResponseDto`
  - **Command Types**: `CreateMealPlanCommand`, `UpdateMealPlanCommand`

- **Props**: None required (see alternative approach below)

**Alternative Props Approach**: The component can optionally accept a `mealPlanId` prop via Astro props, or read it from the URL. Recommended approach: use Astro dynamic route with optional `[id]` param.

### MealCard

- **Component Description**: Repeatable component representing a single meal within the meal plan. Contains editable fields for name, ingredients, and preparation, plus a read-only summary display.

- **Main Elements**:
  - Label and Input for meal name
  - Label and Textarea for ingredients
  - Label and Textarea for preparation
  - Static display of meal summary (kcal, P/F/C)
  - Optional remove button

- **Handled Interactions**:
  - `onNameChange`: Updates meal name value
  - `onIngredientsChange`: Updates ingredients value
  - `onPreparationChange`: Updates preparation value
  - `onRemove`: Triggers meal removal (if more than 1 meal exists)

- **Handled Validation**:
  - **Meal name**: Required, non-empty (client-side check before save)
  - Individual field changes trigger validation on blur or during save

- **Types**:
  - **Props**: `MealCardProps` (see Types section)
  - **Meal Data Type**: `MealPlanMeal`

- **Props**:
  ```typescript
  interface MealCardProps {
    meal: MealPlanMeal;
    mealIndex: number;
    isRemoveable: boolean;
    onNameChange: (index: number, value: string) => void;
    onIngredientsChange: (index: number, value: string) => void;
    onPreparationChange: (index: number, value: string) => void;
    onRemove: (index: number) => void;
  }
  ```

### DailySummaryStaticDisplay

- **Component Description**: Read-only display component showing the daily nutritional summary (total kcal, proteins, fats, carbs).

- **Main Elements**:
  - Heading: "Daily Summary"
  - Read-only value displays for kcal, proteins (g), fats (g), carbs (g)
  - Optional percentage values for macros

- **Handled Interactions**: None

- **Handled Validation**: None (read-only)

- **Types**:
  - **Props**: `MealPlanContentDailySummary`

- **Props**:
  ```typescript
  interface DailySummaryProps {
    summary: MealPlanContentDailySummary;
  }
  ```

## 5. Types

### ViewModel Types (Internal State)

```typescript
/**
 * Internal state structure for the MealPlanEditor component.
 * Represents the form state before submission to API.
 */
interface MealPlanEditorState {
  /** Whether component is in Create or Edit mode */
  mode: "create" | "edit";
  /** Loading state during initialization or save */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Meal plan name (required for save) */
  planName: string;
  /** Array of meal objects (minimum 1 required) */
  meals: MealPlanMeal[];
  /** Daily nutritional summary (read-only, from AI/initial data) */
  dailySummary: MealPlanContentDailySummary;
  /** Optional session ID from AI chat (Create Mode only) */
  sessionId?: string | null;
  /** Optional startup data for display */
  startupData?: MealPlanStartupData | null;
  /** Optional meal plan ID (Edit Mode only) */
  mealPlanId?: string;
}

/**
 * State bridge structure for passing data from AI Chat to Editor.
 * Stored in window object temporarily.
 */
interface StateBridge {
  /** Session ID from AI chat */
  sessionId: string;
  /** Last assistant message content (meal plan text) */
  lastAssistantMessage: string;
  /** Optional startup data */
  startupData?: MealPlanStartupData;
}
```

### Existing Type Usage (from types.ts)

The following types from `src/types.ts` are used:

- `MealPlanMeal`: Structure of individual meal with name, ingredients, preparation, and summary
- `MealPlanContentDailySummary`: Daily totals for kcal and macros
- `MealPlanContent`: Full meal plan structure with daily_summary and meals array
- `MealPlanStartupData`: Patient data, targets, and guidelines
- `CreateMealPlanCommand`: Request payload for POST /api/meal-plans
- `UpdateMealPlanCommand`: Request payload for PUT /api/meal-plans/{id}
- `GetMealPlanByIdResponseDto`: Response from GET /api/meal-plans/{id}
- `CreateMealPlanResponseDto`: Response from POST /api/meal-plans
- `UpdateMealPlanResponseDto`: Response from PUT /api/meal-plans/{id}

## 6. State Management

State management is handled using React's `useState` and `useEffect` hooks within the MealPlanEditor component. A custom hook is **not required** for this view, as the logic is contained and straightforward.

**State Variables**:

- `editorState` (useState): Complete `MealPlanEditorState` object
- Form-level validation is handled by checking required fields before enabling save
- No external state library needed

**Initialization Flow**:

1. `useEffect` on mount checks for `mealPlanId` in props/URL
2. **Edit Mode**: If ID exists, fetch from `GET /api/meal-plans/{id}`, populate state
3. **Create Mode**: Read `(window as any).mealPlanBridge`, populate state, clear window variable
4. If no data available, show error state

**Save Flow**:

1. User clicks "Save changes"
2. Validate: plan name filled, all meal names filled, at least 1 meal exists
3. Build command object (Create or Update)
4. Call POST or PUT API
5. On success: redirect to `/app/dashboard`
6. On error: display error message, stay on page

## 7. API Integration

### Create Mode: POST /api/meal-plans

- **Endpoint**: `POST /api/meal-plans`
- **Request Type**: `CreateMealPlanCommand`
- **Response Type**: `CreateMealPlanResponseDto` (201 Created)
- **Error Responses**: 400 (Validation failed), 401 (Unauthorized), 500 (Internal error)

**Request Body Structure**:

```json
{
  "source_chat_session_id": "uuid-string-or-null",
  "name": "Meal Plan Name",
  "plan_content": {
    "daily_summary": { "kcal": 2000, "proteins": 150, "fats": 60, "carbs": 215 },
    "meals": [
      {
        "name": "Breakfast",
        "ingredients": "Oats 50g, milk 200ml...",
        "preparation": "Mix and cook...",
        "summary": { "kcal": 400, "p": 20, "f": 10, "c": 58 }
      }
    ]
  },
  "startup_data": {
    "patient_age": 30,
    "patient_weight": 70.5,
    "patient_height": 170.0,
    "activity_level": "moderate",
    "target_kcal": 2000,
    "target_macro_distribution": { "p_perc": 30, "f_perc": 25, "c_perc": 45 },
    "meal_names": "Breakfast, Lunch, Dinner",
    "exclusions_guidelines": "Gluten-free, no nuts."
  }
}
```

### Edit Mode: GET /api/meal-plans/{id}

- **Endpoint**: `GET /api/meal-plans/{id}`
- **Path Parameter**: `id` (UUID)
- **Response Type**: `GetMealPlanByIdResponseDto` (200 OK)
- **Error Responses**: 400 (Invalid UUID), 401 (Unauthorized), 404 (Not Found), 500 (Internal error)

**Response Body**: Complete `TypedMealPlanRow` with all fields

### Edit Mode: PUT /api/meal-plans/{id}

- **Endpoint**: `PUT /api/meal-plans/{id}`
- **Path Parameter**: `id` (UUID)
- **Request Type**: `UpdateMealPlanCommand`
- **Response Type**: `UpdateMealPlanResponseDto` (200 OK)
- **Error Responses**: 400 (Validation failed), 401 (Unauthorized), 404 (Not Found), 500 (Internal error)

**Request Body Structure**: Same as Create, but all top-level fields are optional (partial update)

### Edit Mode: Export Link

- **Not implemented via API call**: The "Export to .doc" button should be a regular `<a>` tag or use `window.location.href` to navigate to `GET /api/meal-plans/{id}/export`, which triggers a browser download

**Implementation Note**: The export endpoint is specified in the API plan but may not be implemented yet. The component should handle the case where export is not available gracefully.

## 8. User Interactions

| Interaction                                            | Expected Outcome                                                                                         |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| **User types in plan name field**                      | Plan name state updates, save button becomes enabled if name is non-empty                                |
| **User types in meal name field**                      | That meal's name state updates                                                                           |
| **User types in ingredients textarea**                 | That meal's ingredients state updates                                                                    |
| **User types in preparation textarea**                 | That meal's preparation state updates                                                                    |
| **User clicks "Add Meal"**                             | New blank meal card appears at end of list with default structure                                        |
| **User clicks "Remove Meal"** (on any meal card)       | That meal card disappears from list (disabled if only 1 meal remains)                                    |
| **User clicks "Save changes"**                         | Form validates; if valid, POST/PUT API called; on success, redirect to dashboard; on error, show message |
| **User clicks "Export to .doc"** (Edit Mode only)      | Navigate to export endpoint, trigger file download                                                       |
| **User clicks "Cancel"**                               | Navigate back to `/app/dashboard`                                                                        |
| **User arrives from AI Chat** (Create Mode)            | Editor loads with AI-generated content pre-filled                                                        |
| **User clicks "Edit / View" on dashboard** (Edit Mode) | Editor loads existing meal plan for editing                                                              |

## 9. Conditions and Validation

### Client-Side Validation

**Plan Name Field**:

- **Condition**: Required, non-empty string
- **Validation**: Checked on blur and before save
- **UI Effect**: Save button disabled when empty, shows inline error if empty on blur

**Meals Array**:

- **Condition**: Minimum 1 meal required
- **Validation**: Checked before save
- **UI Effect**: Cannot remove last remaining meal (disable remove button)

**Individual Meal Fields**:

- **Condition**: Meal name is required, non-empty
- **Validation**: Checked before save
- **UI Effect**: No inline error (validated only on save attempt)

**Form Readiness**:

- **Condition**: Plan name filled AND all meal names filled AND at least 1 meal exists
- **Validation**: Computed state, checked continuously
- **UI Effect**: Save button enabled/disabled based on readiness

### API Validation (Server-Side)

**Plan Name**: Min 1 char, max 255 chars (validated by `createMealPlanSchema`/`updateMealPlanSchema`)

**Plan Content**: Must have `daily_summary` and `meals` array with at least 1 meal (validated by `mealPlanContentSchema`)

**Each Meal**: Name, ingredients, preparation are strings; summary must have positive/non-negative numeric values (validated by `mealPlanMealSchema`)

**Daily Summary**: All fields must be positive numbers (validated by `mealPlanContentDailySummarySchema`)

**Error Handling**: If API returns 400 with validation errors, display error message to user

## 10. Error Handling

| Error Scenario                             | Handling Strategy                                                                      |
| ------------------------------------------ | -------------------------------------------------------------------------------------- |
| **No bridge data available** (Create Mode) | Display error message: "No meal plan data available. Please start from the dashboard." |
| **Invalid meal plan ID** (Edit Mode)       | Display error: "Invalid meal plan ID." (before API call)                               |
| **API returns 404 Not Found** (Edit Mode)  | Display error: "Meal plan not found or you don't have access to it."                   |
| **API returns 400 Validation Failed**      | Display error: "Validation failed: {details}" with API error details                   |
| **API returns 401 Unauthorized**           | Redirect to `/login`                                                                   |
| **API returns 500 Internal Server Error**  | Display error: "An internal error occurred. Please try again later."                   |
| **Network error / API unreachable**        | Display error: "Unable to connect to server. Please check your connection."            |
| **AI message parsing fails** (Create Mode) | Display error: "Invalid meal plan data. Please try again from the dashboard."          |
| **Session ID missing** (Create Mode)       | Meal plan still saves without `source_chat_session_id`, no error                       |

**Error Display**: Use Alert component from `@/components/ui/alert` with destructive styling

**Retry Logic**: None (user must manually retry or navigate away)

## 11. Implementation Steps

1. **Create Astro page**: Create `src/pages/app/editor.astro` or `src/pages/app/editor/[id].astro` with PrivateLayout wrapper
2. **Create main component skeleton**: Create `src/components/MealPlanEditor.tsx` with basic React structure, useState for state management
3. **Implement initialization logic**: Add useEffect to handle mode detection and data loading (window variable or API fetch)
4. **Create DailySummaryStaticDisplay**: Build read-only daily summary display component
5. **Create MealCard component**: Build repeatable meal card with editable fields and remove button
6. **Implement meal management**: Add handlers for adding/removing meals, updating meal fields
7. **Implement plan name input**: Add required text input with validation
8. **Implement form actions**: Add Save, Export, Cancel buttons with proper disabled states
9. **Implement save logic**: Add validate-and-save function with POST/PUT API calls
10. **Add error handling**: Implement comprehensive error display for all error scenarios
11. **Add loading states**: Implement loading skeleton/spinner for initialization and save operations
12. **Test Create Mode**: Verify data loads from window bridge, saves successfully, redirects to dashboard
13. **Test Edit Mode**: Verify data loads from API, updates successfully, redirects to dashboard
14. **Test validation**: Verify save button disabled when required fields empty, validation errors displayed
15. **Test edge cases**: Test empty plan name, single meal removal prevention, API errors
16. **Add export functionality**: Implement export button with link to export endpoint
17. **Polish UI/UX**: Ensure proper spacing, responsive design, accessibility labels
18. **Integration testing**: Verify complete flow from AI Chat → Editor → Dashboard
19. **Code cleanup**: Remove console.logs, ensure proper TypeScript types, add JSDoc comments
20. **Final review**: Ensure compliance with PRD requirements, user stories, and API contract
