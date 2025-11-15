# Multi-Day Meal Plans - Implementation Summary

## Overview

This document summarizes the complete implementation of the multi-day meal plans feature. The feature allows users to create, view, edit, and export meal plans spanning 1-7 days with AI-powered generation.

## Implementation Status

✅ **Frontend**: Complete  
✅ **Backend API**: Complete  
✅ **Database Migration**: Complete  
✅ **Dashboard Integration**: Complete (multi-day plans displayed in dashboard)  
✅ **Edit Mode**: Complete (edit via AI chat interface)  
✅ **Export**: Complete (DOC and HTML formats with customizable options)  
⏳ **Testing**: Pending

## Architecture

### Frontend Structure

#### Components
- **`src/components/MultiDayPlanView.tsx`** - Main read-only view component
- **`src/components/MultiDayPlanViewWrapper.tsx`** - Wrapper with translation context
- **`src/components/PlanSummary.tsx`** - Displays plan summary (name, days, averages)
- **`src/components/DaysList.tsx`** - Scrollable list of day plans
- **`src/components/DayPlanView.tsx`** - Individual day display in view mode
- **`src/components/DayPlanCard.tsx`** - Day card for chat interface
- **`src/components/MultiDayMealPlanDisplay.tsx`** - Display in AI chat interface
- **`src/components/ExportButton.tsx`** - Export button with modal
- **`src/components/EditButton.tsx`** - Navigation to edit mode

#### Hooks
- **`src/components/hooks/useMultiDayPlan.ts`** - Fetch single multi-day plan
- **`src/components/hooks/useMultiDayPlanExport.ts`** - Handle export functionality
- **`src/components/hooks/useMultiDayPlansList.ts`** - Fetch and manage list of multi-day plans (used by dashboard)
- **`src/components/hooks/useStartupForm.ts`** - Updated for multi-day form data

#### Pages
- **`src/pages/app/view/[id].astro`** - Read-only view page
- **`src/pages/app/edit/[id].astro`** - Edit page (AI chat interface)

#### API Client
- **`src/lib/api/multi-day-plans.client.ts`** - Frontend API client with all CRUD operations

### Backend Structure

#### API Endpoints
- **`src/pages/api/multi-day-plans/index.ts`** - GET (list) and POST (create)
- **`src/pages/api/multi-day-plans/[id].ts`** - GET, PUT, DELETE
- **`src/pages/api/multi-day-plans/[id]/export.ts`** - GET export (DOC/HTML)

#### Services
- **`src/lib/multi-day-plans/multi-day-plan.service.ts`** - Business logic for CRUD operations

#### Validation
- **`src/lib/validation/meal-plans.schemas.ts`** - Zod schemas for validation

#### Export
- **`src/lib/meal-plans/doc-generator.service.ts`** - Added `generateMultiDayDoc` function

### Types

All types are defined in **`src/types.ts`**:

```typescript
// Core Types
- TypedMultiDayPlanRow
- TypedMultiDayPlanDaysRow
- MultiDayStartupFormData
- MultiDayPlanChatData

// API Commands
- CreateMultiDayPlanCommand
- UpdateMultiDayPlanCommand
- CreateMultiDayAiSessionCommand

// API DTOs
- CreateMultiDayPlanResponseDto
- GetMultiDayPlanByIdResponseDto
- GetMultiDayPlansResponseDto
- MultiDayPlanListItemDto
- CreateMultiDayAiSessionResponseDto
- MultiDayPlanViewData
```

## Key Features

### 1. AI-Powered Generation
- Extended `StartupFormDialog` with multi-day options:
  - Number of days (1-7)
  - Ensure meal variety checkbox
  - Different guidelines per day option
  - Per-day guidelines textarea (conditional)
- AI chat interface detects multi-day plans and displays accordingly
- Parses multi-day JSON responses from AI

### 2. View & Display
- Read-only view page (`/app/view/[id]`)
- Plan summary with averages
- Scrollable list of all days
- Each day shows:
  - Day number and optional name
  - Daily summary (macros)
  - All meals with details

### 3. CRUD Operations
- **Create**: Creates multi-day plan and links individual day plans
- **Read**: Lists all plans with search/sort, or gets single plan with all days
- **Update**: Updates plan metadata and/or replaces day plans
- **Delete**: Cascade deletes all linked day plans

### 4. Export
- DOC format: Complete document with all days
- HTML format: Formatted HTML with all days
- Customizable content options:
  - Daily summary
  - Meals summary
  - Ingredients
  - Preparation

### 5. Integration Points
- **AI Chat**: Detects multi-day plans and handles acceptance differently. Supports both create and edit modes for multi-day plans
- **Dashboard**: ✅ Fully integrated - Shows multi-day plans in list with summary information (number of days, average kcal). Supports search, sort, view, edit, export, and delete operations
- **Session Storage**: Uses sessionStorage for startup data passing
- **Edit Mode**: ✅ Complete - Edit existing multi-day plans via AI chat interface with overwrite/new plan options

## Data Flow

### Creation Flow
1. User fills startup form with multi-day options
2. Data stored in sessionStorage
3. Navigate to `/app/create`
4. AI chat interface initializes with multi-day data
5. AI generates multi-day plan JSON
6. User accepts plan
7. Frontend calls `POST /api/multi-day-plans`
8. Backend creates:
   - Main `multi_day_plans` record
   - Individual `meal_plans` for each day (with `is_day_plan = true`)
   - Links in `multi_day_plan_days` table
9. Navigate to `/app/view/[id]`

### View Flow
1. User navigates to `/app/view/[id]`
2. `MultiDayPlanView` component loads
3. Calls `GET /api/multi-day-plans/[id]`
4. Backend fetches:
   - Main plan record
   - All linked day plans via `multi_day_plan_days`
   - Individual meal plan data for each day
5. Displays plan summary and all days

## Database Schema

✅ **Migration Applied**: `20251115203543_create_multi_day_plans_schema.sql`

### `multi_day_plans`
- `id` (UUID, PK)
- `user_id` (UUID, FK to users, on delete cascade)
- `name` (TEXT, not null)
- `source_chat_session_id` (UUID, nullable, FK to ai_chat_sessions, on delete set null)
- `number_of_days` (INTEGER, not null, constraint: 1-7)
- `average_kcal` (NUMERIC(10,2), nullable) - Automatically calculated
- `average_proteins` (NUMERIC(10,2), nullable) - Automatically calculated
- `average_fats` (NUMERIC(10,2), nullable) - Automatically calculated
- `average_carbs` (NUMERIC(10,2), nullable) - Automatically calculated
- `common_exclusions_guidelines` (TEXT, nullable)
- `common_allergens` (JSONB, nullable)
- `is_draft` (BOOLEAN, not null, default false) - Status tracking
- `created_at` (TIMESTAMPTZ, not null, default now())
- `updated_at` (TIMESTAMPTZ, not null, default now())

**Indexes:**
- `idx_multi_day_plans_user_id` (btree on user_id)
- `idx_multi_day_plans_source_chat_session_id` (btree on source_chat_session_id)
- `idx_multi_day_plans_is_draft` (btree on is_draft)
- `idx_multi_day_plans_name_trgm` (gin trigram on name) - for search

**Triggers:**
- `on_multi_day_plan_update` - Updates `updated_at` timestamp
- `on_multi_day_plan_days_change` - Recalculates summary when day plans are added/removed/updated
- `on_day_plan_update_recalculate_multi_day` - Recalculates summary when day plan content is updated

**Functions:**
- `recalculate_multi_day_plan_summary(p_multi_day_plan_id uuid)` - Calculates averages from day plans
- `trigger_recalculate_multi_day_plan_summary()` - Trigger function for junction table changes
- `trigger_recalculate_on_day_plan_update()` - Trigger function for day plan content updates

### `multi_day_plan_days`
- `id` (UUID, PK)
- `multi_day_plan_id` (UUID, FK to multi_day_plans, on delete cascade)
- `day_plan_id` (UUID, FK to meal_plans, on delete cascade)
- `day_number` (INTEGER, not null, constraint: 1-7)
- `created_at` (TIMESTAMPTZ, not null, default now())

**Constraints:**
- Unique constraint on (`multi_day_plan_id`, `day_number`) - Ensures one day per number per plan
- Unique constraint on `day_plan_id` - Ensures each day plan belongs to only one multi-day plan

**Indexes:**
- `idx_multi_day_plan_days_multi_day_plan_id` (btree on multi_day_plan_id)
- `idx_multi_day_plan_days_day_plan_id` (btree on day_plan_id)
- `idx_multi_day_plan_days_day_number` (btree on multi_day_plan_id, day_number)

**Triggers:**
- `on_multi_day_plan_days_change` - Automatically recalculates summary in `multi_day_plans`

### `meal_plans` (Extended)
- `is_day_plan` (BOOLEAN, not null, default false) - Flag to indicate if this is part of a multi-day plan

**Index:**
- `idx_meal_plans_is_day_plan` (btree on is_day_plan)

## API Endpoints

### GET /api/multi-day-plans
**Query Parameters:**
- `search` (optional): Search by name
- `sort` (optional): `created_at` | `updated_at` | `name` (default: `updated_at`)
- `order` (optional): `asc` | `desc` (default: `desc`)

**Response:** Array of `MultiDayPlanListItemDto`

### POST /api/multi-day-plans
**Body:** `CreateMultiDayPlanCommand`

**Response:** `CreateMultiDayPlanResponseDto` (201 Created)

### GET /api/multi-day-plans/[id]
**Response:** `GetMultiDayPlanByIdResponseDto` (200 OK)

### PUT /api/multi-day-plans/[id]
**Body:** `UpdateMultiDayPlanCommand` (partial)

**Response:** `GetMultiDayPlanByIdResponseDto` (200 OK)

### DELETE /api/multi-day-plans/[id]
**Response:** 204 No Content

### GET /api/multi-day-plans/[id]/export
**Query Parameters:**
- `format` (required): `doc` | `html`
- `dailySummary` (optional, default: `true`): `true` | `false` - Include daily summary
- `mealsSummary` (optional, default: `true`): `true` | `false` - Include meals summary
- `ingredients` (optional, default: `true`): `true` | `false` - Include ingredients
- `preparation` (optional, default: `true`): `true` | `false` - Include preparation instructions

**Response:** Binary file (DOC or HTML)
- DOC: `Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- HTML: `Content-Type: text/html`

## Validation Rules

### Create Command
- `name`: Required, 1-255 characters
- `source_chat_session_id`: Required, valid UUID
- `number_of_days`: Required, integer 1-7
- `common_exclusions_guidelines`: Optional, max 2000 characters
- `common_allergens`: Optional, array of strings or null
- `day_plans`: Required, array with at least 1 day
  - Each day: `day_number` (1-7), `plan_content`, `startup_data`, optional `name`

### Update Command
- All fields optional (partial update)
- If `day_plans` provided, replaces all existing day plans

## Error Handling

All endpoints handle:
- **400 Bad Request**: Validation errors
- **401 Unauthorized**: Authentication failures
- **404 Not Found**: Plan doesn't exist or doesn't belong to user
- **500 Internal Server Error**: Database or server errors

## Security

- All endpoints require authentication
- RLS policies ensure users can only access their own plans
- Explicit user_id checks in service layer (defense-in-depth)
- Input validation with Zod schemas
- SQL injection protection via Supabase client

## Internationalization

- Frontend components use `useTranslation` hook
- Export documents support English and Polish
- Translation keys follow existing patterns

## Testing Considerations

### Unit Tests Needed
- Service functions (create, read, update, delete)
- Validation schemas
- Export generation

### Integration Tests Needed
- API endpoint flows
- Database operations
- Export functionality

### E2E Tests Needed
- Complete creation flow
- View flow
- Edit flow
- Export flow

## Known Limitations

1. ✅ **Edit Mode**: Complete - Edit functionality fully implemented in AI chat
2. ✅ **Dashboard Integration**: Complete - Multi-day plans fully integrated in dashboard
3. **Translation Keys**: Some hardcoded strings in export (can be moved to translation files)

## Next Steps

1. **Testing**: Write unit, integration, and E2E tests (see `e2e-test-scenarios.md`)
2. ✅ **Dashboard Integration**: Complete - Multi-day plans fully integrated
3. ✅ **Edit Mode**: Complete - Edit functionality fully implemented
4. **Translation**: Move hardcoded strings to translation files
5. **Documentation**: Update user-facing documentation

## Files Created/Modified

### Created Files
- `src/components/MultiDayPlanView.tsx`
- `src/components/MultiDayPlanViewWrapper.tsx`
- `src/components/PlanSummary.tsx`
- `src/components/DaysList.tsx`
- `src/components/DayPlanView.tsx`
- `src/components/DayPlanCard.tsx`
- `src/components/MultiDayMealPlanDisplay.tsx`
- `src/components/ExportButton.tsx`
- `src/components/EditButton.tsx`
- `src/components/hooks/useMultiDayPlan.ts`
- `src/components/hooks/useMultiDayPlanExport.ts`
- `src/pages/app/view/[id].astro`
- `src/pages/app/edit/[id].astro`
- `src/lib/api/multi-day-plans.client.ts`
- `src/lib/multi-day-plans/multi-day-plan.service.ts`
- `src/pages/api/multi-day-plans/index.ts`
- `src/pages/api/multi-day-plans/[id].ts`
- `src/pages/api/multi-day-plans/[id]/export.ts`

### Modified Files
- `src/types.ts` - Added multi-day plan types (commands, DTOs, view data)
- `src/lib/validation/meal-plans.schemas.ts` - Added validation schemas for multi-day plans
- `src/components/hooks/useStartupForm.ts` - Updated for multi-day form data
- `src/components/hooks/useMultiDayPlansList.ts` - New hook for dashboard list management
- `src/components/StartupFormDialog.tsx` - Added multi-day options UI (number of days, meal variety, per-day guidelines)
- `src/components/DashboardView.tsx` - ✅ Fully updated to display and manage multi-day plans
- `src/components/MealPlanList.tsx` - Updated to handle multi-day plans
- `src/components/MealPlanListItem.tsx` - Updated to display multi-day plan summary
- `src/components/MealPlanInfo.tsx` - Updated to show multi-day summary (number of days, average kcal)
- `src/components/AIChatInterface.tsx` - ✅ Added complete multi-day plan handling (create and edit modes)
- `src/components/AIChatInterfaceWrapper.tsx` - Added edit mode support for multi-day plans
- `src/lib/utils/meal-plan-parser.ts` - Added multi-day JSON parser
- `src/lib/utils/chat-helpers.ts` - Added multi-day plan extraction
- `src/lib/meal-plans/doc-generator.service.ts` - Added `generateMultiDayDoc` function for DOC and HTML export
- `src/lib/api/multi-day-plans.client.ts` - Complete API client with all CRUD operations

## Code Quality

- ✅ TypeScript strict mode compliance
- ✅ No linter errors
- ✅ Consistent error handling
- ✅ Proper type safety
- ✅ Clean code (comments removed, simplified)
- ✅ Follows project structure conventions
- ✅ Reuses existing components where possible

## Performance Considerations

- Day plans are fetched in parallel where possible
- Sorting done in memory for small datasets
- Export generation may be slow for large plans (consider async/queue for production)
- No pagination for day plans (acceptable for 1-7 days)

## Dependencies

No new external dependencies added. Uses existing:
- React 19
- Astro 5
- TypeScript 5
- Zod (validation)
- docx (document generation)
- Supabase client

## Database Migration

✅ **Migrations Applied**:
1. **`20251115203543_create_multi_day_plans_schema.sql`** - Main migration
   - Tables created: `multi_day_plans`, `multi_day_plan_days`
   - Column added: `is_day_plan` to `meal_plans`
   - All indexes, RLS policies, and triggers configured
   - Functions created: `recalculate_multi_day_plan_summary()`, trigger functions
2. **`20251115205411_fix_recalculate_multi_day_plan_summary.sql`** - Fixed summary recalculation function
3. **`20251115211342_fix_recalculate_trigger_constraint.sql`** - Fixed trigger constraint issues

- TypeScript types generated and updated in `src/db/database.types.ts`

---

**Last Updated**: Implementation complete  
**Status**: ✅ Production ready (testing pending)

