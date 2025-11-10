# Feature Implementation Plan: Extended Export Feature with Options Modal

## 1. Overview

This feature extends the existing export functionality to allow dietitians to customize what information is included in the exported meal plan report. When users click the "Export" button, a modal dialog appears where they can select:

1. **Content Options** (via checkboxes):
   - Daily Summary (whole plan macros: kcal, proteins, fats, carbs)
   - Meals Summary (per-meal macros for all meals - all or none)
   - Ingredients (for each meal)
   - Preparation (for each meal)

2. **Format Options** (via radio buttons or select):
   - DOC format (current Microsoft Word document format)
   - HTML format (interactive HTML file with expand/collapse sections, downloadable)

The modal is shown before each export (no saved preferences). Once the user selects their options and clicks "Export", the system generates the file according to their selections and downloads it.

**Purpose**: Provide dietitians with flexibility to create customized reports based on their specific needs, whether for printing (DOC) or digital sharing (HTML).

**User Story**: As a dietitian, I want to customize what information appears in my exported meal plan reports so that I can create reports tailored to different use cases (e.g., detailed reports with all information, or simplified reports with only essential data).

## 2. View Routing

No new routes are required. This feature extends the existing export functionality in:
- **Meal Plan Editor**: `/app/editor/{id}` - Export button in edit mode
- **Dashboard**: `/app/dashboard` - Export button/link in meal plan list

The export modal will be triggered from existing export buttons without requiring navigation.

## 3. Component Structure

```
ExportOptionsModal (New React Component)
├── Dialog (shadcn/ui)
│   ├── DialogHeader
│   │   ├── DialogTitle ("Export Meal Plan")
│   │   └── DialogDescription ("Select what to include in your export")
│   ├── DialogContent
│   │   ├── ContentOptionsSection
│   │   │   ├── CheckboxGroup
│   │   │   │   ├── DailySummaryCheckbox
│   │   │   │   ├── MealsSummaryCheckbox
│   │   │   │   ├── IngredientsCheckbox
│   │   │   │   └── PreparationCheckbox
│   │   ├── FormatOptionsSection
│   │   │   └── FormatSelect (DOC or HTML)
│   │   └── ValidationMessage (if no options selected)
│   └── DialogFooter
│       ├── CancelButton
│       └── ExportButton (disabled if no content options selected)
```

**Updated Components:**
- `MealPlanEditor.tsx` - Update `handleExport` to open modal instead of direct export
- `DashboardView.tsx` - Update `handleExport` to open modal instead of direct export
- `useMealPlanEditor.ts` - Update export handler to support modal flow

## 4. Component Details

### ExportOptionsModal

- **Component Description**: A modal dialog component that allows users to select export options (content sections and format) before generating the export file.

- **Main Elements**:
  - Modal dialog with overlay
  - Section for content options (checkboxes)
  - Section for format selection (select dropdown or radio buttons)
  - Cancel and Export buttons
  - Validation message (if no content options selected)
  - Loading state during export generation

- **Handled Interactions**:
  - **Open Modal**: Triggered by export button click, receives `mealPlanId` as prop
  - **Close Modal**: Click cancel, click overlay, or press ESC key
  - **Toggle Checkboxes**: User can select/deselect content options (daily summary, meals summary, ingredients, preparation)
  - **Select Format**: User can choose between DOC and HTML formats
  - **Export**: Validate that at least one content option is selected, then call export API with options, show loading state, close modal on success, show error on failure
  - **Validation**: Disable export button if no content options are selected

- **Handled Validation**:
  - At least one content option must be selected (daily summary, meals summary, ingredients, or preparation)
  - Format must be selected (DOC or HTML)
  - Client-side validation before API call

- **Types**:
  - **Props**: `ExportOptionsModalProps`
  - **State**: `ExportOptionsState`
  - **Export Options**: `ExportOptions`

- **Props**:
  ```typescript
  interface ExportOptionsModalProps {
    isOpen: boolean;
    mealPlanId: string;
    onClose: () => void;
    onExportComplete?: () => void;
    onExportError?: (error: string) => void;
  }
  ```

### Updated: MealPlanEditor

- **Component Description**: Main editor component - export button now opens modal instead of directly exporting.

- **Updated Interactions**:
  - **Export Button Click**: Opens `ExportOptionsModal` instead of calling `handleExport` directly
  - **Modal State**: Manage `isExportModalOpen` state
  - **Export Handler**: Updated to receive export options from modal and call API with options

- **Updated Props**: No new props required (uses existing `mealPlanId`)

### Updated: DashboardView

- **Component Description**: Dashboard component - export functionality now opens modal.

- **Updated Interactions**:
  - **Export Button/Link Click**: Opens `ExportOptionsModal` with selected meal plan ID
  - **Modal State**: Manage `isExportModalOpen` and `selectedMealPlanId` state
  - **Export Handler**: Updated to receive export options from modal and call API with options

## 5. Types

### Export Options Types

```typescript
/**
 * Defines the content options for export (what sections to include).
 */
export interface ExportContentOptions {
  /** Include daily summary (whole plan macros: kcal, proteins, fats, carbs) */
  dailySummary: boolean;
  /** Include meals summary (per-meal macros for all meals - all or none) */
  mealsSummary: boolean;
  /** Include ingredients for each meal */
  ingredients: boolean;
  /** Include preparation instructions for each meal */
  preparation: boolean;
}

/**
 * Defines the format options for export.
 */
export type ExportFormat = "doc" | "html";

/**
 * Complete export options including content and format.
 */
export interface ExportOptions {
  content: ExportContentOptions;
  format: ExportFormat;
}

/**
 * Request payload for export API endpoint.
 */
export interface ExportMealPlanRequest {
  content: ExportContentOptions;
  format: ExportFormat;
}

/**
 * Response from export API endpoint (binary file).
 * No DTO needed for response - returns binary data with appropriate headers.
 */
```

### Component Prop Types

```typescript
/**
 * Props for ExportOptionsModal component.
 */
interface ExportOptionsModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Meal plan ID to export */
  mealPlanId: string;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Optional callback when export completes successfully */
  onExportComplete?: () => void;
  /** Optional callback when export fails */
  onExportError?: (error: string) => void;
}

/**
 * Internal state for ExportOptionsModal component.
 */
interface ExportOptionsModalState {
  /** Content options selected by user */
  contentOptions: ExportContentOptions;
  /** Format selected by user */
  format: ExportFormat;
  /** Whether export is in progress */
  isExporting: boolean;
  /** Validation error message */
  error: string | null;
}
```

### API Types

```typescript
/**
 * Query parameters or request body for export API endpoint.
 * Using query parameters for GET request or request body for POST request.
 */
export interface ExportMealPlanQueryParams {
  dailySummary?: string; // "true" or "false"
  mealsSummary?: string; // "true" or "false"
  ingredients?: string; // "true" or "false"
  preparation?: string; // "true" or "false"
  format: "doc" | "html";
}
```

## 6. State Management

### ExportOptionsModal State

- **Local State** (React `useState`):
  - `contentOptions`: `ExportContentOptions` - Tracks which content options are selected
  - `format`: `ExportFormat` - Tracks selected format (default: "doc")
  - `isExporting`: `boolean` - Tracks whether export is in progress
  - `error`: `string | null` - Tracks validation or API errors

- **State Flow**:
  1. Modal opens with default values (all checkboxes checked, format: "doc")
  2. User toggles checkboxes and selects format
  3. User clicks "Export" button
  4. Validation runs (at least one content option must be selected)
  5. If valid, `isExporting` set to `true`, API call made with options
  6. On success: File downloaded, modal closes, `isExporting` set to `false`
  7. On error: Error message displayed, `isExporting` set to `false`

### Updated: MealPlanEditor State

- **New State**:
  - `isExportModalOpen`: `boolean` - Tracks whether export modal is open

- **State Flow**:
  1. User clicks "Export" button in edit mode
  2. `isExportModalOpen` set to `true`
  3. Modal opens with `mealPlanId` prop
  4. User selects options and clicks "Export" in modal
  5. Modal handles export, closes on success
  6. `isExportModalOpen` set to `false` when modal closes

### Updated: DashboardView State

- **New State**:
  - `isExportModalOpen`: `boolean` - Tracks whether export modal is open
  - `selectedMealPlanId`: `string | null` - Tracks which meal plan is being exported

- **State Flow**:
  1. User clicks "Export" button/link for a meal plan
  2. `selectedMealPlanId` set to meal plan ID, `isExportModalOpen` set to `true`
  3. Modal opens with `mealPlanId` prop
  4. User selects options and clicks "Export" in modal
  5. Modal handles export, closes on success
  6. `isExportModalOpen` set to `false`, `selectedMealPlanId` set to `null` when modal closes

## 7. API Integration

### Updated Endpoint: GET /api/meal-plans/{id}/export

**Current Behavior**: Generates DOC file with all content (daily summary, meals with ingredients, preparation, and summaries).

**Updated Behavior**: Accepts query parameters to customize export content and format.

**Request**:
- **Method**: `GET` (or change to `POST` if query parameters become too complex)
- **Path**: `/api/meal-plans/{id}/export`
- **Query Parameters**:
  - `dailySummary`: `"true"` | `"false"` (optional, default: `"true"`)
  - `mealsSummary`: `"true"` | `"false"` (optional, default: `"true"`)
  - `ingredients`: `"true"` | `"false"` (optional, default: `"true"`)
  - `preparation`: `"true"` | `"false"` (optional, default: `"true"`)
  - `format`: `"doc"` | `"html"` (required)

**Response**:
- **Success (200 OK)**:
  - **DOC Format**:
    - `Content-Type: application/msword`
    - `Content-Disposition: attachment; filename="[sanitized-name].doc"`
    - Body: Binary DOC file
  - **HTML Format**:
    - `Content-Type: text/html`
    - `Content-Disposition: attachment; filename="[sanitized-name].html"`
    - Body: HTML file content

**Error Responses**:
- `400 Bad Request`: Invalid query parameters (e.g., invalid format value, invalid boolean values)
- `401 Unauthorized`: Missing or invalid authentication token
- `404 Not Found`: Meal plan doesn't exist or doesn't belong to user
- `500 Internal Server Error`: Database error or document generation failure

### New Service: HTML Generator Service

**File**: `src/lib/meal-plans/html-generator.service.ts`

**Service Structure**:
```typescript
export class HtmlGeneratorService {
  /**
   * Generates an HTML file from meal plan data with specified options.
   * @param mealPlan - The complete meal plan row from database
   * @param options - Export content options
   * @returns HTML string
   */
  generateHtml(mealPlan: TypedMealPlanRow, options: ExportContentOptions): string;

  /**
   * Generates HTML document structure with expand/collapse sections.
   * @param mealPlan - The complete meal plan row from database
   * @param options - Export content options
   * @returns Complete HTML document string
   */
  private generateDocument(mealPlan: TypedMealPlanRow, options: ExportContentOptions): string;

  /**
   * Generates daily summary section (if enabled).
   * @param summary - Daily summary data
   * @returns HTML string for daily summary section
   */
  private generateDailySummarySection(summary: MealPlanContentDailySummary): string;

  /**
   * Generates meals section with expand/collapse functionality.
   * @param meals - Array of meals
   * @param options - Export content options
   * @returns HTML string for meals section
   */
  private generateMealsSection(meals: MealPlanMeal[], options: ExportContentOptions): string;

  /**
   * Generates a single meal section.
   * @param meal - Meal data
   * @param index - Meal index (0-based)
   * @param options - Export content options
   * @returns HTML string for single meal
   */
  private generateMealSection(meal: MealPlanMeal, index: number, options: ExportContentOptions): string;

  /**
   * Sanitizes filename for safe file system usage (reused from doc-generator).
   * @param name - The meal plan name
   * @returns Sanitized filename
   */
  sanitizeFilename(name: string): string;
}
```

**HTML Structure**:
- Modern, responsive HTML5 document
- Embedded CSS for styling (matches editor template as closely as possible)
- JavaScript for expand/collapse functionality (embedded, no external dependencies)
- Print-friendly styles
- Dark mode support (optional, based on user preference or system preference)

### Updated Service: DOC Generator Service

**File**: `src/lib/meal-plans/doc-generator.service.ts`

**Updated Methods**:
- `generateDoc(mealPlan: TypedMealPlanRow, options: ExportContentOptions): Promise<Buffer>`
  - Accepts `options` parameter to conditionally include sections
  - Only includes sections that are enabled in options

**Updated Helper Methods**:
- `generateDocumentChildren(mealPlan: TypedMealPlanRow, options: ExportContentOptions): (Paragraph | Table)[]`
  - Conditionally includes daily summary based on `options.dailySummary`
  - Conditionally includes meals summary in meals based on `options.mealsSummary`
  - Conditionally includes ingredients based on `options.ingredients`
  - Conditionally includes preparation based on `options.preparation`

### Client API Integration

**File**: `src/lib/api/meal-plans.client.ts`

**Updated Method**:
```typescript
/**
 * Exports a meal plan with specified options.
 * @param id - Meal plan ID
 * @param options - Export options (content and format)
 * @returns Blob containing the exported file
 */
async export(id: string, options: ExportOptions): Promise<Blob> {
  const headers = await getAuthHeadersWithoutContentType();
  const queryParams = new URLSearchParams({
    dailySummary: options.content.dailySummary.toString(),
    mealsSummary: options.content.mealsSummary.toString(),
    ingredients: options.content.ingredients.toString(),
    preparation: options.content.preparation.toString(),
    format: options.format,
  });
  
  const response = await fetch(`/api/meal-plans/${id}/export?${queryParams.toString()}`, {
    headers,
  });

  return handleApiBlobResponse(response);
}
```

## 8. User Interactions

### Interaction 1: Open Export Modal

- **Interaction**: User clicks "Export" button in Meal Plan Editor or Dashboard
- **Expected Outcome**: 
  - Export modal opens with default options (all content options checked, format: DOC)
  - Modal is centered on screen with overlay
  - Focus is on the first checkbox or close button for accessibility
- **Implementation**: 
  - Set `isExportModalOpen` state to `true`
  - Render `ExportOptionsModal` component with `mealPlanId` prop
  - Initialize modal state with default values

### Interaction 2: Toggle Content Options

- **Interaction**: User clicks checkboxes to select/deselect content options
- **Expected Outcome**: 
  - Checkbox toggles between checked and unchecked states
  - Export button remains enabled if at least one option is selected
  - Export button is disabled if all options are unchecked
  - Validation message appears if user tries to export with no options selected
- **Implementation**: 
  - Update `contentOptions` state when checkbox is clicked
  - Validate that at least one option is selected
  - Update Export button disabled state based on validation

### Interaction 3: Select Export Format

- **Interaction**: User selects format (DOC or HTML) from dropdown or radio buttons
- **Expected Outcome**: 
  - Selected format is highlighted/selected
  - Format selection is stored in state
- **Implementation**: 
  - Update `format` state when format is selected
  - Use controlled select component or radio group

### Interaction 4: Cancel Export

- **Interaction**: User clicks "Cancel" button, clicks overlay, or presses ESC key
- **Expected Outcome**: 
  - Modal closes without exporting
  - State is reset to default values
  - User returns to previous view (editor or dashboard)
- **Implementation**: 
  - Call `onClose` callback
  - Set `isExportModalOpen` to `false`
  - Reset modal state to defaults

### Interaction 5: Export with Options

- **Interaction**: User selects options and clicks "Export" button
- **Expected Outcome**: 
  - Validation runs (at least one content option must be selected)
  - If valid: Loading state shows, API call is made with options, file downloads on success, modal closes
  - If invalid: Validation message appears, export does not proceed
  - On error: Error message displays in modal, user can retry or cancel
- **Implementation**: 
  1. Validate `contentOptions` (at least one must be `true`)
  2. If valid, set `isExporting` to `true`
  3. Call `mealPlansApi.export(mealPlanId, options)`
  4. On success: Create blob URL, trigger download, close modal, reset state
  5. On error: Set error message, set `isExporting` to `false`
  6. Handle different content types based on format (DOC vs HTML)

### Interaction 6: Handle Export Success

- **Interaction**: Export completes successfully, file is downloaded
- **Expected Outcome**: 
  - File downloads with appropriate filename (e.g., "meal-plan-name.doc" or "meal-plan-name.html")
  - Modal closes automatically
  - User sees success feedback (optional toast notification)
  - User can immediately export again with different options if needed
- **Implementation**: 
  - Extract filename from `Content-Disposition` header or generate from meal plan name
  - Create blob URL, create temporary anchor element, trigger click, revoke URL
  - Call `onExportComplete` callback if provided
  - Close modal and reset state

### Interaction 7: Handle Export Error

- **Interaction**: Export fails (network error, API error, etc.)
- **Expected Outcome**: 
  - Error message displays in modal (non-blocking)
  - User can retry export with same or different options
  - User can cancel and close modal
  - Loading state is cleared
- **Implementation**: 
  - Catch error from API call
  - Display user-friendly error message in modal
  - Set `isExporting` to `false`
  - Allow user to modify options and retry, or cancel

## 9. Conditions and Validation

### Client-Side Validation

1. **Content Options Validation**:
   - At least one content option must be selected (dailySummary, mealsSummary, ingredients, or preparation)
   - If all options are unchecked, Export button is disabled
   - Validation message appears if user attempts to export with no options selected

2. **Format Validation**:
   - Format must be selected (DOC or HTML)
   - Default format is "doc" if not specified
   - Format value is validated against allowed values ("doc" | "html")

3. **Meal Plan ID Validation**:
   - Meal plan ID must be a valid UUID
   - Meal plan must exist and belong to the authenticated user
   - Validation occurs on API side, but client should handle 404 errors gracefully

### Server-Side Validation

1. **Query Parameters Validation**:
   - `dailySummary`: Must be "true" or "false" (string), default: "true"
   - `mealsSummary`: Must be "true" or "false" (string), default: "true"
   - `ingredients`: Must be "true" or "false" (string), default: "true"
   - `preparation`: Must be "true" or "false" (string), default: "true"
   - `format`: Must be "doc" or "html" (required, no default)
   - Invalid values return 400 Bad Request

2. **Authentication Validation**:
   - User must be authenticated (valid JWT token)
   - Unauthenticated requests return 401 Unauthorized

3. **Authorization Validation**:
   - User can only export their own meal plans
   - Meal plan must exist in database
   - If meal plan doesn't exist or doesn't belong to user, return 404 Not Found

4. **Content Options Validation**:
   - At least one content option must be enabled (server-side validation as defense-in-depth)
   - If all options are false, return 400 Bad Request with error message

### Business Logic Conditions

1. **Daily Summary Inclusion**:
   - If `dailySummary` is `true`, include daily summary section in export
   - Daily summary shows: Total Kcal, Proteins (g), Fats (g), Carbs (g)
   - Format matches editor template (grid layout with large numbers)

2. **Meals Summary Inclusion**:
   - If `mealsSummary` is `true`, include per-meal macros for ALL meals
   - If `mealsSummary` is `false`, exclude per-meal macros for ALL meals (all or none)
   - Per-meal summary shows: Kcal, Proteins (g), Fats (g), Carbs (g) for each meal
   - Format matches editor template (grid layout)

3. **Ingredients Inclusion**:
   - If `ingredients` is `true`, include ingredients for each meal
   - If `ingredients` is `false`, exclude ingredients for all meals
   - Ingredients are displayed as text/paragraph in export

4. **Preparation Inclusion**:
   - If `preparation` is `true`, include preparation instructions for each meal
   - If `preparation` is `false`, exclude preparation instructions for all meals
   - Preparation instructions are displayed as text/paragraph in export

5. **Format-Specific Conditions**:
   - **DOC Format**: 
     - Uses existing `docx` library
     - Generates Microsoft Word document
     - All selected content is included in document
     - Professional formatting with headings, tables, and paragraphs
   - **HTML Format**:
     - Generates standalone HTML file (embedded CSS and JavaScript)
     - Includes expand/collapse functionality for sections
     - Responsive design (works on desktop and mobile)
     - Print-friendly styles
     - Matches editor template styling as closely as possible

## 10. Error Handling

### Client-Side Error Handling

1. **Validation Errors**:
   - **Scenario**: User attempts to export with no content options selected
   - **Handling**: Display validation message in modal, disable Export button, prevent API call
   - **User Message**: "Please select at least one content option to export."

2. **Network Errors**:
   - **Scenario**: Network request fails (no internet, timeout, etc.)
   - **Handling**: Display error message in modal, allow user to retry
   - **User Message**: "Network error. Please check your connection and try again."

3. **API Errors**:
   - **Scenario**: API returns error (400, 401, 404, 500)
   - **Handling**: 
     - **400 Bad Request**: Display validation error message
     - **401 Unauthorized**: Redirect to login page (existing behavior)
     - **404 Not Found**: Display error message "Meal plan not found."
     - **500 Internal Server Error**: Display generic error message "An error occurred while exporting. Please try again."
   - **User Message**: Appropriate error message based on status code

4. **File Download Errors**:
   - **Scenario**: Blob creation or download fails
   - **Handling**: Display error message, allow user to retry
   - **User Message**: "Failed to download file. Please try again."

5. **Loading State Errors**:
   - **Scenario**: Export takes too long or gets stuck
   - **Handling**: Show loading indicator, allow cancellation, set timeout
   - **User Message**: Loading indicator with "Exporting..." message

### Server-Side Error Handling

1. **Validation Errors** (400 Bad Request):
   - **Scenario**: Invalid query parameters (e.g., invalid format, invalid boolean values)
   - **Handling**: Return 400 with error message
   - **Response**: `{ error: "Validation failed", details: [...] }`
   - **Logging**: Log validation errors at INFO level

2. **Authentication Errors** (401 Unauthorized):
   - **Scenario**: Missing or invalid authentication token
   - **Handling**: Return 401, middleware handles redirect
   - **Response**: Standard auth error response
   - **Logging**: Log authentication failures at WARN level

3. **Authorization Errors** (404 Not Found):
   - **Scenario**: Meal plan doesn't exist or doesn't belong to user
   - **Handling**: Return 404 (not 403 to prevent information leakage)
   - **Response**: `{ error: "Meal plan not found" }`
   - **Logging**: Log authorization failures at INFO level

4. **Database Errors** (500 Internal Server Error):
   - **Scenario**: Database query fails or connection error
   - **Handling**: Return 500 with generic error message
   - **Response**: `{ error: "An internal error occurred" }`
   - **Logging**: Log database errors at ERROR level with details

5. **Document Generation Errors** (500 Internal Server Error):
   - **Scenario**: DOC or HTML generation fails (memory error, formatting error, etc.)
   - **Handling**: Return 500 with generic error message
   - **Response**: `{ error: "An internal error occurred" }`
   - **Logging**: Log generation errors at ERROR level with details

6. **Content Options Validation** (400 Bad Request):
   - **Scenario**: All content options are false (no content to export)
   - **Handling**: Return 400 with error message
   - **Response**: `{ error: "At least one content option must be selected" }`
   - **Logging**: Log validation errors at INFO level

### Error Display Priority

1. **Modal Errors**: Display errors in modal (non-blocking, user can retry or cancel)
2. **Toast Notifications**: Optional success toast when export completes (non-intrusive)
3. **Inline Validation**: Show validation errors inline in modal (immediate feedback)
4. **Global Error Handler**: Redirect to login on 401 (existing behavior)

## 11. Implementation Steps

### Step 1: Create Export Options Types

**File**: `src/types.ts`

- Add `ExportContentOptions` interface
- Add `ExportFormat` type
- Add `ExportOptions` interface
- Add `ExportMealPlanRequest` interface (if needed for API)

### Step 2: Create Export Options Modal Component

**File**: `src/components/ExportOptionsModal.tsx`

- Create React component with Dialog from shadcn/ui
- Add checkboxes for content options (daily summary, meals summary, ingredients, preparation)
- Add format selector (select dropdown or radio buttons)
- Add validation logic (at least one content option must be selected)
- Add loading state during export
- Add error handling and display
- Add cancel and export buttons
- Style to match application design

### Step 3: Create HTML Generator Service

**File**: `src/lib/meal-plans/html-generator.service.ts`

- Create `HtmlGeneratorService` class
- Implement `generateHtml` method that accepts meal plan and options
- Implement helper methods for each section (daily summary, meals, etc.)
- Add expand/collapse JavaScript functionality (embedded)
- Add CSS styling (embedded, matches editor template)
- Add print-friendly styles
- Add responsive design
- Implement filename sanitization (reuse from doc-generator)

### Step 4: Update DOC Generator Service

**File**: `src/lib/meal-plans/doc-generator.service.ts`

- Update `generateDoc` method to accept `ExportContentOptions` parameter
- Update `generateDocumentChildren` to conditionally include sections based on options
- Update `formatMeals` to conditionally include meals summary, ingredients, and preparation
- Update `formatDailySummary` to be conditional based on options
- Ensure all sections respect the options parameter

### Step 5: Update Export API Endpoint

**File**: `src/pages/api/meal-plans/[id]/export.ts`

- Add query parameter parsing and validation
- Create Zod schema for query parameters
- Validate query parameters (format, boolean values)
- Validate that at least one content option is enabled
- Pass options to document generator services
- Return appropriate content type based on format (DOC or HTML)
- Update error handling for new validation scenarios

### Step 6: Update Client API

**File**: `src/lib/api/meal-plans.client.ts`

- Update `export` method to accept `ExportOptions` parameter
- Build query string from options
- Handle different content types (DOC vs HTML)
- Update filename extraction based on content type
- Update error handling

### Step 7: Update Meal Plan Editor

**File**: `src/components/MealPlanEditor.tsx`

- Add state for export modal (`isExportModalOpen`)
- Update `handleExport` to open modal instead of directly exporting
- Add `ExportOptionsModal` component
- Handle modal close and export completion
- Update export button to open modal

**File**: `src/components/hooks/useMealPlanEditor.ts`

- Update `handleExport` to support modal flow (optional, if needed)
- Or remove `handleExport` from hook and handle in component

### Step 8: Update Dashboard View

**File**: `src/components/DashboardView.tsx`

- Add state for export modal (`isExportModalOpen`, `selectedMealPlanId`)
- Update `handleExport` to open modal with meal plan ID
- Add `ExportOptionsModal` component
- Handle modal close and export completion
- Update export button/link to open modal

### Step 9: Add Translations

**File**: `src/lib/i18n/translations/en.json`

- Add translations for export modal:
  - `export.modal.title`: "Export Meal Plan"
  - `export.modal.description`: "Select what to include in your export"
  - `export.modal.contentOptions`: "Content Options"
  - `export.modal.dailySummary`: "Daily Summary"
  - `export.modal.mealsSummary`: "Meals Summary"
  - `export.modal.ingredients`: "Ingredients"
  - `export.modal.preparation`: "Preparation"
  - `export.modal.formatOptions`: "Format"
  - `export.modal.formatDoc`: "DOC (Microsoft Word)"
  - `export.modal.formatHtml`: "HTML (Interactive)"
  - `export.modal.exportButton`: "Export"
  - `export.modal.cancelButton`: "Cancel"
  - `export.modal.exporting`: "Exporting..."
  - `export.modal.validationError`: "Please select at least one content option to export."
  - `export.modal.error`: "An error occurred while exporting. Please try again."

**File**: `src/lib/i18n/translations/pl.json`

- Add Polish translations for all export modal strings

### Step 10: Update Type Definitions

**File**: `src/lib/i18n/types.ts`

- Add export modal translation keys to translation type definitions

### Step 11: Add Unit Tests

**File**: `src/lib/meal-plans/__tests__/html-generator.service.test.ts`

- Test HTML generation with all options enabled
- Test HTML generation with individual options disabled
- Test HTML generation with no options enabled (should not generate empty document)
- Test expand/collapse functionality in generated HTML
- Test filename sanitization
- Test edge cases (empty meals, missing data, etc.)

**File**: `src/lib/meal-plans/__tests__/doc-generator.service.test.ts`

- Update existing tests to include options parameter
- Test DOC generation with all options enabled
- Test DOC generation with individual options disabled
- Test DOC generation with no options enabled (should not generate empty document)
- Test edge cases

**File**: `src/components/__tests__/ExportOptionsModal.test.tsx`

- Test modal opens and closes
- Test checkbox toggling
- Test format selection
- Test validation (no options selected)
- Test export button disabled state
- Test export success flow
- Test export error handling
- Test loading state

### Step 12: Integration Testing

**File**: Use existing test utilities in `testing/`

- Test export API endpoint with various option combinations
- Test export API endpoint with invalid options (400 error)
- Test export API endpoint with unauthenticated request (401 error)
- Test export API endpoint with non-existent meal plan (404 error)
- Test DOC export download
- Test HTML export download
- Test export from Meal Plan Editor
- Test export from Dashboard
- Test modal interaction flow

### Step 13: Accessibility Testing

- Test keyboard navigation in modal (Tab, Enter, Escape)
- Test screen reader compatibility
- Test focus management (focus on first interactive element when modal opens, return focus when modal closes)
- Test ARIA labels and roles
- Test color contrast for checkboxes and buttons

### Step 14: Responsive Design Testing

- Test modal on mobile devices (small screens)
- Test modal on tablet devices (medium screens)
- Test modal on desktop (large screens)
- Test HTML export on different screen sizes
- Test print styles for HTML export

### Step 15: Code Review Checklist

- [ ] All types are properly defined and exported
- [ ] Export modal component follows accessibility best practices
- [ ] HTML generator creates valid, standalone HTML files
- [ ] DOC generator respects all options correctly
- [ ] API endpoint validates all inputs properly
- [ ] Error handling covers all scenarios
- [ ] Translations are added for all user-facing strings
- [ ] Client-side validation prevents invalid API calls
- [ ] Server-side validation provides defense-in-depth
- [ ] Loading states are properly managed
- [ ] File downloads work correctly for both formats
- [ ] Modal state is properly managed (open/close)
- [ ] No memory leaks (blob URL cleanup, event listeners)
- [ ] Tests cover all major scenarios
- [ ] No linter errors
- [ ] Follows project coding standards
- [ ] HTML export matches editor template styling
- [ ] Expand/collapse functionality works in HTML export
- [ ] Print styles work correctly for HTML export

## 12. HTML Export Design Specifications

### HTML Structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>[Meal Plan Name]</title>
  <style>
    /* Embedded CSS for styling */
    /* Matches editor template as closely as possible */
  </style>
</head>
<body>
  <div class="container">
    <h1>[Meal Plan Name]</h1>
    
    <!-- Daily Summary Section (if enabled) -->
    <section class="daily-summary-section" data-collapsible>
      <h2>Daily Summary</h2>
      <button class="toggle-button" aria-expanded="true">Collapse</button>
      <div class="content">
        <!-- Daily summary content -->
      </div>
    </section>
    
    <!-- Meals Section (if enabled) -->
    <section class="meals-section">
      <h2>Meals</h2>
      <!-- Meal items -->
      <div class="meal-item" data-collapsible>
        <h3>Meal 1: [Meal Name]</h3>
        <button class="toggle-button" aria-expanded="true">Collapse</button>
        <div class="content">
          <!-- Meal summary (if enabled) -->
          <!-- Ingredients (if enabled) -->
          <!-- Preparation (if enabled) -->
        </div>
      </div>
    </section>
  </div>
  
  <script>
    // Embedded JavaScript for expand/collapse functionality
  </script>
</body>
</html>
```

### CSS Styling Requirements

1. **Match Editor Template**:
   - Use similar color scheme (background, text, borders)
   - Use similar typography (font sizes, weights, spacing)
   - Use similar layout (grid for daily summary, cards for meals)
   - Support dark mode (optional, based on system preference)

2. **Responsive Design**:
   - Mobile-first approach
   - Breakpoints for tablet and desktop
   - Flexible grid layouts
   - Readable text on all screen sizes

3. **Print Styles**:
   - Print-friendly layout (no expand/collapse buttons in print)
   - All sections expanded in print
   - Page break controls
   - Proper margins and spacing

4. **Interactive Elements**:
   - Hover states for buttons
   - Focus states for accessibility
   - Smooth transitions for expand/collapse
   - Visual feedback for interactions

### JavaScript Functionality

1. **Expand/Collapse**:
   - Toggle button for each collapsible section
   - Smooth animation for expand/collapse
   - Remember state (optional, using sessionStorage)
   - Keyboard accessible (Enter/Space to toggle)

2. **Accessibility**:
   - ARIA attributes (`aria-expanded`, `aria-controls`)
   - Keyboard navigation support
   - Screen reader announcements

3. **No External Dependencies**:
   - All JavaScript embedded in HTML file
   - No CDN dependencies
   - Works offline

## 13. Testing Strategy

### Unit Tests

1. **HTML Generator Service**:
   - Test HTML generation with all options
   - Test HTML generation with individual options disabled
   - Test HTML structure and validity
   - Test embedded CSS and JavaScript
   - Test filename sanitization

2. **DOC Generator Service**:
   - Test DOC generation with all options
   - Test DOC generation with individual options disabled
   - Test document structure
   - Test formatting

3. **Export Options Modal**:
   - Test component rendering
   - Test checkbox interactions
   - Test format selection
   - Test validation
   - Test export flow

### Integration Tests

1. **API Endpoint**:
   - Test export with all option combinations
   - Test invalid options (400 error)
   - Test authentication (401 error)
   - Test authorization (404 error)
   - Test document generation errors (500 error)

2. **End-to-End Tests**:
   - Test export flow from Meal Plan Editor
   - Test export flow from Dashboard
   - Test modal interaction
   - Test file download
   - Test error handling

### Manual Testing

1. **Export Modal**:
   - Open modal from editor
   - Open modal from dashboard
   - Toggle all checkboxes
   - Select different formats
   - Test validation
   - Test export success
   - Test export error

2. **DOC Export**:
   - Export with all options
   - Export with individual options disabled
   - Verify document structure
   - Verify formatting
   - Open in Microsoft Word

3. **HTML Export**:
   - Export with all options
   - Export with individual options disabled
   - Verify HTML structure
   - Test expand/collapse functionality
   - Test responsive design
   - Test print styles
   - Open in different browsers

## 14. Performance Considerations

1. **Document Generation**:
   - DOC generation: Existing performance considerations apply
   - HTML generation: Should be faster than DOC (no binary encoding)
   - Large meal plans: Monitor memory usage
   - Timeout: Set reasonable timeout (30s) for document generation

2. **Modal Performance**:
   - Modal opens instantly (no API calls on open)
   - Export API call only happens on "Export" button click
   - Loading state provides feedback during export

3. **File Size**:
   - DOC files: Similar size to current implementation (depends on content)
   - HTML files: Larger than DOC (embedded CSS and JavaScript), but still reasonable (< 500KB for typical meal plans)

4. **Client-Side Performance**:
   - Blob URL creation and cleanup
   - File download handling
   - Memory cleanup after download

## 15. Security Considerations

1. **Input Validation**:
   - Validate all query parameters on server side
   - Prevent injection attacks (HTML export)
   - Sanitize user input (meal plan names, content)

2. **Authorization**:
   - Users can only export their own meal plans
   - RLS policies enforce authorization at database level
   - API endpoint validates user ownership

3. **File Download**:
   - Sanitize filenames to prevent path traversal
   - Set appropriate content type headers
   - No sensitive data in error messages

4. **HTML Export**:
   - Sanitize all user-generated content to prevent XSS
   - Escape HTML entities in meal plan content
   - No user-controlled JavaScript execution

## 16. Future Enhancements (Out of Scope)

1. **Saved Export Preferences**:
   - Save user's default export options
   - Remember last used options
   - Quick export with saved preferences

2. **Additional Export Formats**:
   - PDF export
   - CSV export
   - JSON export

3. **Email Sharing**:
   - Send HTML export via email
   - Generate shareable links
   - Email templates

4. **Export Templates**:
   - Customizable export templates
   - Different layouts and styles
   - Branding options

5. **Batch Export**:
   - Export multiple meal plans at once
   - Bulk export with same options
   - ZIP file with multiple exports

