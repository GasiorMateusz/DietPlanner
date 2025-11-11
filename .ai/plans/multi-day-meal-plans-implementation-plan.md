# Multi-Day Meal Plans Implementation Plan

## 1. Overview

### Feature Description

This implementation adds support for creating multi-day meal plans (1-7 days) to the Diet Planner application. The feature extends the existing single-day meal plan functionality, allowing dietitians to create comprehensive weekly meal plans through the same AI-powered workflow.

**Key Changes:**
- Single-day plans are now multi-day plans with exactly 1 day
- Users can select the number of days (1-7) in the startup form
- AI generates all days at once in a single conversation
- Plans are stored using a new database schema with a junction table linking day plans to multi-day plans
- Export functionality is moved to read-only view for all plans
- Editing is done through AI chat conversation (no manual editor)

### User Story

As a dietitian, I want to create multi-day meal plans (1-7 days) for my patients so that I can provide comprehensive weekly nutrition guidance with meal variety and balanced nutrition across multiple days.

### Main Purpose and Functionality

1. **Startup Form Enhancement**: Add number of days selector (1-7), meal variety option (yes/no, default: yes), and option to specify different guidelines per day
2. **AI Generation**: Generate all days at once in a single AI conversation, with ability to refine individual days
3. **Database Storage**: Store multi-day plans with summary data and link to individual day plans
4. **View/Edit Flow**: Read-only view for viewing plans, AI chat interface for editing
5. **Dashboard Integration**: Display multi-day plans as single items with summary information
6. **Export**: Export all days in a single document from read-only view

### Integration with Existing Workflow

The feature integrates seamlessly with the existing workflow:

1. **Startup Form** → Enhanced with multi-day options
2. **AI Chat** → Generates all days at once, allows refinement
3. **View** → Read-only view showing all days (scrollable, future: tabs)
4. **Edit** → Loads into AI chat for conversation-based editing
5. **Export** → Available from read-only view only
6. **Dashboard** → Shows multi-day plans with summary

---

## 2. View Routing

### Existing Routes (Updated)

#### `/app/create` - AI Chat Creation
- **Path**: `/app/create`
- **Layout**: PrivateLayout
- **Access Control**: Authentication required
- **Purpose**: Create new multi-day meal plans (1-7 days) via AI conversation
- **Changes**: Now supports multi-day plan creation

#### `/app/editor` - Removed
- **Status**: Deprecated
- **Reason**: Editing is now done through AI chat interface
- **Migration**: Remove editor route, editing happens in `/app/create` with existing plan context

#### `/app/view/[id]` - Read-Only View (New)
- **Path**: `/app/view/[id]` where `[id]` is the multi-day plan ID
- **Layout**: PrivateLayout
- **Access Control**: Authentication required (own plans only)
- **Purpose**: Display multi-day plan in read-only mode with export functionality
- **Navigation**: Accessed from dashboard "View" button

#### `/app/edit/[id]` - AI Chat Edit (New)
- **Path**: `/app/edit/[id]` where `[id]` is the multi-day plan ID
- **Layout**: PrivateLayout
- **Access Control**: Authentication required (own plans only)
- **Purpose**: Edit existing multi-day plan through AI chat conversation
- **Navigation**: Accessed from read-only view "Edit" button
- **Behavior**: Loads existing plan into AI chat context for editing

### Dashboard Route (Updated)

#### `/app/dashboard` - Dashboard
- **Path**: `/app/dashboard`
- **Layout**: PrivateLayout
- **Access Control**: Authentication required
- **Changes**: 
  - Displays multi-day plans as single items
  - Shows summary information (number of days, average kcal)
  - "View" button navigates to `/app/view/[id]`
  - "Edit" button navigates to `/app/edit/[id]`
  - "Delete" button deletes multi-day plan and all day plans

---

## 3. Component Structure

```
/app/create (Astro Page)
└── PrivateLayout
    └── AIChatInterface (React)
        ├── StartupFormDialog (React) - Enhanced with multi-day options
        │   ├── Input fields (patient data, targets)
        │   ├── Number of days selector (1-7)
        │   ├── Meal variety checkbox (yes/no, default: yes)
        │   ├── Different guidelines per day checkbox
        │   └── Guidelines textarea (conditional)
        ├── MessageList (React)
        │   └── MessageItem (React) - Updated for multi-day display
        │       └── MultiDayMealPlanDisplay (React) - New component
        │           ├── DayPlanCard (React) - New component
        │           │   ├── DailySummaryStaticDisplay (React)
        │           │   └── MealCardReadOnly (React)
        │           └── Scrollable container
        ├── ChatInput (React)
        └── AcceptButton (React) - Accepts all days at once

/app/view/[id] (Astro Page)
└── PrivateLayout
    └── MultiDayPlanView (React) - New component
        ├── PlanSummary (React) - New component
        │   ├── Plan name
        │   ├── Number of days
        │   ├── Average macros
        │   └── Common guidelines
        ├── DaysList (React) - New component
        │   └── DayPlanView (React) - New component
        │       ├── Day header (Day 1, Day 2, etc.)
        │       ├── DailySummaryStaticDisplay (React)
        │       └── MealCardReadOnly (React)
        ├── ExportButton (React) - New component
        └── EditButton (React) - New component

/app/edit/[id] (Astro Page)
└── PrivateLayout
    └── AIChatInterface (React) - Reused with edit context
        ├── MessageList (React)
        │   └── Initial message with existing plan data
        ├── ChatInput (React)
        └── AcceptButton (React) - Updates existing plan

/app/dashboard (Astro Page)
└── PrivateLayout
    └── DashboardView (React) - Updated
        ├── SearchInput (React)
        ├── MealPlanList (React) - Updated
        │   └── MealPlanListItem (React) - Updated
        │       ├── Plan name
        │       ├── Summary badge (X days, avg. Y kcal)
        │       ├── View button
        │       ├── Edit button
        │       └── Delete button
        └── CreateButton (React)
```

---

## 4. Component Details

### StartupFormDialog (Enhanced)

**Component Description**: Modal dialog for collecting patient data and meal plan parameters. Enhanced to support multi-day plans.

**Main Elements**:
- Patient data fields (age, weight, height, activity level)
- Nutritional targets (kcal, macro distribution)
- Meal names input
- **Number of days selector** (1-7) - New
- **Meal variety checkbox** (yes/no, default: yes) - New
- **Different guidelines per day checkbox** - New
- **Guidelines textarea** (conditional, shown when "different guidelines per day" is checked) - New
- Exclusions/guidelines textarea
- Submit button
- Cancel button

**Handled Interactions**:
- User selects number of days (1-7)
- User toggles meal variety option
- User toggles "different guidelines per day" option
- When "different guidelines per day" is checked, guidelines textarea is shown
- Form validation on blur
- Form submission creates AI session with multi-day parameters

**Handled Validation**:
- Number of days: required, integer, between 1 and 7
- Meal variety: boolean (default: true)
- Different guidelines per day: boolean (default: false)
- Guidelines textarea: required if "different guidelines per day" is checked
- All existing validations for patient data and targets

**Types**:
```typescript
interface MultiDayStartupFormData extends MealPlanStartupData {
  number_of_days: number; // 1-7
  ensure_meal_variety: boolean; // default: true
  different_guidelines_per_day: boolean; // default: false
  per_day_guidelines?: string; // optional, shown when different_guidelines_per_day is true
}
```

**Props**:
```typescript
interface StartupFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: MultiDayStartupFormData) => void;
}
```

### AIChatInterface (Enhanced)

**Component Description**: Main AI chat interface for creating and editing meal plans. Enhanced to support multi-day plans.

**Main Elements**:
- Startup form dialog (enhanced)
- Message list (scrollable)
- Chat input (textarea, send button)
- Accept button (accepts all days at once)
- Loading states
- Error messages

**Handled Interactions**:
- Initialize chat session with multi-day startup data
- Display AI responses with multi-day meal plans
- User sends follow-up messages to refine plans
- User can specify which day to refine (e.g., "change Day 3", "regenerate Day 5")
- User accepts all days at once
- Navigate to read-only view after acceptance

**Handled Validation**:
- Session ID must exist before sending messages
- Message length validation (max 2000 characters)
- AI response validation (must contain valid multi-day plan JSON)

**Types**:
- Uses existing `ChatMessage`, `UserChatMessage`, `AssistantChatMessage` types
- New type for multi-day plan in chat context:
```typescript
interface MultiDayPlanChatData {
  days: Array<{
    day_number: number;
    plan_content: MealPlanContent;
    name?: string; // Optional day plan name
  }>;
  summary: {
    number_of_days: number;
    average_kcal: number;
    average_proteins: number;
    average_fats: number;
    average_carbs: number;
  };
}
```

**Props**:
```typescript
interface AIChatInterfaceProps {
  editMode?: boolean; // If true, load existing plan for editing
  existingPlanId?: string; // Multi-day plan ID for edit mode
}
```

### MultiDayPlanView (New)

**Component Description**: Read-only view for displaying multi-day meal plans.

**Main Elements**:
- Plan summary section (name, number of days, average macros, common guidelines)
- Days list (scrollable, future: tabs)
- Export button
- Edit button
- Back to dashboard button

**Handled Interactions**:
- Display plan summary
- Display all days in scrollable list
- Export button opens export functionality
- Edit button navigates to `/app/edit/[id]`
- Back button navigates to dashboard

**Handled Validation**:
- Plan must exist and belong to user
- Plan must have at least one day
- All days must have valid plan content

**Types**:
```typescript
interface MultiDayPlanViewProps {
  planId: string;
}

interface MultiDayPlanViewData {
  id: string;
  name: string;
  number_of_days: number;
  average_kcal: number;
  average_proteins: number;
  average_fats: number;
  average_carbs: number;
  common_exclusions_guidelines: string | null;
  common_allergens: string | null;
  days: Array<{
    day_number: number;
    day_plan: TypedMealPlanRow;
  }>;
  created_at: string;
  updated_at: string;
}
```

### MultiDayMealPlanDisplay (New)

**Component Description**: Component for displaying multi-day meal plans in AI chat messages.

**Main Elements**:
- Days list (scrollable)
- Day plan cards (one per day)
- Day headers (Day 1, Day 2, etc.)
- Daily summaries
- Meal cards

**Handled Interactions**:
- Display all days in scrollable container
- Each day shows daily summary and meals
- Future: Switch between scrollable and tabs view

**Types**:
```typescript
interface MultiDayMealPlanDisplayProps {
  planData: MultiDayPlanChatData;
  editable?: boolean; // If true, allows inline editing (future feature)
}
```

### DayPlanCard (New)

**Component Description**: Card component for displaying a single day plan.

**Main Elements**:
- Day header (Day X)
- Day plan name (if available)
- Daily summary display
- Meal cards (read-only)

**Types**:
```typescript
interface DayPlanCardProps {
  dayNumber: number;
  planContent: MealPlanContent;
  dayName?: string;
}
```

### DashboardView (Updated)

**Component Description**: Dashboard for viewing all meal plans. Updated to show multi-day plans.

**Main Elements**:
- Search input
- Meal plan list
- Create button
- Delete confirmation dialog

**Handled Interactions**:
- Search meal plans by name
- Display multi-day plans with summary badges
- View button navigates to `/app/view/[id]`
- Edit button navigates to `/app/edit/[id]`
- Delete button shows confirmation dialog
- Create button opens startup form

**Changes**:
- Meal plan items now show summary badges (e.g., "7 days, avg. 2000 kcal")
- View/Edit buttons navigate to new routes
- Delete functionality handles multi-day plans (deletes multi-day plan and all day plans)

**Types**:
```typescript
interface MealPlanListItem {
  id: string;
  name: string;
  number_of_days: number;
  average_kcal: number;
  created_at: string;
  updated_at: string;
  is_multi_day: boolean; // Always true for new plans
}
```

### PlanSummary (New)

**Component Description**: Summary section for multi-day plan view.

**Main Elements**:
- Plan name
- Number of days
- Average macros (kcal, proteins, fats, carbs)
- Common guidelines
- Common allergens (if available)

**Types**:
```typescript
interface PlanSummaryProps {
  name: string;
  number_of_days: number;
  average_kcal: number;
  average_proteins: number;
  average_fats: number;
  average_carbs: number;
  common_exclusions_guidelines: string | null;
  common_allergens: string | null;
}
```

### DaysList (New)

**Component Description**: Scrollable list of day plans.

**Main Elements**:
- Day plan views (one per day)
- Scrollable container
- Future: Tabs for switching between days

**Types**:
```typescript
interface DaysListProps {
  days: Array<{
    day_number: number;
    day_plan: TypedMealPlanRow;
  }>;
  viewMode?: "scroll" | "tabs"; // Default: "scroll"
}
```

### DayPlanView (New)

**Component Description**: View component for a single day plan.

**Main Elements**:
- Day header (Day X)
- Day plan name (if available)
- Daily summary
- Meal cards (read-only)

**Types**:
```typescript
interface DayPlanViewProps {
  dayNumber: number;
  dayPlan: TypedMealPlanRow;
}
```

### ExportButton (New)

**Component Description**: Button for exporting multi-day plan to .doc file.

**Main Elements**:
- Export button
- Loading state
- Error handling

**Handled Interactions**:
- Click export button
- Show loading state
- Download .doc file
- Handle errors

**Types**:
```typescript
interface ExportButtonProps {
  planId: string;
  planName: string;
}
```

### EditButton (New)

**Component Description**: Button for editing multi-day plan.

**Main Elements**:
- Edit button

**Handled Interactions**:
- Click edit button
- Navigate to `/app/edit/[id]`

**Types**:
```typescript
interface EditButtonProps {
  planId: string;
}
```

---

## 5. Types

### Database Types

#### MultiDayPlanRow
```typescript
export type TypedMultiDayPlanRow = Omit<Tables<"multi_day_plans">, "common_allergens"> & {
  common_allergens: string[] | null; // Parsed from JSON or comma-separated string
};
```

#### MultiDayPlanDaysRow
```typescript
export type TypedMultiDayPlanDaysRow = Tables<"multi_day_plan_days">;
```

### API DTOs

#### CreateMultiDayPlanCommand
```typescript
export interface CreateMultiDayPlanCommand {
  name: string;
  source_chat_session_id: string;
  number_of_days: number;
  common_exclusions_guidelines: string | null;
  common_allergens: string[] | null;
  day_plans: Array<{
    day_number: number;
    plan_content: MealPlanContent;
    startup_data: MealPlanStartupData;
    name?: string; // Optional day plan name
  }>;
}
```

#### CreateMultiDayPlanResponseDto
```typescript
export type CreateMultiDayPlanResponseDto = TypedMultiDayPlanRow & {
  days: Array<{
    day_number: number;
    day_plan: TypedMealPlanRow;
  }>;
};
```

#### GetMultiDayPlanByIdResponseDto
```typescript
export type GetMultiDayPlanByIdResponseDto = TypedMultiDayPlanRow & {
  days: Array<{
    day_number: number;
    day_plan: TypedMealPlanRow;
  }>;
};
```

#### UpdateMultiDayPlanCommand
```typescript
export interface UpdateMultiDayPlanCommand {
  name?: string;
  day_plans?: Array<{
    day_number: number;
    plan_content: MealPlanContent;
    startup_data: MealPlanStartupData;
    name?: string;
  }>;
  common_exclusions_guidelines?: string | null;
  common_allergens?: string[] | null;
}
```

#### GetMultiDayPlansResponseDto
```typescript
export type GetMultiDayPlansResponseDto = Array<{
  id: string;
  name: string;
  number_of_days: number;
  average_kcal: number;
  average_proteins: number;
  average_fats: number;
  average_carbs: number;
  created_at: string;
  updated_at: string;
}>;
```

#### MultiDayPlanListItemDto
```typescript
export type MultiDayPlanListItemDto = {
  id: string;
  name: string;
  number_of_days: number;
  average_kcal: number;
  created_at: string;
  updated_at: string;
};
```

### Form Types

#### MultiDayStartupFormData
```typescript
export interface MultiDayStartupFormData extends MealPlanStartupData {
  number_of_days: number; // 1-7
  ensure_meal_variety: boolean; // default: true
  different_guidelines_per_day: boolean; // default: false
  per_day_guidelines?: string; // optional, shown when different_guidelines_per_day is true
}
```

#### MultiDayPlanChatData
```typescript
export interface MultiDayPlanChatData {
  days: Array<{
    day_number: number;
    plan_content: MealPlanContent;
    name?: string;
  }>;
  summary: {
    number_of_days: number;
    average_kcal: number;
    average_proteins: number;
    average_fats: number;
    average_carbs: number;
  };
}
```

### AI Session Types

#### CreateMultiDayAiSessionCommand
```typescript
export interface CreateMultiDayAiSessionCommand extends MultiDayStartupFormData {
  // Extends MultiDayStartupFormData with AI-specific fields
}
```

#### CreateMultiDayAiSessionResponseDto
```typescript
export interface CreateMultiDayAiSessionResponseDto {
  session_id: string;
  message: AssistantChatMessage;
  prompt_count: number;
}
```

### Export Types

#### ExportMultiDayPlanRequest
```typescript
export interface ExportMultiDayPlanRequest {
  content: ExportContentOptions;
  format: ExportFormat;
}
```

---

## 6. State Management

### AIChatInterface State

**Local State**:
- `chatState`: Message history, loading state, error state, prompt count
- `sessionId`: Current AI session ID
- `startupData`: Startup form data
- `editMode`: Boolean flag for edit mode
- `existingPlanId`: Multi-day plan ID for edit mode

**State Flow**:
1. Component mounts
2. If edit mode: Load existing plan and initialize chat with plan context
3. If create mode: Wait for startup form submission
4. On startup form submission: Create AI session with multi-day parameters
5. On AI response: Update message history, extract multi-day plan data
6. On user message: Send message to AI, update message history
7. On accept: Create multi-day plan with all day plans, navigate to view

### MultiDayPlanView State

**Local State**:
- `planData`: Multi-day plan data with days
- `isLoading`: Loading state
- `error`: Error state
- `isExporting`: Export loading state

**State Flow**:
1. Component mounts
2. Load multi-day plan from API
3. Display plan summary and days
4. On export: Call export API, download file
5. On edit: Navigate to edit route

### DashboardView State

**Local State**:
- `mealPlans`: List of meal plans (multi-day plans)
- `searchQuery`: Search input value
- `isLoading`: Loading state
- `error`: Error state
- `deleteDialogOpen`: Delete confirmation dialog state
- `selectedPlanId`: Plan ID for deletion

**State Flow**:
1. Component mounts
2. Load meal plans from API
3. On search: Filter meal plans by name
4. On view: Navigate to view route
5. On edit: Navigate to edit route
6. On delete: Show confirmation dialog, delete on confirm

### StartupFormDialog State

**Local State**:
- Form state (React Hook Form)
- `numberOfDays`: Number of days (1-7)
- `ensureMealVariety`: Boolean (default: true)
- `differentGuidelinesPerDay`: Boolean (default: false)
- `showPerDayGuidelines`: Boolean (computed from differentGuidelinesPerDay)

**State Flow**:
1. Component mounts with default values
2. User changes number of days
3. User toggles meal variety option
4. User toggles different guidelines per day
5. On submit: Validate and submit form data

### Custom Hooks

#### useMultiDayPlan
```typescript
interface UseMultiDayPlanProps {
  planId: string;
}

interface UseMultiDayPlanReturn {
  planData: MultiDayPlanViewData | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}
```

#### useMultiDayPlanExport
```typescript
interface UseMultiDayPlanExportProps {
  planId: string;
  planName: string;
}

interface UseMultiDayPlanExportReturn {
  exportPlan: (options: ExportOptions) => Promise<void>;
  isExporting: boolean;
  error: Error | null;
}
```

#### useMultiDayPlansList
```typescript
interface UseMultiDayPlansListProps {
  searchQuery?: string;
}

interface UseMultiDayPlansListReturn {
  plans: MultiDayPlanListItemDto[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}
```

---

## 7. API Integration

### New Endpoints

#### POST /api/multi-day-plans
**Description**: Create a new multi-day meal plan with day plans.

**Request Body**:
```typescript
CreateMultiDayPlanCommand
```

**Response**:
```typescript
CreateMultiDayPlanResponseDto (201 Created)
```

**Authentication**: Required

**Validation**:
- `name`: Required, string, max 255 characters
- `number_of_days`: Required, integer, between 1 and 7
- `day_plans`: Required, array, length must match `number_of_days`
- Each day plan must have valid `plan_content` and `startup_data`
- `day_number` must be unique and sequential (1, 2, 3, ...)

#### GET /api/multi-day-plans
**Description**: Get all multi-day meal plans for the authenticated user.

**Query Parameters**:
- `search` (string, optional): Search by name
- `sort` (string, optional): Sort field (default: "updated_at")
- `order` (string, optional): Sort order (default: "desc")

**Response**:
```typescript
GetMultiDayPlansResponseDto (200 OK)
```

**Authentication**: Required

#### GET /api/multi-day-plans/[id]
**Description**: Get a single multi-day meal plan by ID.

**Path Parameters**:
- `id` (uuid, required): Multi-day plan ID

**Response**:
```typescript
GetMultiDayPlanByIdResponseDto (200 OK)
```

**Authentication**: Required (own plans only)

#### PUT /api/multi-day-plans/[id]
**Description**: Update a multi-day meal plan.

**Path Parameters**:
- `id` (uuid, required): Multi-day plan ID

**Request Body**:
```typescript
UpdateMultiDayPlanCommand
```

**Response**:
```typescript
GetMultiDayPlanByIdResponseDto (200 OK)
```

**Authentication**: Required (own plans only)

**Validation**:
- `name`: Optional, string, max 255 characters
- `day_plans`: Optional, array, must have valid structure
- If `day_plans` is provided, all days must be included

#### DELETE /api/multi-day-plans/[id]
**Description**: Delete a multi-day meal plan and all associated day plans.

**Path Parameters**:
- `id` (uuid, required): Multi-day plan ID

**Response**:
```
204 No Content
```

**Authentication**: Required (own plans only)

**Behavior**:
- Deletes multi-day plan
- Deletes all associated day plans (cascade)
- Deletes all junction records (cascade)

#### GET /api/multi-day-plans/[id]/export
**Description**: Export multi-day meal plan to .doc file.

**Path Parameters**:
- `id` (uuid, required): Multi-day plan ID

**Query Parameters**:
- `content` (JSON string, optional): Export content options
- `format` (string, optional): Export format (default: "doc")

**Response**:
```
200 OK
Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document
Content-Disposition: attachment; filename="plan-name.docx"
```

**Authentication**: Required (own plans only)

### Updated Endpoints

#### POST /api/ai/sessions
**Description**: Create a new AI chat session. Updated to support multi-day plans.

**Request Body**:
```typescript
CreateMultiDayAiSessionCommand
```

**Response**:
```typescript
CreateMultiDayAiSessionResponseDto (201 Created)
```

**Changes**:
- Accepts `number_of_days`, `ensure_meal_variety`, `different_guidelines_per_day`, `per_day_guidelines`
- AI system prompt updated to generate multi-day plans
- AI user prompt includes multi-day parameters

#### POST /api/ai/sessions/[id]/message
**Description**: Send a message to AI chat session. Updated to support multi-day plan refinement.

**Request Body**:
```typescript
SendAiMessageCommand
```

**Response**:
```typescript
SendAiMessageResponseDto (200 OK)
```

**Changes**:
- AI can refine specific days based on user instructions
- AI maintains context of all days when refining

### API Client Functions

#### multiDayPlansApi
```typescript
export const multiDayPlansApi = {
  async create(command: CreateMultiDayPlanCommand): Promise<CreateMultiDayPlanResponseDto>;
  async getAll(filters?: ListFilters): Promise<GetMultiDayPlansResponseDto>;
  async getById(id: string): Promise<GetMultiDayPlanByIdResponseDto>;
  async update(id: string, command: UpdateMultiDayPlanCommand): Promise<GetMultiDayPlanByIdResponseDto>;
  async delete(id: string): Promise<void>;
  async export(id: string, options: ExportOptions): Promise<Blob>;
};
```

### Error Codes

- `400 Bad Request`: Validation failed
- `401 Unauthorized`: User is not authenticated
- `404 Not Found`: Multi-day plan not found or doesn't belong to user
- `500 Internal Server Error`: Server error
- `502 Bad Gateway`: Error communicating with OpenRouter API

---

## 8. User Interactions

### Creating a Multi-Day Plan

**Interaction**: User clicks "Create Plan" button on dashboard
**Expected Outcome**: Startup form dialog opens
**Implementation**: 
- `DashboardView` renders `StartupFormDialog`
- Dialog shows enhanced form with multi-day options

**Interaction**: User fills out startup form with multi-day parameters
**Expected Outcome**: Form validates and submits
**Implementation**:
- `StartupFormDialog` validates form data
- On submit, calls `onSubmit` callback with `MultiDayStartupFormData`
- `AIChatInterface` receives data and creates AI session

**Interaction**: User submits startup form
**Expected Outcome**: AI chat session is created, first AI message is displayed
**Implementation**:
- `AIChatInterface` calls `POST /api/ai/sessions` with multi-day parameters
- AI generates multi-day plan (all days at once)
- Response is displayed in message list

**Interaction**: User views AI-generated multi-day plan
**Expected Outcome**: All days are displayed in scrollable list
**Implementation**:
- `MultiDayMealPlanDisplay` component renders all days
- Each day shows daily summary and meals
- Days are displayed in order (Day 1, Day 2, etc.)

**Interaction**: User sends follow-up message to refine plan
**Expected Outcome**: AI responds with updated plan
**Implementation**:
- User types message in chat input
- `AIChatInterface` calls `POST /api/ai/sessions/[id]/message`
- AI processes message and generates updated plan
- Response is displayed in message list

**Interaction**: User specifies which day to refine (e.g., "change Day 3")
**Expected Outcome**: AI refines only the specified day while maintaining other days
**Implementation**:
- User message includes day specification
- AI system prompt instructs to maintain context of all days
- AI generates updated plan with refined day

**Interaction**: User accepts the plan
**Expected Outcome**: Multi-day plan is created, user is navigated to view
**Implementation**:
- `AIChatInterface` extracts multi-day plan data from last AI message
- Calls `POST /api/multi-day-plans` with all day plans
- Navigates to `/app/view/[id]`

### Viewing a Multi-Day Plan

**Interaction**: User clicks "View" button on dashboard
**Expected Outcome**: Read-only view of multi-day plan is displayed
**Implementation**:
- `DashboardView` navigates to `/app/view/[id]`
- `MultiDayPlanView` loads plan from API
- Displays plan summary and all days

**Interaction**: User scrolls through days
**Expected Outcome**: All days are displayed in scrollable list
**Implementation**:
- `DaysList` component renders all days
- Each day is displayed in `DayPlanView` component
- Container is scrollable

**Interaction**: User clicks "Export" button
**Expected Outcome**: .doc file is downloaded
**Implementation**:
- `ExportButton` calls `GET /api/multi-day-plans/[id]/export`
- File is downloaded with plan name as filename
- Loading state is shown during export

**Interaction**: User clicks "Edit" button
**Expected Outcome**: User is navigated to edit route
**Implementation**:
- `EditButton` navigates to `/app/edit/[id]`
- `AIChatInterface` loads existing plan and initializes chat

### Editing a Multi-Day Plan

**Interaction**: User clicks "Edit" button in view
**Expected Outcome**: AI chat interface loads with existing plan context
**Implementation**:
- `AIChatInterface` in edit mode loads existing plan
- Creates initial AI message with plan data
- Displays plan in chat context

**Interaction**: User sends edit instruction
**Expected Outcome**: AI generates updated plan
**Implementation**:
- User types edit instruction
- `AIChatInterface` calls `POST /api/ai/sessions/[id]/message`
- AI processes instruction and generates updated plan
- Response is displayed in message list

**Interaction**: User accepts edited plan
**Expected Outcome**: Multi-day plan is updated, user is navigated to view
**Implementation**:
- `AIChatInterface` extracts updated plan data
- Calls `PUT /api/multi-day-plans/[id]` with updated day plans
- Navigates to `/app/view/[id]`

### Deleting a Multi-Day Plan

**Interaction**: User clicks "Delete" button on dashboard
**Expected Outcome**: Confirmation dialog is shown
**Implementation**:
- `DashboardView` shows `DeleteConfirmationDialog`
- Dialog displays plan name and confirmation message

**Interaction**: User confirms deletion
**Expected Outcome**: Multi-day plan and all day plans are deleted
**Implementation**:
- `DashboardView` calls `DELETE /api/multi-day-plans/[id]`
- API deletes multi-day plan and all day plans (cascade)
- Dashboard refreshes to remove deleted plan

### Searching Multi-Day Plans

**Interaction**: User types in search input
**Expected Outcome**: Meal plans are filtered by name
**Implementation**:
- `DashboardView` debounces search input
- Calls `GET /api/multi-day-plans?search=query`
- Updates meal plan list with filtered results

---

## 9. Conditions and Validation

### Client-Side Validation

#### Startup Form Validation
- **Number of days**: Required, integer, between 1 and 7
- **Meal variety**: Boolean (default: true)
- **Different guidelines per day**: Boolean (default: false)
- **Per-day guidelines**: Required if "different guidelines per day" is checked
- **Patient data**: Same as existing validation (age, weight, height, activity level)
- **Nutritional targets**: Same as existing validation (kcal, macro distribution)
- **Meal names**: Optional, string
- **Exclusions/guidelines**: Optional, string

#### Chat Input Validation
- **Message length**: Maximum 2000 characters
- **Message content**: Cannot be empty or whitespace only
- **Session ID**: Must exist before sending messages

#### Plan Acceptance Validation
- **Plan data**: Must contain valid multi-day plan structure
- **Number of days**: Must match number of days specified in startup form
- **Day plans**: All days must have valid `plan_content`
- **Daily summaries**: All daily summaries must be valid

### Server-Side Validation

#### Create Multi-Day Plan Validation
- **Name**: Required, string, max 255 characters
- **Number of days**: Required, integer, between 1 and 7
- **Day plans**: Required, array, length must match `number_of_days`
- **Day numbers**: Must be unique and sequential (1, 2, 3, ...)
- **Plan content**: Each day plan must have valid `plan_content`
- **Startup data**: Each day plan must have valid `startup_data`
- **User ID**: Must match authenticated user

#### Update Multi-Day Plan Validation
- **Name**: Optional, string, max 255 characters if provided
- **Day plans**: Optional, array, must have valid structure if provided
- **Day numbers**: Must be unique and sequential if `day_plans` is provided
- **Plan content**: Each day plan must have valid `plan_content` if provided
- **User ID**: Must match authenticated user
- **Plan ID**: Must exist and belong to user

#### Delete Multi-Day Plan Validation
- **Plan ID**: Must exist and belong to user
- **User ID**: Must match authenticated user

### Business Logic Conditions

#### Plan Creation
- Multi-day plan can only be created after AI session is completed
- All day plans must be created before multi-day plan is created
- Day plans must be linked to multi-day plan via junction table
- Summary must be calculated from day plans

#### Plan Editing
- Plan can only be edited by owner
- Editing creates new AI session with existing plan context
- Updated plan can create new day plans or update existing ones
- Summary must be recalculated after update

#### Plan Deletion
- Deleting multi-day plan deletes all day plans (cascade)
- Deleting last day plan deletes multi-day plan
- Deleting day plan updates multi-day plan summary

#### Export
- Export can only be performed on completed plans
- Export includes all days in single document
- Export options (content, format) are applied to all days

### Access Control Conditions

#### Authentication
- All API endpoints require authentication
- User must be authenticated to create, view, edit, or delete plans

#### Authorization
- Users can only access their own plans
- RLS policies enforce user ownership
- API endpoints verify user ownership before operations

#### Plan Ownership
- Multi-day plan `user_id` must match authenticated user
- Day plan `user_id` must match authenticated user
- Junction table records are automatically filtered by RLS

---

## 10. Error Handling

### Validation Errors

#### Startup Form Validation Errors
- **Display**: Inline error messages below form fields
- **Triggers**: On blur, on submit
- **Messages**: Translated error messages from validation schemas
- **Recovery**: User corrects form fields and resubmits

#### Chat Input Validation Errors
- **Display**: Error message below chat input
- **Triggers**: On submit if validation fails
- **Messages**: "Message is too long" or "Message cannot be empty"
- **Recovery**: User shortens message or adds content

#### Plan Acceptance Validation Errors
- **Display**: Error alert at top of chat interface
- **Triggers**: On accept if plan data is invalid
- **Messages**: "Invalid plan data" or "Plan is incomplete"
- **Recovery**: User continues conversation to fix plan

### API Errors

#### 400 Bad Request
- **Cause**: Validation failed on server
- **Display**: Error message with validation details
- **Recovery**: User corrects input and resubmits

#### 401 Unauthorized
- **Cause**: User is not authenticated
- **Display**: Automatic redirect to `/auth/login`
- **Recovery**: User logs in and retries

#### 404 Not Found
- **Cause**: Plan not found or doesn't belong to user
- **Display**: Error message "Plan not found"
- **Recovery**: User navigates back to dashboard

#### 500 Internal Server Error
- **Cause**: Server error
- **Display**: Generic error message "An error occurred"
- **Recovery**: User retries operation or contacts support

#### 502 Bad Gateway
- **Cause**: Error communicating with OpenRouter API
- **Display**: Error message "AI service is temporarily unavailable"
- **Recovery**: User retries operation after delay

### Network Errors

#### Connection Timeout
- **Cause**: Network timeout
- **Display**: Error message "Request timed out"
- **Recovery**: User retries operation

#### Network Offline
- **Display**: Error message "No internet connection"
- **Recovery**: User checks connection and retries

### Edge Cases

#### Empty Plan List
- **Display**: Empty state message "No meal plans yet"
- **Recovery**: User creates new plan

#### Plan Load Failure
- **Display**: Error message "Failed to load plan"
- **Recovery**: User navigates back to dashboard and retries

#### Export Failure
- **Display**: Error message "Failed to export plan"
- **Recovery**: User retries export or contacts support

#### AI Response Parsing Failure
- **Display**: Error message "Invalid AI response"
- **Recovery**: User continues conversation to get valid response

#### Day Plan Deletion Edge Case
- **Scenario**: User deletes last day plan
- **Behavior**: Multi-day plan is automatically deleted
- **Display**: Success message "Plan deleted"
- **Recovery**: N/A (plan is deleted)

### Error Display Priority

1. **Critical Errors**: Displayed as alerts at top of page (401, 500, network errors)
2. **Validation Errors**: Displayed inline with form fields
3. **Non-Critical Errors**: Displayed as toast notifications or inline messages
4. **Loading States**: Shown during async operations

### Error Logging

- All errors are logged to console in development
- Server errors are logged to server logs
- Client errors are logged with context (component, action, error details)
- AI errors are logged with session ID and message history

---

## 11. Implementation Steps

### Phase 1: Database Schema and Migrations

1. **Create database migration for multi-day plans**
   - Create `multi_day_plans` table
   - Create `multi_day_plan_days` junction table
   - Add `is_day_plan` column to `meal_plans` table
   - Create indexes
   - Create RLS policies
   - Create triggers for summary calculation
   - Test migration on local database

2. **Update database types**
   - Generate new Supabase types
   - Update `src/db/database.types.ts`
   - Create typed versions of new tables
   - Test type generation

3. **Create database service functions**
   - Create `multi-day-plan.service.ts`
   - Implement CRUD operations
   - Implement summary calculation
   - Implement day plan linking
   - Test service functions

### Phase 2: Types and Validation

4. **Create TypeScript types**
   - Add multi-day plan types to `src/types.ts`
   - Create API DTOs
   - Create form types
   - Create component prop types
   - Test type definitions

5. **Create validation schemas**
   - Create `multi-day-plans.schemas.ts`
   - Add Zod schemas for multi-day plans
   - Add validation for startup form
   - Add validation for API requests
   - Test validation schemas

### Phase 3: API Endpoints

6. **Create API endpoints**
   - Create `POST /api/multi-day-plans`
   - Create `GET /api/multi-day-plans`
   - Create `GET /api/multi-day-plans/[id]`
   - Create `PUT /api/multi-day-plans/[id]`
   - Create `DELETE /api/multi-day-plans/[id]`
   - Create `GET /api/multi-day-plans/[id]/export`
   - Test API endpoints

7. **Update AI session endpoints**
   - Update `POST /api/ai/sessions` for multi-day support
   - Update `POST /api/ai/sessions/[id]/message` for multi-day support
   - Update AI service for multi-day plan generation
   - Test AI session endpoints

8. **Create API client functions**
   - Create `multi-day-plans.client.ts`
   - Implement API client functions
   - Add error handling
   - Test API client functions

### Phase 4: AI Service Updates

9. **Update AI session service**
   - Update `formatSystemPrompt` for multi-day plans
   - Update `formatUserPrompt` for multi-day parameters
   - Update response parsing for multi-day plans
   - Test AI service updates

10. **Update export service**
    - Update `doc-generator.service.ts` for multi-day plans
    - Implement multi-day export template
    - Test export functionality

### Phase 5: Component Development

11. **Update StartupFormDialog**
    - Add number of days selector
    - Add meal variety checkbox
    - Add different guidelines per day checkbox
    - Add conditional guidelines textarea
    - Update form validation
    - Test component

12. **Update AIChatInterface**
    - Add multi-day plan support
    - Update message display for multi-day plans
    - Update plan acceptance for multi-day plans
    - Add edit mode support
    - Test component

13. **Create MultiDayMealPlanDisplay**
    - Create component for displaying multi-day plans in chat
    - Implement day plan cards
    - Implement scrollable container
    - Test component

14. **Create MultiDayPlanView**
    - Create read-only view component
    - Implement plan summary
    - Implement days list
    - Implement export button
    - Implement edit button
    - Test component

15. **Create supporting components**
    - Create `PlanSummary` component
    - Create `DaysList` component
    - Create `DayPlanView` component
    - Create `ExportButton` component
    - Create `EditButton` component
    - Test components

16. **Update DashboardView**
    - Update to show multi-day plans
    - Add summary badges
    - Update view/edit/delete buttons
    - Test component

### Phase 6: Custom Hooks

17. **Create custom hooks**
    - Create `useMultiDayPlan` hook
    - Create `useMultiDayPlanExport` hook
    - Create `useMultiDayPlansList` hook
    - Test hooks

18. **Update existing hooks**
    - Update `useStartupForm` for multi-day support
    - Update `useAIChatForm` for multi-day support
    - Test hooks

### Phase 7: Routes and Navigation

19. **Create Astro pages**
    - Create `/app/view/[id].astro`
    - Create `/app/edit/[id].astro`
    - Update `/app/create.astro` if needed
    - Update `/app/dashboard.astro` if needed
    - Test routes

20. **Update navigation**
    - Update dashboard navigation
    - Update view navigation
    - Update edit navigation
    - Test navigation

### Phase 8: Testing

21. **Unit tests**
    - Test validation schemas
    - Test service functions
    - Test API client functions
    - Test custom hooks
    - Test components

22. **Integration tests**
    - Test API endpoints
    - Test database operations
    - Test AI service integration
    - Test export functionality

23. **E2E tests**
    - Test multi-day plan creation flow
    - Test multi-day plan viewing flow
    - Test multi-day plan editing flow
    - Test multi-day plan deletion flow
    - Test export flow

### Phase 9: Migration and Cleanup

24. **Migrate existing single-day plans**
    - Create migration script to convert single-day plans to multi-day plans
    - Test migration script
    - Run migration on database
    - Verify migration results

25. **Remove deprecated code**
    - Remove editor route
    - Remove editor components (if not needed)
    - Remove manual editing functionality
    - Update documentation

26. **Update translations**
    - Add translations for multi-day plan features
    - Update existing translations
    - Test translations

### Phase 10: Documentation and Polish

27. **Update documentation**
    - Update API documentation
    - Update component documentation
    - Update user guide
    - Update developer guide

28. **Polish UI/UX**
    - Improve loading states
    - Improve error messages
    - Improve accessibility
    - Improve responsive design

29. **Performance optimization**
    - Optimize database queries
    - Optimize API responses
    - Optimize component rendering
    - Test performance

30. **Final testing**
    - Test all user flows
    - Test error handling
    - Test edge cases
    - Test accessibility
    - Test responsive design
    - Test performance

---

## 12. Additional Considerations

### Accessibility

- All interactive elements must be keyboard accessible
- All form fields must have proper labels
- All error messages must be announced to screen readers
- All loading states must be announced to screen readers
- All multi-day plan displays must be accessible

### Responsive Design

- Startup form must be responsive (mobile, tablet, desktop)
- Chat interface must be responsive
- View interface must be responsive
- Dashboard must be responsive
- Export must work on all devices

### Performance

- Database queries must be optimized with indexes
- API responses must be paginated if needed
- Component rendering must be optimized
- Large multi-day plans must be handled efficiently
- Export must be efficient for large plans

### Security

- All API endpoints must be authenticated
- All database operations must use RLS
- All user inputs must be validated
- All AI responses must be validated
- All file exports must be secure

### Future Enhancements

- Tabs view for multi-day plans (instead of scrollable)
- Draft saving for mid-creation plans
- Plan templates
- Plan sharing
- Plan versioning
- Plan comparison
- Nutritional analysis across days
- Shopping list generation

---

## 13. Migration Strategy

### Existing Single-Day Plans

**Approach**: Convert all existing single-day plans to multi-day plans with 1 day.

**Steps**:
1. Create migration script
2. For each single-day plan:
   - Create multi-day plan record
   - Link day plan to multi-day plan via junction table
   - Calculate summary from day plan
   - Mark day plan as `is_day_plan = true`
3. Verify migration results
4. Test migrated plans

**Rollback**: Keep original single-day plans until migration is verified.

### Database Migration

**Approach**: Create new tables alongside existing tables, migrate data, then remove old structure if needed.

**Steps**:
1. Create new tables (`multi_day_plans`, `multi_day_plan_days`)
2. Add `is_day_plan` column to `meal_plans`
3. Migrate existing data
4. Verify migration
5. Update application code
6. Test application
7. Remove old structure if needed

**Rollback**: Keep old structure until new structure is verified.

### Code Migration

**Approach**: Gradual migration, feature flag for multi-day support.

**Steps**:
1. Add feature flag for multi-day support
2. Implement multi-day features behind feature flag
3. Test multi-day features
4. Enable feature flag for testing
5. Migrate existing plans
6. Enable feature flag for all users
7. Remove feature flag and old code

**Rollback**: Disable feature flag to revert to single-day plans.

---

## 14. Testing Strategy

### Unit Tests

- Test validation schemas
- Test service functions
- Test API client functions
- Test custom hooks
- Test utility functions
- Test component rendering
- Test component interactions

### Integration Tests

- Test API endpoints
- Test database operations
- Test AI service integration
- Test export functionality
- Test authentication/authorization
- Test error handling

### E2E Tests

- Test multi-day plan creation flow
- Test multi-day plan viewing flow
- Test multi-day plan editing flow
- Test multi-day plan deletion flow
- Test export flow
- Test search functionality
- Test error scenarios
- Test edge cases

### Performance Tests

- Test database query performance
- Test API response times
- Test component rendering performance
- Test export performance for large plans
- Test concurrent user operations

### Accessibility Tests

- Test keyboard navigation
- Test screen reader compatibility
- Test ARIA attributes
- Test focus management
- Test error announcements

### Responsive Tests

- Test mobile layout
- Test tablet layout
- Test desktop layout
- Test different screen sizes
- Test different browsers

---

## 15. Deployment Checklist

### Pre-Deployment

- [ ] All tests passing
- [ ] Database migration tested
- [ ] API endpoints tested
- [ ] Components tested
- [ ] E2E tests passing
- [ ] Performance tests passing
- [ ] Accessibility tests passing
- [ ] Responsive tests passing
- [ ] Documentation updated
- [ ] Translations updated

### Deployment

- [ ] Backup database
- [ ] Run database migration
- [ ] Deploy application code
- [ ] Verify deployment
- [ ] Test critical user flows
- [ ] Monitor error logs
- [ ] Monitor performance metrics

### Post-Deployment

- [ ] Verify all features working
- [ ] Monitor user feedback
- [ ] Monitor error rates
- [ ] Monitor performance metrics
- [ ] Fix any issues
- [ ] Update documentation if needed

---

## 16. Rollback Plan

### Database Rollback

- Keep old database structure until new structure is verified
- Create rollback migration script
- Test rollback migration
- Document rollback procedure

### Code Rollback

- Keep old code until new code is verified
- Use feature flag to enable/disable multi-day support
- Test rollback procedure
- Document rollback procedure

### Data Rollback

- Backup database before migration
- Keep backup until migration is verified
- Test data restoration
- Document data restoration procedure

---

## Conclusion

This implementation plan provides a comprehensive guide for implementing multi-day meal plans in the Diet Planner application. The plan covers all aspects of the feature, from database schema to user interface, and includes detailed steps for implementation, testing, and deployment.

The key changes are:
- Single-day plans are now multi-day plans with 1 day
- Users can create plans with 1-7 days
- AI generates all days at once
- Editing is done through AI chat conversation
- Export is available from read-only view
- Dashboard shows multi-day plans with summaries

The implementation follows the existing patterns and architecture of the application, ensuring consistency and maintainability.

