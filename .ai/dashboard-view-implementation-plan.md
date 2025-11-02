# View Implementation Plan: Dashboard

## 1. Overview

The Dashboard is the main view of the Diet Planner application, accessible after user authentication. It serves as the central hub where dietitians can view, manage, and initiate the creation of meal plans. The view displays a list of all saved meal plans with search functionality and provides access to actions such as editing, exporting, and deleting plans.

**User Story**: US-005 - Viewing saved meal plans

The Dashboard implements a "list and manage" pattern, allowing users to:
- View all their saved meal plans in a searchable list
- See an empty state when no plans exist
- Access quick actions (Edit/View, Export, Delete) for each plan
- Initiate the creation of new meal plans via a startup form dialog
- Search meal plans by name with real-time filtering

## 2. View Routing

**Path**: `/app/dashboard`

**Layout**: Private Layout (Astro) - The view must be wrapped in the Private Layout which handles authentication checks and provides navigation structure.

**Access Control**: The view is only accessible to authenticated users. The Private Layout should handle authentication verification and redirect unauthenticated users to `/login`.

## 3. Component Structure

```
Dashboard (Astro Page)
└── PrivateLayout (Astro Layout)
    └── DashboardView (React Component - Client Island)
        ├── DashboardHeader (React Component)
        │   ├── "Create new meal plan" Button
        │   └── SearchInput (React Component / Shadcn Input)
        ├── MealPlanList (React Component)
        │   ├── EmptyState (React Component) [conditional]
        │   └── MealPlanListItem (React Component) [multiple]
        │       ├── MealPlanInfo (React Component)
        │       └── MealPlanActions (React Component)
        │           ├── Edit/View Button
        │           ├── Export Link
        │           └── Delete Button
        └── Dialogs (Shadcn/ui Dialog Components)
            ├── StartupFormDialog (React Component)
            └── DeleteConfirmationDialog (React Component)
```

## 4. Component Details

### DashboardView (Main React Component)

**Component Description**: The main client-side component that orchestrates the Dashboard functionality. Manages the meal plans list state, handles API interactions, and coordinates dialog visibility.

**Main Elements**:
- Container `<div>` with Tailwind classes for layout
- `DashboardHeader` child component
- `MealPlanList` child component
- `StartupFormDialog` component (controlled visibility)
- `DeleteConfirmationDialog` component (controlled visibility)
- Loading state indicator (Spinner/Skeleton from Shadcn/ui)
- Error message display (Alert from Shadcn/ui)

**Handled Events**:
- Component mount: Fetches initial meal plans list
- Search input change: Debounced API call to filter meal plans
- Create button click: Opens `StartupFormDialog`
- Delete button click (from item): Opens `DeleteConfirmationDialog` with meal plan ID
- Dialog close events: Closes dialogs and triggers list refresh if needed
- Window focus/blur: Optionally refresh list on focus to catch external changes

**Handled Validation**:
- Search input: Client-side validation (max 100 characters, as per API schema)
- API responses: Validates response structure matches `GetMealPlansResponseDto` type
- Error responses: Handles 400 (validation errors), 401 (unauthorized), 500 (server errors)

**Types**:
- Props: None (component is self-contained)
- State: Uses `MealPlanListItemDto[]` from `types.ts` for meal plans array
- Internal state types: Loading state (`boolean`), error state (`string | null`), search query (`string`), selected meal plan ID for deletion (`string | null`)

**Props**: None

---

### DashboardHeader

**Component Description**: Header section containing the "Create new meal plan" button and search input field.

**Main Elements**:
- Container `<div>` with flexbox layout
- Button component (Shadcn/ui Button) with "Create new meal plan" text
- Input component (Shadcn/ui Input) for search functionality
- Optional icon components for visual enhancement

**Handled Events**:
- Create button click: Calls `onCreateClick` prop callback
- Search input change: Calls `onSearchChange` prop callback with current input value
- Search input debounce: Implemented via custom hook or `useDeferredValue` from React 19

**Handled Validation**:
- Search input: Trims whitespace, validates max length (100 characters)
- Input sanitization: Prevents XSS by ensuring input is treated as plain text

**Types**:
- Props:
  - `onCreateClick: () => void` - Callback when create button is clicked
  - `onSearchChange: (searchQuery: string) => void` - Callback when search input changes
  - `searchValue: string` - Controlled input value

**Props**: `onCreateClick`, `onSearchChange`, `searchValue`

---

### MealPlanList

**Component Description**: Displays the list of meal plans. Shows either an empty state message or a list of meal plan items. Handles loading and error states.

**Main Elements**:
- Container `<div>` or `<ul>` with list styling
- Conditional rendering:
  - Empty state component when `mealPlans.length === 0`
  - Multiple `MealPlanListItem` components when plans exist
- Loading skeleton/placeholder during initial fetch
- Error message display (Alert component) if fetch fails

**Handled Events**:
- None (presentational component)

**Handled Validation**:
- Validates that `mealPlans` prop is an array
- Checks for null/undefined meal plan items before rendering

**Types**:
- Props:
  - `mealPlans: MealPlanListItemDto[]` - Array of meal plans from API
  - `isLoading: boolean` - Loading state flag
  - `error: string | null` - Error message if fetch failed
  - `onEdit: (id: string) => void` - Callback when Edit button is clicked
  - `onExport: (id: string) => void` - Callback when Export link is clicked
  - `onDelete: (id: string) => void` - Callback when Delete button is clicked

**Props**: `mealPlans`, `isLoading`, `error`, `onEdit`, `onExport`, `onDelete`

---

### EmptyState

**Component Description**: Displays a message when the user has no saved meal plans. Provides visual guidance to create the first plan.

**Main Elements**:
- Container `<div>` with centered layout
- Icon or illustration (optional)
- Heading text: "You don't have any meal plans yet. Create your first plan!"
- Optional call-to-action button linking to create flow

**Handled Events**:
- Optional: Click on CTA button to trigger create action

**Handled Validation**:
- None (presentational component)

**Types**:
- Props:
  - `onCreateClick?: () => void` - Optional callback to create first plan

**Props**: `onCreateClick` (optional)

---

### MealPlanListItem

**Component Description**: Individual meal plan row in the list. Displays plan name, timestamps, and action buttons.

**Main Elements**:
- Container `<div>` or `<li>` with card/list item styling
- `MealPlanInfo` child component (displays name and metadata)
- `MealPlanActions` child component (displays action buttons)
- Hover effects and visual feedback

**Handled Events**:
- Item click (optional): Navigate to edit view or show details
- Action button clicks: Delegated to `MealPlanActions` component

**Handled Validation**:
- Validates required props (id, name) are present
- Formats timestamps for display (e.g., "2 days ago", "January 15, 2024")

**Types**:
- Props:
  - `mealPlan: MealPlanListItemDto` - Meal plan data from API
  - `onEdit: (id: string) => void` - Edit button callback
  - `onExport: (id: string) => void` - Export link callback
  - `onDelete: (id: string) => void` - Delete button callback

**Props**: `mealPlan`, `onEdit`, `onExport`, `onDelete`

---

### MealPlanInfo

**Component Description**: Displays meal plan name and metadata (creation/update dates) in a readable format.

**Main Elements**:
- Plan name as heading or text element
- Date metadata (created/updated timestamps) formatted for readability
- Optional: Display of daily summary values (kcal, macros) as preview

**Handled Events**:
- None (presentational component)

**Handled Validation**:
- Formats timestamps using date formatting utility
- Handles missing or invalid date values gracefully

**Types**:
- Props:
  - `name: string` - Meal plan name
  - `createdAt: string` - ISO timestamp string
  - `updatedAt: string` - ISO timestamp string
  - `dailySummary?: MealPlanContentDailySummary` - Optional daily summary for preview

**Props**: `name`, `createdAt`, `updatedAt`, `dailySummary` (optional)

---

### MealPlanActions

**Component Description**: Container for action buttons (Edit/View, Export, Delete) for a meal plan item.

**Main Elements**:
- Container `<div>` with flexbox layout
- Button component (Shadcn/ui Button) for "Edit / View"
- Anchor tag (`<a>`) for "Export" with download attribute
- Button component (Shadcn/ui Button, variant: destructive) for "Delete"
- Optional icon components for each action

**Handled Events**:
- Edit button click: Calls `onEdit` prop with meal plan ID
- Export link click: Navigates to export endpoint or triggers download
- Delete button click: Calls `onDelete` prop with meal plan ID

**Handled Validation**:
- Validates meal plan ID exists before triggering callbacks
- Prevents default behavior on export link if needed

**Types**:
- Props:
  - `mealPlanId: string` - UUID of the meal plan
  - `onEdit: (id: string) => void` - Edit action callback
  - `onExport: (id: string) => void` - Export action callback
  - `onDelete: (id: string) => void` - Delete action callback

**Props**: `mealPlanId`, `onEdit`, `onExport`, `onDelete`

---

### StartupFormDialog

**Component Description**: Modal dialog containing the startup form for creating a new meal plan. Collects patient data, targets, and guidelines before initiating AI generation.

**Main Elements**:
- Dialog component (Shadcn/ui Dialog)
- Form with fields:
  - Patient age (number input)
  - Patient weight (number input, kg)
  - Patient height (number input, cm)
  - Activity level (select/dropdown)
  - Target kcal (number input)
  - Target macro distribution (three number inputs for proteins, fats, carbs percentages)
  - Meal names (text input)
  - Exclusions/guidelines (textarea)
- Form validation error messages
- Submit button ("Generate") and Cancel button
- Loading state during submission

**Handled Events**:
- Form submit: Validates form, calls `onSubmit` prop with form data
- Cancel/close: Calls `onClose` prop callback
- Input changes: Updates form state and validates fields

**Handled Validation**:
- All fields validated according to `MealPlanStartupData` type constraints:
  - Age: positive integer, max 150
  - Weight: positive number, max 1000
  - Height: positive number, max 300
  - Activity level: enum (sedentary, light, moderate, high)
  - Target kcal: positive integer, max 10000
  - Macro percentages: numbers between 0-100, must sum to ~100
  - Meal names: string, max 500 characters
  - Exclusions: string, max 2000 characters
- Client-side validation using Zod schema (reuses `mealPlanStartupDataSchema`)

**Types**:
- Props:
  - `open: boolean` - Controls dialog visibility
  - `onClose: () => void` - Callback when dialog should close
  - `onSubmit: (data: MealPlanStartupData) => void` - Callback with validated form data
- Internal form state type: `MealPlanStartupData` (from `types.ts`)

**Props**: `open`, `onClose`, `onSubmit`

---

### DeleteConfirmationDialog

**Component Description**: Confirmation modal that appears when user clicks Delete on a meal plan. Requires explicit confirmation to prevent accidental deletions.

**Main Elements**:
- Dialog component (Shadcn/ui Dialog)
- Warning message: "Are you sure you want to delete this meal plan?"
- Optional: Display meal plan name in the message
- Cancel button (closes dialog without action)
- Confirm button (variant: destructive) that triggers deletion
- Loading state during deletion

**Handled Events**:
- Cancel button click: Calls `onClose` prop
- Confirm button click: Calls `onConfirm` prop with meal plan ID
- Dialog overlay click: Closes dialog (default Dialog behavior)

**Handled Validation**:
- Validates meal plan ID exists before allowing confirmation
- Prevents confirmation if deletion is in progress

**Types**:
- Props:
  - `open: boolean` - Controls dialog visibility
  - `mealPlanId: string | null` - ID of meal plan to delete (null when closed)
  - `mealPlanName?: string` - Optional name to display in confirmation message
  - `onClose: () => void` - Callback when dialog should close
  - `onConfirm: (id: string) => void` - Callback when user confirms deletion
  - `isDeleting?: boolean` - Optional loading state flag

**Props**: `open`, `mealPlanId`, `mealPlanName` (optional), `onClose`, `onConfirm`, `isDeleting` (optional)

## 5. Types

### Existing Types (from `types.ts`)

The Dashboard view uses the following existing types:

**`MealPlanListItemDto`**: The DTO returned by `GET /api/meal-plans`. Contains:
- `id: string` (UUID)
- `name: string`
- `created_at: string` (ISO timestamp)
- `updated_at: string` (ISO timestamp)
- `startup_data: MealPlanStartupData`
- `daily_summary: MealPlanContentDailySummary`

**`MealPlanStartupData`**: The startup data structure used in forms:
- `patient_age: number | null`
- `patient_weight: number | null`
- `patient_height: number | null`
- `activity_level: 'sedentary' | 'light' | 'moderate' | 'high' | null`
- `target_kcal: number | null`
- `target_macro_distribution: TargetMacroDistribution | null`
- `meal_names: string | null`
- `exclusions_guidelines: string | null`

**`MealPlanContentDailySummary`**: Daily nutritional summary:
- `kcal: number`
- `proteins: number`
- `fats: number`
- `carbs: number`

**`TargetMacroDistribution`**: Macro distribution percentages:
- `p_perc: number` (protein percentage)
- `f_perc: number` (fat percentage)
- `c_perc: number` (carbohydrate percentage)

**`GetMealPlansResponseDto`**: Array type alias for `MealPlanListItemDto[]`

### New Types (View-Specific)

No new types are required for the Dashboard view. All necessary types are already defined in `types.ts`.

### Internal Component State Types

**DashboardView State**:
```typescript
{
  mealPlans: MealPlanListItemDto[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  isStartupDialogOpen: boolean;
  deleteDialogState: {
    isOpen: boolean;
    mealPlanId: string | null;
    mealPlanName: string | null;
  };
  isDeleting: boolean;
}
```

**API Request Types**:
- Query parameters for `GET /api/meal-plans`:
  ```typescript
  {
    search?: string;      // Max 100 characters
    sort?: 'created_at' | 'updated_at' | 'name';  // Default: 'updated_at'
    order?: 'asc' | 'desc';  // Default: 'desc'
  }
  ```

## 6. State Management

The Dashboard view uses **localized React state** managed within the `DashboardView` component. No global state manager is used, following the project's architecture pattern.

### State Variables

**Primary State** (using `useState`):
- `mealPlans: MealPlanListItemDto[]` - The list of meal plans from API
- `isLoading: boolean` - Loading state during API calls
- `error: string | null` - Error message if API call fails
- `searchQuery: string` - Current search input value
- `isStartupDialogOpen: boolean` - Controls StartupFormDialog visibility
- `deleteDialogState: { isOpen: boolean; mealPlanId: string | null; mealPlanName: string | null }` - Controls DeleteConfirmationDialog state
- `isDeleting: boolean` - Loading state during deletion

### Custom Hooks

**`useMealPlansList`** (Optional, recommended for code organization):
- **Purpose**: Encapsulates API calls and state management for the meal plans list
- **Returns**:
  - `mealPlans: MealPlanListItemDto[]`
  - `isLoading: boolean`
  - `error: string | null`
  - `refetch: () => Promise<void>` - Function to manually refresh the list
  - `search: (query: string) => Promise<void>` - Function to search meal plans
- **Implementation**: Uses `fetch` API with Supabase JWT token, handles error responses, manages loading states

**`useDebounce`** (Utility hook):
- **Purpose**: Debounces search input to avoid excessive API calls
- **Parameters**: `value: string`, `delay: number` (default: 300ms)
- **Returns**: Debounced value
- **Usage**: Applied to search input before triggering API call

**`useAuthToken`** (If needed):
- **Purpose**: Retrieves Supabase JWT token for API requests
- **Returns**: `token: string | null`
- **Implementation**: Uses Supabase client SDK's `getSession()` method to extract JWT

### State Flow

1. **Initial Load**: Component mounts → `useEffect` triggers → Fetches meal plans → Updates `mealPlans` state
2. **Search**: User types → Debounced value changes → API call with search query → Updates `mealPlans` state
3. **Delete**: User clicks delete → Opens dialog → User confirms → API call → On success, refetch list → Updates `mealPlans` state
4. **Create**: User submits startup form → Dialog closes → Navigation to `/app/create` (handled by parent/router)
5. **Edit/Export**: User clicks action → Navigation or download (handled by browser/router)

## 7. API Integration

### Endpoint: `GET /api/meal-plans`

**Purpose**: Retrieves the list of meal plans for the authenticated user.

**Request**:
- **Method**: `GET`
- **URL**: `/api/meal-plans`
- **Query Parameters** (optional):
  - `search?: string` - Case-insensitive partial match on name (max 100 chars)
  - `sort?: 'created_at' | 'updated_at' | 'name'` - Sort field (default: 'updated_at')
  - `order?: 'asc' | 'desc'` - Sort order (default: 'desc')
- **Headers**: 
  - `Authorization: Bearer <SUPABASE_JWT_TOKEN>` (required)
  - `Content-Type: application/json`

**Response**:
- **Success (200 OK)**: `GetMealPlansResponseDto` (array of `MealPlanListItemDto`)
- **Error (401 Unauthorized)**: `{ error: string, details: string }` - Redirect to `/login`
- **Error (400 Bad Request)**: `{ error: string, details: ValidationError[] }` - Display validation errors
- **Error (500 Internal Server Error)**: `{ error: string }` - Display generic error message

**Implementation**:
```typescript
const fetchMealPlans = async (search?: string, sort = 'updated_at', order = 'desc') => {
  const token = await getAuthToken(); // From Supabase client
  if (!token) {
    // Redirect to login
    return;
  }

  const params = new URLSearchParams();
  if (search) params.append('search', search);
  params.append('sort', sort);
  params.append('order', order);

  const response = await fetch(`/api/meal-plans?${params.toString()}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (response.status === 401) {
    window.location.href = '/login';
    return;
  }

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch meal plans');
  }

  const data: GetMealPlansResponseDto = await response.json();
  return data;
};
```

### Endpoint: `DELETE /api/meal-plans/{id}`

**Purpose**: Deletes a meal plan by ID.

**Request**:
- **Method**: `DELETE`
- **URL**: `/api/meal-plans/{id}` (where `{id}` is the meal plan UUID)
- **Headers**: 
  - `Authorization: Bearer <SUPABASE_JWT_TOKEN>` (required)

**Response**:
- **Success (204 No Content)**: Empty response body
- **Error (401 Unauthorized)**: `{ error: string, details: string }` - Redirect to `/login`
- **Error (400 Bad Request)**: `{ error: string, details: ValidationError[] }` - Invalid UUID
- **Error (404 Not Found)**: `{ error: string, details: string }` - Meal plan not found
- **Error (500 Internal Server Error)**: `{ error: string }` - Display generic error message

**Implementation**:
```typescript
const deleteMealPlan = async (id: string) => {
  const token = await getAuthToken();
  if (!token) {
    window.location.href = '/login';
    return;
  }

  const response = await fetch(`/api/meal-plans/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    window.location.href = '/login';
    return;
  }

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete meal plan');
  }
};
```

### Authentication

The Dashboard must include the Supabase JWT token in the `Authorization` header for all API requests. The token is obtained from the Supabase client session:

```typescript
import { supabaseClient } from '@/db/supabase.client';

const getAuthToken = async (): Promise<string | null> => {
  const { data: { session } } = await supabaseClient.auth.getSession();
  return session?.access_token ?? null;
};
```

Alternatively, if the Private Layout provides the token as a prop or context, use that method instead.

## 8. User Interactions

### Search Interaction

1. **User Action**: User types in the search input field
2. **Component Behavior**: 
   - Input value updates `searchQuery` state
   - Debounced value (300ms delay) triggers API call
   - Loading state is set to `true`
   - API request sent with search query parameter
3. **Success Path**: 
   - API returns filtered meal plans
   - `mealPlans` state updates with filtered results
   - List re-renders showing filtered items
   - Loading state set to `false`
4. **Error Path**: 
   - Error message displayed (Alert component)
   - Loading state set to `false`
   - Previous meal plans list remains visible

### Create New Meal Plan Interaction

1. **User Action**: User clicks "Create new meal plan" button
2. **Component Behavior**: 
   - `isStartupDialogOpen` state set to `true`
   - StartupFormDialog opens
3. **User Fills Form**: User enters patient data, targets, and guidelines
4. **User Submits**: User clicks "Generate" button in dialog
5. **Validation**: Form data validated using Zod schema
6. **Success Path**: 
   - Dialog `onSubmit` callback called with validated data
   - Dialog closes (`isStartupDialogOpen` set to `false`)
   - Navigation to `/app/create` with startup data (via router or state bridge)
7. **Validation Error Path**: 
   - Validation errors displayed inline in form fields
   - Dialog remains open
   - User can correct errors and resubmit

### Edit/View Interaction

1. **User Action**: User clicks "Edit / View" button on a meal plan item
2. **Component Behavior**: 
   - `onEdit` callback called with meal plan ID
   - Navigation to `/app/editor/{id}` via router (e.g., `window.location.href` or Astro router)

### Export Interaction

1. **User Action**: User clicks "Export" link on a meal plan item
2. **Component Behavior**: 
   - `onExport` callback called with meal plan ID
   - Navigation to `/api/meal-plans/{id}/export` endpoint (or opens in new tab)
   - Browser downloads `.doc` file (handled by server response headers)

### Delete Interaction

1. **User Action**: User clicks "Delete" button on a meal plan item
2. **Component Behavior**: 
   - `onDelete` callback called with meal plan ID and name
   - `deleteDialogState` updated: `{ isOpen: true, mealPlanId: id, mealPlanName: name }`
   - DeleteConfirmationDialog opens
3. **User Confirms**: User clicks "Confirm" button in dialog
4. **Component Behavior**: 
   - `isDeleting` state set to `true`
   - API DELETE request sent to `/api/meal-plans/{id}`
5. **Success Path**: 
   - API returns 204 No Content
   - Dialog closes (`deleteDialogState.isOpen` set to `false`)
   - Meal plans list refetched to reflect deletion
   - `isDeleting` set to `false`
6. **Error Path**: 
   - Error message displayed (toast or Alert component)
   - Dialog remains open
   - `isDeleting` set to `false`
   - User can retry or cancel
7. **User Cancels**: User clicks "Cancel" or closes dialog
   - Dialog closes without action
   - `deleteDialogState` reset

### List Refresh Interaction

The meal plans list should automatically refresh in these scenarios:
- After successful deletion
- After returning from the editor (if meal plan was updated)
- On component mount
- Optionally: On window focus (to catch changes from other tabs)

## 9. Conditions and Validation

### Client-Side Validation

**Search Input**:
- Maximum length: 100 characters (per API schema `listMealPlansQuerySchema`)
- Trim whitespace before sending to API
- Empty string is valid (returns all meal plans)

**Startup Form Validation** (via Zod schema):
- **Patient Age**: Positive integer, maximum 150, nullable
- **Patient Weight**: Positive number, maximum 1000, nullable
- **Patient Height**: Positive number, maximum 300, nullable
- **Activity Level**: Must be one of: 'sedentary', 'light', 'moderate', 'high', nullable
- **Target Kcal**: Positive integer, maximum 10000, nullable
- **Target Macro Distribution**: 
  - Each percentage (p_perc, f_perc, c_perc) between 0-100
  - Optional validation: Sum should approximately equal 100 (warning, not error)
  - Nullable
- **Meal Names**: String, maximum 500 characters, nullable
- **Exclusions/Guidelines**: String, maximum 2000 characters, nullable

**Delete Confirmation**:
- Meal plan ID must be a valid UUID format
- Meal plan ID must exist in current meal plans list

### API Response Validation

**Success Response**:
- Verify response is an array
- Verify each item matches `MealPlanListItemDto` structure
- Handle empty array (show empty state)

**Error Responses**:
- **401 Unauthorized**: Immediately redirect to `/login` page
- **400 Bad Request**: Display validation error details to user
- **404 Not Found** (DELETE): Display "Meal plan not found" message
- **500 Internal Server Error**: Display generic error message with option to retry

### Component State Conditions

**Loading States**:
- Show loading indicator when `isLoading === true`
- Disable action buttons during loading
- Prevent duplicate API calls while loading

**Error States**:
- Display error message when `error !== null`
- Allow user to dismiss error and retry
- Error state clears on successful API call

**Empty State**:
- Show empty state message when `mealPlans.length === 0 && !isLoading && !error`
- Hide list when empty state is shown

**Dialog States**:
- Only one dialog open at a time (StartupFormDialog OR DeleteConfirmationDialog)
- Prevent body scroll when dialog is open (handled by Shadcn Dialog component)

## 10. Error Handling

### API Error Handling

**401 Unauthorized**:
- **Detection**: Status code 401 from any API call
- **Action**: Immediately redirect to `/login` page via `window.location.href = '/login'`
- **User Experience**: User is redirected, no error message shown (auth failure is handled globally)

**400 Bad Request**:
- **Detection**: Status code 400 with validation error details
- **Action**: 
  - Extract error details from response JSON
  - Display validation errors inline in form fields (for StartupFormDialog)
  - For search: Display toast notification with error message
- **User Experience**: User can see specific validation errors and correct them

**404 Not Found** (DELETE only):
- **Detection**: Status code 404 when deleting meal plan
- **Action**: 
  - Display error message: "Meal plan not found. It may have already been deleted."
  - Close delete dialog
  - Refetch meal plans list to sync with server state
- **User Experience**: User informed of issue, list refreshes to show current state

**500 Internal Server Error**:
- **Detection**: Status code 500 from any API call
- **Action**: 
  - Display generic error message: "An error occurred. Please try again."
  - Log error details to console (development) or error tracking service (production)
  - Provide retry option (button to refetch)
- **User Experience**: User sees error notification with retry option

**Network Errors**:
- **Detection**: `fetch` throws exception or times out
- **Action**: 
  - Display error message: "Network error. Please check your connection and try again."
  - Provide retry option
- **User Experience**: User informed of network issue, can retry when connection restored

### Component Error Boundaries

Consider wrapping the Dashboard in a React Error Boundary (if not handled at layout level) to catch unexpected rendering errors:

```typescript
// Optional: ErrorBoundary component
<ErrorBoundary fallback={<ErrorFallback />}>
  <DashboardView />
</ErrorBoundary>
```

### User-Friendly Error Messages

All error messages should be:
- Clear and actionable
- Non-technical (avoid showing stack traces or API internals)
- Contextual (explain what action failed and what user can do)
- Accessible (proper ARIA labels and roles)

### Error Recovery

- **Automatic Recovery**: For transient errors (500, network), automatically retry once after 2 seconds
- **Manual Recovery**: Provide "Retry" button for user-initiated retry
- **State Preservation**: Preserve user input (search query, form data) when errors occur, allowing user to retry without re-entering data

## 11. Implementation Steps

### Step 1: Create Astro Page Structure
1. Create `/src/pages/app/dashboard.astro`
2. Import Private Layout (create if it doesn't exist)
3. Set up page structure with layout wrapper
4. Import and render `DashboardView` React component as client island

### Step 2: Create Main DashboardView Component
1. Create `/src/components/DashboardView.tsx`
2. Set up component structure with TypeScript
3. Initialize state variables (mealPlans, isLoading, error, etc.)
4. Add basic JSX structure with container divs
5. Import required types from `types.ts`

### Step 3: Implement Authentication Helper
1. Create utility function `getAuthToken()` in `/src/lib/auth/` (or appropriate location)
2. Use Supabase client to get session token
3. Handle cases where no session exists (return null)

### Step 4: Implement API Integration Functions
1. Create `fetchMealPlans()` function in `DashboardView` or custom hook
2. Implement `deleteMealPlan()` function
3. Add error handling for all HTTP status codes
4. Handle 401 by redirecting to login

### Step 5: Create Custom Hooks (Optional but Recommended)
1. Create `useMealPlansList` hook in `/src/components/hooks/useMealPlansList.ts`
2. Move API logic into hook
3. Return state and functions for use in component
4. Create `useDebounce` utility hook if not already available

### Step 6: Implement DashboardHeader Component
1. Create `/src/components/DashboardHeader.tsx`
2. Add "Create new meal plan" button (Shadcn Button)
3. Add search input (Shadcn Input)
4. Implement controlled input with debouncing
5. Connect callbacks to parent component

### Step 7: Implement MealPlanList Component
1. Create `/src/components/MealPlanList.tsx`
2. Add conditional rendering for empty state vs. list
3. Map over mealPlans array to render items
4. Add loading skeleton/placeholder
5. Add error message display (Shadcn Alert)

### Step 8: Create EmptyState Component
1. Create `/src/components/EmptyState.tsx`
2. Design empty state UI with message
3. Add optional CTA button

### Step 9: Implement MealPlanListItem Component
1. Create `/src/components/MealPlanListItem.tsx`
2. Display meal plan name and metadata
3. Add action buttons container
4. Style with Tailwind CSS

### Step 10: Implement MealPlanInfo Component
1. Create `/src/components/MealPlanInfo.tsx`
2. Format and display plan name
3. Format timestamps for readability (use date-fns or similar)
4. Optionally display daily summary preview

### Step 11: Implement MealPlanActions Component
1. Create `/src/components/MealPlanActions.tsx`
2. Add Edit/View button (Shadcn Button)
3. Add Export link (`<a>` tag with href to export endpoint)
4. Add Delete button (Shadcn Button, destructive variant)
5. Connect callbacks to parent

### Step 12: Create StartupFormDialog Component
1. Install/import Shadcn Dialog component if not already available
2. Create `/src/components/StartupFormDialog.tsx`
3. Set up Dialog structure with Shadcn Dialog
4. Create form with all required fields:
   - Patient age, weight, height (number inputs)
   - Activity level (select/dropdown)
   - Target kcal (number input)
   - Macro distribution (three number inputs or custom component)
   - Meal names (text input)
   - Exclusions (textarea)
5. Implement form validation using Zod schema (`mealPlanStartupDataSchema`)
6. Add submit and cancel buttons
7. Handle form submission and validation errors

### Step 13: Create DeleteConfirmationDialog Component
1. Create `/src/components/DeleteConfirmationDialog.tsx`
2. Set up Dialog structure with Shadcn Dialog
3. Add confirmation message with meal plan name
4. Add Cancel and Confirm buttons
5. Implement loading state during deletion
6. Connect callbacks to parent

### Step 14: Integrate Components in DashboardView
1. Import all child components
2. Connect state and callbacks between components
3. Implement search functionality with debouncing
4. Implement create flow (open dialog, handle submission, navigate)
5. Implement delete flow (open dialog, handle confirmation, refetch)
6. Implement edit/export navigation

### Step 15: Add Loading and Error States
1. Add loading skeleton/spinner during initial fetch
2. Add error Alert component for API errors
3. Handle empty state display
4. Add loading states for delete action

### Step 16: Implement List Refresh Logic
1. Refetch list after successful deletion
2. Add option to refresh on window focus (optional)
3. Ensure list updates correctly after navigation back from editor

### Step 17: Add Shadcn/ui Components (If Needed)
1. Install missing Shadcn components:
   - Dialog (for StartupFormDialog and DeleteConfirmationDialog)
   - Input (for search and form fields)
   - Button (already available)
   - Alert (for error messages)
   - Skeleton (for loading states)
2. Configure components according to project setup

### Step 18: Styling and Polish
1. Apply Tailwind CSS classes for layout and spacing
2. Ensure responsive design (mobile-friendly)
3. Add hover effects and transitions
4. Ensure proper spacing and visual hierarchy
5. Verify accessibility (keyboard navigation, screen readers)

### Step 19: Testing
1. Test initial load with meal plans
2. Test empty state display
3. Test search functionality (with debouncing)
4. Test create flow (form validation, submission)
5. Test edit navigation
6. Test export link
7. Test delete flow (confirmation, success, error cases)
8. Test error handling (401, 400, 404, 500, network errors)
9. Test loading states
10. Test responsive design on different screen sizes

### Step 20: Accessibility Audit
1. Verify keyboard navigation works for all interactive elements
2. Ensure proper ARIA labels on buttons and dialogs
3. Test with screen reader
4. Verify focus management in dialogs
5. Ensure color contrast meets WCAG standards

### Step 21: Code Review and Refinement
1. Review code for consistency with project patterns
2. Ensure TypeScript types are correctly applied
3. Remove any console.log statements
4. Optimize re-renders with React.memo if needed
5. Ensure proper cleanup in useEffect hooks

### Step 22: Documentation
1. Add JSDoc comments to components
2. Document props interfaces
3. Update component documentation if project maintains it

