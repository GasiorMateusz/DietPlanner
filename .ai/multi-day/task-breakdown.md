# Multi-Day Meal Plans - Task Breakdown

This document breaks down the implementation plan into standalone, actionable tasks that can be worked on independently or in small groups.

## Task Status Legend

- ⏳ **Not Started** - Task not yet started
- 🚧 **In Progress** - Task currently being worked on
- ✅ **Completed** - Task completed and tested
- 🔒 **Blocked** - Task blocked by dependencies
- ⏸️ **Paused** - Task paused temporarily

## Task Dependencies

Tasks are organized by dependency levels:
- **Level 0**: No dependencies (can start immediately)
- **Level 1**: Depends on Level 0 tasks
- **Level 2**: Depends on Level 1 tasks
- **Level 3**: Depends on Level 2 tasks
- And so on...

## Task List

### Level 0: Database Schema (No Dependencies)

#### Task 1: Create Database Migration for Multi-Day Plans
**Status**: ⏳ Not Started  
**Assignee**: TBD  
**Estimated Time**: 4-6 hours  
**Dependencies**: None  

**Description**: Create database migration to add multi-day plan tables and schema.

**Acceptance Criteria**:
- [ ] Migration file created in `supabase/migrations/`
- [ ] `multi_day_plans` table created with all required columns
- [ ] `multi_day_plan_days` junction table created
- [ ] `is_day_plan` column added to `meal_plans` table
- [ ] All indexes created
- [ ] All RLS policies created
- [ ] Triggers for summary calculation created
- [ ] Migration tested on local database
- [ ] Migration can be rolled back

**Files to Create/Modify**:
- `supabase/migrations/YYYYMMDDHHmmss_create_multi_day_plans_schema.sql`

**Notes**:
- Reference `.ai/multi-day/multi-day-plan-schema-guidance.md` for schema details
- Test migration on clean database
- Test rollback procedure

---

#### Task 2: Generate Database Types
**Status**: ⏳ Not Started  
**Assignee**: TBD  
**Estimated Time**: 1-2 hours  
**Dependencies**: Task 1  

**Description**: Generate TypeScript types from Supabase schema.

**Acceptance Criteria**:
- [ ] Supabase types generated
- [ ] `src/db/database.types.ts` updated
- [ ] New table types available in codebase
- [ ] Types are properly exported

**Files to Create/Modify**:
- `src/db/database.types.ts` (generated)

**Notes**:
- Run `supabase gen types typescript` command
- Verify all new types are available

---

### Level 1: Types and Services (Depends on Level 0)

#### Task 3: Create TypeScript Types for Multi-Day Plans
**Status**: ⏳ Not Started  
**Assignee**: TBD  
**Estimated Time**: 3-4 hours  
**Dependencies**: Task 2  

**Description**: Create TypeScript types, DTOs, and interfaces for multi-day plans.

**Acceptance Criteria**:
- [ ] Multi-day plan types added to `src/types.ts`
- [ ] API DTOs created (Create, Update, Get, List)
- [ ] Form types created
- [ ] Component prop types created
- [ ] All types are properly exported
- [ ] Types are documented with JSDoc comments

**Files to Create/Modify**:
- `src/types.ts`

**Types to Create**:
- `TypedMultiDayPlanRow`
- `TypedMultiDayPlanDaysRow`
- `CreateMultiDayPlanCommand`
- `CreateMultiDayPlanResponseDto`
- `GetMultiDayPlanByIdResponseDto`
- `UpdateMultiDayPlanCommand`
- `GetMultiDayPlansResponseDto`
- `MultiDayPlanListItemDto`
- `MultiDayStartupFormData`
- `MultiDayPlanChatData`

---

#### Task 4: Create Validation Schemas
**Status**: ⏳ Not Started  
**Assignee**: TBD  
**Estimated Time**: 2-3 hours  
**Dependencies**: Task 3  

**Description**: Create Zod validation schemas for multi-day plans.

**Acceptance Criteria**:
- [ ] `src/lib/validation/multi-day-plans.schemas.ts` created
- [ ] Schema for `CreateMultiDayPlanCommand`
- [ ] Schema for `UpdateMultiDayPlanCommand`
- [ ] Schema for `MultiDayStartupFormData`
- [ ] Schema for API request validation
- [ ] All schemas are tested

**Files to Create/Modify**:
- `src/lib/validation/multi-day-plans.schemas.ts`

**Notes**:
- Follow existing validation patterns
- Test all validation rules
- Add proper error messages

---

#### Task 5: Create Database Service Functions
**Status**: ⏳ Not Started  
**Assignee**: TBD  
**Estimated Time**: 6-8 hours  
**Dependencies**: Task 2, Task 3  

**Description**: Create service functions for multi-day plan database operations.

**Acceptance Criteria**:
- [ ] `src/lib/multi-day-plans/multi-day-plan.service.ts` created
- [ ] `createMultiDayPlan` function implemented
- [ ] `getMultiDayPlanById` function implemented
- [ ] `listMultiDayPlans` function implemented
- [ ] `updateMultiDayPlan` function implemented
- [ ] `deleteMultiDayPlan` function implemented
- [ ] `calculateSummary` function implemented
- [ ] `linkDayPlans` function implemented
- [ ] All functions are tested
- [ ] Error handling implemented

**Files to Create/Modify**:
- `src/lib/multi-day-plans/multi-day-plan.service.ts`

**Notes**:
- Follow existing service patterns
- Implement proper error handling
- Test all database operations
- Test RLS policies

---

### Level 2: API Endpoints (Depends on Level 1)

#### Task 6: Create POST /api/multi-day-plans Endpoint
**Status**: ⏳ Not Started  
**Assignee**: TBD  
**Estimated Time**: 4-5 hours  
**Dependencies**: Task 4, Task 5  

**Description**: Create API endpoint for creating multi-day meal plans.

**Acceptance Criteria**:
- [ ] `src/pages/api/multi-day-plans/index.ts` created
- [ ] POST handler implemented
- [ ] Request validation using Zod schema
- [ ] Authentication check
- [ ] Service function called
- [ ] Proper error handling
- [ ] Returns 201 Created with plan data
- [ ] Tested with Postman/unit tests

**Files to Create/Modify**:
- `src/pages/api/multi-day-plans/index.ts`

**Notes**:
- Follow existing API endpoint patterns
- Test all error scenarios
- Test authentication/authorization

---

#### Task 7: Create GET /api/multi-day-plans Endpoint
**Status**: ⏳ Not Started  
**Assignee**: TBD  
**Estimated Time**: 3-4 hours  
**Dependencies**: Task 4, Task 5  

**Description**: Create API endpoint for listing multi-day meal plans.

**Acceptance Criteria**:
- [ ] GET handler implemented in `src/pages/api/multi-day-plans/index.ts`
- [ ] Query parameter validation (search, sort, order)
- [ ] Authentication check
- [ ] Service function called
- [ ] Proper error handling
- [ ] Returns 200 OK with plan list
- [ ] Search functionality works
- [ ] Sorting works
- [ ] Tested with Postman/unit tests

**Files to Create/Modify**:
- `src/pages/api/multi-day-plans/index.ts`

---

#### Task 8: Create GET /api/multi-day-plans/[id] Endpoint
**Status**: ⏳ Not Started  
**Assignee**: TBD  
**Estimated Time**: 3-4 hours  
**Dependencies**: Task 4, Task 5  

**Description**: Create API endpoint for getting a single multi-day meal plan.

**Acceptance Criteria**:
- [ ] `src/pages/api/multi-day-plans/[id]/index.ts` created
- [ ] GET handler implemented
- [ ] Path parameter validation
- [ ] Authentication check
- [ ] Authorization check (own plans only)
- [ ] Service function called
- [ ] Proper error handling
- [ ] Returns 200 OK with plan data
- [ ] Returns 404 if plan not found
- [ ] Tested with Postman/unit tests

**Files to Create/Modify**:
- `src/pages/api/multi-day-plans/[id]/index.ts`

---

#### Task 9: Create PUT /api/multi-day-plans/[id] Endpoint
**Status**: ⏳ Not Started  
**Assignee**: TBD  
**Estimated Time**: 4-5 hours  
**Dependencies**: Task 4, Task 5  

**Description**: Create API endpoint for updating multi-day meal plans.

**Acceptance Criteria**:
- [ ] PUT handler implemented in `src/pages/api/multi-day-plans/[id]/index.ts`
- [ ] Request validation using Zod schema
- [ ] Authentication check
- [ ] Authorization check (own plans only)
- [ ] Service function called
- [ ] Proper error handling
- [ ] Returns 200 OK with updated plan data
- [ ] Returns 404 if plan not found
- [ ] Tested with Postman/unit tests

**Files to Create/Modify**:
- `src/pages/api/multi-day-plans/[id]/index.ts`

---

#### Task 10: Create DELETE /api/multi-day-plans/[id] Endpoint
**Status**: ⏳ Not Started  
**Assignee**: TBD  
**Estimated Time**: 2-3 hours  
**Dependencies**: Task 4, Task 5  

**Description**: Create API endpoint for deleting multi-day meal plans.

**Acceptance Criteria**:
- [ ] DELETE handler implemented in `src/pages/api/multi-day-plans/[id]/index.ts`
- [ ] Path parameter validation
- [ ] Authentication check
- [ ] Authorization check (own plans only)
- [ ] Service function called
- [ ] Proper error handling
- [ ] Returns 204 No Content on success
- [ ] Returns 404 if plan not found
- [ ] Cascade deletion works (day plans deleted)
- [ ] Tested with Postman/unit tests

**Files to Create/Modify**:
- `src/pages/api/multi-day-plans/[id]/index.ts`

---

#### Task 11: Create GET /api/multi-day-plans/[id]/export Endpoint
**Status**: ⏳ Not Started  
**Assignee**: TBD  
**Estimated Time**: 5-6 hours  
**Dependencies**: Task 4, Task 5, Task 10 (export service)  

**Description**: Create API endpoint for exporting multi-day meal plans.

**Acceptance Criteria**:
- [ ] `src/pages/api/multi-day-plans/[id]/export.ts` created
- [ ] GET handler implemented
- [ ] Path parameter validation
- [ ] Authentication check
- [ ] Authorization check (own plans only)
- [ ] Export service called
- [ ] Proper error handling
- [ ] Returns 200 OK with .doc file
- [ ] Content-Type header set correctly
- [ ] Content-Disposition header set correctly
- [ ] File downloads correctly
- [ ] Tested with Postman/unit tests

**Files to Create/Modify**:
- `src/pages/api/multi-day-plans/[id]/export.ts`

**Notes**:
- Depends on export service update (Task 10)

---

#### Task 12: Create API Client Functions
**Status**: ⏳ Not Started  
**Assignee**: TBD  
**Estimated Time**: 3-4 hours  
**Dependencies**: Tasks 6-11  

**Description**: Create API client functions for multi-day plans.

**Acceptance Criteria**:
- [ ] `src/lib/api/multi-day-plans.client.ts` created
- [ ] `create` function implemented
- [ ] `getAll` function implemented
- [ ] `getById` function implemented
- [ ] `update` function implemented
- [ ] `delete` function implemented
- [ ] `export` function implemented
- [ ] Error handling implemented
- [ ] Authentication headers included
- [ ] All functions are tested

**Files to Create/Modify**:
- `src/lib/api/multi-day-plans.client.ts`

**Notes**:
- Follow existing API client patterns
- Use `getAuthHeaders` helper
- Handle 401 errors (redirect to login)

---

### Level 2: AI Service Updates (Depends on Level 1)

#### Task 13: Update AI Session Service for Multi-Day Plans
**Status**: ⏳ Not Started  
**Assignee**: TBD  
**Estimated Time**: 6-8 hours  
**Dependencies**: Task 3  

**Description**: Update AI session service to support multi-day plan generation.

**Acceptance Criteria**:
- [ ] `formatSystemPrompt` updated for multi-day plans
- [ ] `formatUserPrompt` updated for multi-day parameters
- [ ] Response parsing updated for multi-day plans
- [ ] Multi-day plan extraction from AI response works
- [ ] All days are parsed correctly
- [ ] Summary is calculated correctly
- [ ] Error handling for invalid responses
- [ ] Tested with AI responses

**Files to Create/Modify**:
- `src/lib/ai/session.service.ts`

**Notes**:
- Update system prompt to generate multi-day plans
- Update user prompt to include multi-day parameters
- Parse multi-day plan JSON from AI response
- Handle day-by-day refinement requests

---

#### Task 14: Update AI Session Endpoints for Multi-Day Plans
**Status**: ⏳ Not Started  
**Assignee**: TBD  
**Estimated Time**: 3-4 hours  
**Dependencies**: Task 13  

**Description**: Update AI session API endpoints to support multi-day plans.

**Acceptance Criteria**:
- [ ] `POST /api/ai/sessions` updated for multi-day support
- [ ] `POST /api/ai/sessions/[id]/message` updated for multi-day support
- [ ] Request validation updated
- [ ] Multi-day parameters passed to AI service
- [ ] Multi-day responses handled correctly
- [ ] Error handling updated
- [ ] Tested with multi-day requests

**Files to Create/Modify**:
- `src/pages/api/ai/sessions/index.ts`
- `src/pages/api/ai/sessions/[id]/message.ts`

---

#### Task 15: Update Export Service for Multi-Day Plans
**Status**: ⏳ Not Started  
**Assignee**: TBD  
**Estimated Time**: 6-8 hours  
**Dependencies**: Task 3  

**Description**: Update export service to support multi-day plan export.

**Acceptance Criteria**:
- [ ] `src/lib/meal-plans/doc-generator.service.ts` updated
- [ ] Multi-day export template created
- [ ] All days included in export
- [ ] Summary section included
- [ ] Day headers included
- [ ] Export options work for multi-day plans
- [ ] File generation works correctly
- [ ] Tested with multi-day plans

**Files to Create/Modify**:
- `src/lib/meal-plans/doc-generator.service.ts`

**Notes**:
- Create template for multi-day plans
- Include all days in export
- Add summary section
- Handle export options

---

### Level 3: Custom Hooks (Depends on Level 2)

#### Task 16: Create useMultiDayPlan Hook
**Status**: ⏳ Not Started  
**Assignee**: TBD  
**Estimated Time**: 3-4 hours  
**Dependencies**: Task 12  

**Description**: Create custom hook for fetching a single multi-day plan.

**Acceptance Criteria**:
- [ ] `src/components/hooks/useMultiDayPlan.ts` created
- [ ] Hook fetches plan by ID
- [ ] Loading state handled
- [ ] Error state handled
- [ ] Refetch function provided
- [ ] Hook is tested

**Files to Create/Modify**:
- `src/components/hooks/useMultiDayPlan.ts`

---

#### Task 17: Create useMultiDayPlansList Hook
**Status**: ⏳ Not Started  
**Assignee**: TBD  
**Estimated Time**: 3-4 hours  
**Dependencies**: Task 12  

**Description**: Create custom hook for listing multi-day plans.

**Acceptance Criteria**:
- [ ] `src/components/hooks/useMultiDayPlansList.ts` created
- [ ] Hook fetches plan list
- [ ] Search functionality supported
- [ ] Loading state handled
- [ ] Error state handled
- [ ] Refetch function provided
- [ ] Hook is tested

**Files to Create/Modify**:
- `src/components/hooks/useMultiDayPlansList.ts`

---

#### Task 18: Create useMultiDayPlanExport Hook
**Status**: ⏳ Not Started  
**Assignee**: TBD  
**Estimated Time**: 2-3 hours  
**Dependencies**: Task 12  

**Description**: Create custom hook for exporting multi-day plans.

**Acceptance Criteria**:
- [ ] `src/components/hooks/useMultiDayPlanExport.ts` created
- [ ] Hook handles export functionality
- [ ] Loading state handled
- [ ] Error state handled
- [ ] File download triggered
- [ ] Hook is tested

**Files to Create/Modify**:
- `src/components/hooks/useMultiDayPlanExport.ts`

---

#### Task 19: Update useStartupForm Hook for Multi-Day Support
**Status**: ⏳ Not Started  
**Assignee**: TBD  
**Estimated Time**: 4-5 hours  
**Dependencies**: Task 4  

**Description**: Update startup form hook to support multi-day parameters.

**Acceptance Criteria**:
- [ ] `src/components/hooks/useStartupForm.ts` updated
- [ ] Number of days field added
- [ ] Meal variety checkbox added
- [ ] Different guidelines per day checkbox added
- [ ] Conditional guidelines textarea added
- [ ] Validation updated
- [ ] Form submission updated
- [ ] Hook is tested

**Files to Create/Modify**:
- `src/components/hooks/useStartupForm.ts`

---

#### Task 20: Update useAIChatForm Hook for Multi-Day Support
**Status**: ⏳ Not Started  
**Assignee**: TBD  
**Estimated Time**: 3-4 hours  
**Dependencies**: Task 13  

**Description**: Update AI chat form hook to support multi-day plans.

**Acceptance Criteria**:
- [ ] `src/components/hooks/useAIChatForm.ts` updated
- [ ] Multi-day plan extraction updated
- [ ] Plan acceptance updated for multi-day plans
- [ ] Error handling updated
- [ ] Hook is tested

**Files to Create/Modify**:
- `src/components/hooks/useAIChatForm.ts`

---

### Level 3: Component Development (Depends on Level 2)

#### Task 21: Update StartupFormDialog for Multi-Day Support
**Status**: ⏳ Not Started  
**Assignee**: TBD  
**Estimated Time**: 6-8 hours  
**Dependencies**: Task 19  

**Description**: Update startup form dialog to include multi-day options.

**Acceptance Criteria**:
- [ ] `src/components/StartupFormDialog.tsx` updated
- [ ] Number of days selector added (1-7)
- [ ] Meal variety checkbox added (yes/no, default: yes)
- [ ] Different guidelines per day checkbox added
- [ ] Conditional guidelines textarea added
- [ ] Form validation updated
- [ ] UI is responsive
- [ ] Accessibility requirements met
- [ ] Component is tested

**Files to Create/Modify**:
- `src/components/StartupFormDialog.tsx`

**Notes**:
- Add number of days input (select or number input)
- Add meal variety checkbox
- Add different guidelines per day checkbox
- Show/hide guidelines textarea based on checkbox
- Update form submission

---

#### Task 22: Create MultiDayMealPlanDisplay Component
**Status**: ⏳ Not Started  
**Assignee**: TBD  
**Estimated Time**: 6-8 hours  
**Dependencies**: Task 3  

**Description**: Create component for displaying multi-day plans in AI chat.

**Acceptance Criteria**:
- [ ] `src/components/MultiDayMealPlanDisplay.tsx` created
- [ ] Component displays all days
- [ ] Day plan cards implemented
- [ ] Scrollable container implemented
- [ ] Daily summaries displayed
- [ ] Meal cards displayed
- [ ] Component is responsive
- [ ] Accessibility requirements met
- [ ] Component is tested

**Files to Create/Modify**:
- `src/components/MultiDayMealPlanDisplay.tsx`

**Notes**:
- Display all days in scrollable container
- Each day shows daily summary and meals
- Reuse existing `DailySummaryStaticDisplay` and `MealCardReadOnly` components

---

#### Task 23: Update AIChatInterface for Multi-Day Support
**Status**: ⏳ Not Started  
**Assignee**: TBD  
**Estimated Time**: 8-10 hours  
**Dependencies**: Task 13, Task 20, Task 22  

**Description**: Update AI chat interface to support multi-day plans.

**Acceptance Criteria**:
- [ ] `src/components/AIChatInterface.tsx` updated
- [ ] Multi-day plan support added
- [ ] Message display updated for multi-day plans
- [ ] Plan acceptance updated for multi-day plans
- [ ] Edit mode support added
- [ ] Existing plan loading for edit mode
- [ ] Navigation to view after acceptance
- [ ] Error handling updated
- [ ] Component is tested

**Files to Create/Modify**:
- `src/components/AIChatInterface.tsx`

**Notes**:
- Update plan extraction to handle multi-day plans
- Update plan acceptance to create multi-day plan
- Add edit mode support
- Load existing plan for edit mode
- Navigate to view after acceptance

---

#### Task 24: Create MultiDayPlanView Component
**Status**: ⏳ Not Started  
**Assignee**: TBD  
**Estimated Time**: 8-10 hours  
**Dependencies**: Task 16, Task 18  

**Description**: Create read-only view component for multi-day plans.

**Acceptance Criteria**:
- [ ] `src/components/MultiDayPlanView.tsx` created
- [ ] Plan summary displayed
- [ ] Days list displayed (scrollable)
- [ ] Export button implemented
- [ ] Edit button implemented
- [ ] Loading state handled
- [ ] Error state handled
- [ ] Component is responsive
- [ ] Accessibility requirements met
- [ ] Component is tested

**Files to Create/Modify**:
- `src/components/MultiDayPlanView.tsx`

**Notes**:
- Display plan summary at top
- Display all days in scrollable list
- Add export and edit buttons
- Handle loading and error states

---

#### Task 25: Create Supporting Components for Multi-Day View
**Status**: ⏳ Not Started  
**Assignee**: TBD  
**Estimated Time**: 6-8 hours  
**Dependencies**: Task 24  

**Description**: Create supporting components for multi-day plan view.

**Acceptance Criteria**:
- [ ] `src/components/PlanSummary.tsx` created
- [ ] `src/components/DaysList.tsx` created
- [ ] `src/components/DayPlanView.tsx` created
- [ ] `src/components/ExportButton.tsx` created
- [ ] `src/components/EditButton.tsx` created
- [ ] All components are responsive
- [ ] Accessibility requirements met
- [ ] All components are tested

**Files to Create/Modify**:
- `src/components/PlanSummary.tsx`
- `src/components/DaysList.tsx`
- `src/components/DayPlanView.tsx`
- `src/components/ExportButton.tsx`
- `src/components/EditButton.tsx`

---

#### Task 26: Update DashboardView for Multi-Day Plans
**Status**: ⏳ Not Started  
**Assignee**: TBD  
**Estimated Time**: 6-8 hours  
**Dependencies**: Task 17  

**Description**: Update dashboard to show multi-day plans.

**Acceptance Criteria**:
- [ ] `src/components/DashboardView.tsx` updated
- [ ] Multi-day plans displayed with summaries
- [ ] Summary badges added (number of days, average kcal)
- [ ] View button navigates to `/app/view/[id]`
- [ ] Edit button navigates to `/app/edit/[id]`
- [ ] Delete button works for multi-day plans
- [ ] Search functionality works
- [ ] Component is tested

**Files to Create/Modify**:
- `src/components/DashboardView.tsx`

**Notes**:
- Update to use `useMultiDayPlansList` hook
- Display summary badges
- Update navigation buttons
- Update delete functionality

---

### Level 4: Routes and Navigation (Depends on Level 3)

#### Task 27: Create View Route for Multi-Day Plans
**Status**: ⏳ Not Started  
**Assignee**: TBD  
**Estimated Time**: 2-3 hours  
**Dependencies**: Task 24  

**Description**: Create Astro page for viewing multi-day plans.

**Acceptance Criteria**:
- [ ] `src/pages/app/view/[id].astro` created
- [ ] PrivateLayout used
- [ ] MultiDayPlanView component rendered
- [ ] Plan ID passed to component
- [ ] Authentication check (middleware)
- [ ] Route is tested

**Files to Create/Modify**:
- `src/pages/app/view/[id].astro`

---

#### Task 28: Create Edit Route for Multi-Day Plans
**Status**: ⏳ Not Started  
**Assignee**: TBD  
**Estimated Time**: 2-3 hours  
**Dependencies**: Task 23  

**Description**: Create Astro page for editing multi-day plans.

**Acceptance Criteria**:
- [ ] `src/pages/app/edit/[id].astro` created
- [ ] PrivateLayout used
- [ ] AIChatInterface component rendered
- [ ] Edit mode enabled
- [ ] Plan ID passed to component
- [ ] Authentication check (middleware)
- [ ] Route is tested

**Files to Create/Modify**:
- `src/pages/app/edit/[id].astro`

---

#### Task 29: Update Navigation for Multi-Day Plans
**Status**: ⏳ Not Started  
**Assignee**: TBD  
**Estimated Time**: 2-3 hours  
**Dependencies**: Tasks 27, 28  

**Description**: Update navigation to support multi-day plan routes.

**Acceptance Criteria**:
- [ ] Dashboard navigation updated
- [ ] View navigation works
- [ ] Edit navigation works
- [ ] Back navigation works
- [ ] Navigation is tested

**Files to Create/Modify**:
- `src/components/DashboardView.tsx`
- `src/components/MultiDayPlanView.tsx`

---

### Level 5: Testing (Depends on Level 4)

#### Task 30: Write Unit Tests for Multi-Day Plans
**Status**: ⏳ Not Started  
**Assignee**: TBD  
**Estimated Time**: 8-10 hours  
**Dependencies**: All implementation tasks  

**Description**: Write unit tests for multi-day plan functionality.

**Acceptance Criteria**:
- [ ] Validation schemas tested
- [ ] Service functions tested
- [ ] API client functions tested
- [ ] Custom hooks tested
- [ ] Components tested
- [ ] All tests passing
- [ ] Test coverage > 80%

**Files to Create/Modify**:
- `src/test/unit/validation/multi-day-plans.schemas.test.ts`
- `src/test/unit/lib/multi-day-plans/multi-day-plan.service.test.ts`
- `src/test/unit/lib/api/multi-day-plans.client.test.ts`
- `src/test/unit/components/hooks/useMultiDayPlan.test.ts`
- `src/test/unit/components/hooks/useMultiDayPlansList.test.ts`
- `src/test/unit/components/hooks/useMultiDayPlanExport.test.ts`
- `src/test/unit/components/MultiDayPlanView.test.tsx`
- `src/test/unit/components/MultiDayMealPlanDisplay.test.tsx`

---

#### Task 31: Write Integration Tests for Multi-Day Plans
**Status**: ⏳ Not Started  
**Assignee**: TBD  
**Estimated Time**: 8-10 hours  
**Dependencies**: All implementation tasks  

**Description**: Write integration tests for multi-day plan API endpoints.

**Acceptance Criteria**:
- [ ] API endpoints tested
- [ ] Database operations tested
- [ ] AI service integration tested
- [ ] Export functionality tested
- [ ] Authentication/authorization tested
- [ ] Error handling tested
- [ ] All tests passing

**Files to Create/Modify**:
- `src/test/integration/api/multi-day-plans.test.ts`
- `src/test/integration/api/multi-day-plans-export.test.ts`
- `src/test/integration/ai/multi-day-sessions.test.ts`

---

#### Task 32: Write E2E Tests for Multi-Day Plans
**Status**: ⏳ Not Started  
**Assignee**: TBD  
**Estimated Time**: 10-12 hours  
**Dependencies**: All implementation tasks  

**Description**: Write E2E tests for multi-day plan user flows.

**Acceptance Criteria**:
- [ ] Multi-day plan creation flow tested
- [ ] Multi-day plan viewing flow tested
- [ ] Multi-day plan editing flow tested
- [ ] Multi-day plan deletion flow tested
- [ ] Export flow tested
- [ ] Search functionality tested
- [ ] Error scenarios tested
- [ ] Edge cases tested
- [ ] All tests passing

**Files to Create/Modify**:
- `src/test/e2e/multi-day-plan-creation-flow.spec.ts`
- `src/test/e2e/multi-day-plan-viewing-flow.spec.ts`
- `src/test/e2e/multi-day-plan-editing-flow.spec.ts`
- `src/test/e2e/multi-day-plan-deletion-flow.spec.ts`
- `src/test/e2e/multi-day-plan-export-flow.spec.ts`

---

### Level 6: Migration and Cleanup (Depends on Level 5)

#### Task 33: Create Migration Script for Existing Plans
**Status**: ⏳ Not Started  
**Assignee**: TBD  
**Estimated Time**: 6-8 hours  
**Dependencies**: All implementation tasks, Task 30-32  

**Description**: Create migration script to convert existing single-day plans to multi-day plans.

**Acceptance Criteria**:
- [ ] Migration script created
- [ ] Script converts single-day plans to multi-day plans
- [ ] All day plans linked correctly
- [ ] Summaries calculated correctly
- [ ] Script is tested
- [ ] Rollback procedure documented

**Files to Create/Modify**:
- `supabase/migrations/YYYYMMDDHHmmss_migrate_single_day_to_multi_day.sql`
- `scripts/migrate-single-day-to-multi-day.ts` (optional)

**Notes**:
- Convert all existing single-day plans to multi-day plans with 1 day
- Link day plans to multi-day plans via junction table
- Calculate summaries from day plans
- Mark day plans as `is_day_plan = true`

---

#### Task 34: Remove Deprecated Code
**Status**: ⏳ Not Started  
**Assignee**: TBD  
**Estimated Time**: 4-6 hours  
**Dependencies**: Task 33  

**Description**: Remove deprecated editor code and update documentation.

**Acceptance Criteria**:
- [ ] Editor route removed (`/app/editor`)
- [ ] Editor components removed (if not needed)
- [ ] Manual editing functionality removed
- [ ] Documentation updated
- [ ] No broken references
- [ ] Code is clean

**Files to Remove/Modify**:
- `src/pages/app/editor.astro` (remove)
- `src/pages/app/editor/[id].astro` (remove)
- `src/components/MealPlanEditor.tsx` (remove or keep for future)
- `src/components/hooks/useMealPlanEditor.ts` (remove or keep for future)

**Notes**:
- Keep editor code if it might be useful in the future
- Update all references to editor route
- Update documentation

---

#### Task 35: Update Translations for Multi-Day Plans
**Status**: ⏳ Not Started  
**Assignee**: TBD  
**Estimated Time**: 3-4 hours  
**Dependencies**: All implementation tasks  

**Description**: Add translations for multi-day plan features.

**Acceptance Criteria**:
- [ ] Translations added for multi-day plan features
- [ ] English translations added
- [ ] Polish translations added
- [ ] All translation keys used in components
- [ ] Translations are tested

**Files to Create/Modify**:
- `src/lib/i18n/translations/en.json`
- `src/lib/i18n/translations/pl.json`

**Translation Keys to Add**:
- `multiDay.*` - Multi-day plan related translations
- `startup.numberOfDays` - Number of days label
- `startup.mealVariety` - Meal variety checkbox label
- `startup.differentGuidelinesPerDay` - Different guidelines per day checkbox label
- `view.export` - Export button label
- `view.edit` - Edit button label
- `dashboard.multiDaySummary` - Multi-day plan summary badge

---

### Level 7: Polish and Documentation (Depends on Level 6)

#### Task 36: Update Documentation
**Status**: ⏳ Not Started  
**Assignee**: TBD  
**Estimated Time**: 4-6 hours  
**Dependencies**: All implementation tasks  

**Description**: Update documentation for multi-day plan features.

**Acceptance Criteria**:
- [ ] API documentation updated
- [ ] Component documentation updated
- [ ] User guide updated
- [ ] Developer guide updated
- [ ] Implementation plan updated
- [ ] Documentation is complete

**Files to Create/Modify**:
- `.ai/docs/project-summary.md`
- `README.md`
- API documentation (if separate)
- User guide (if separate)

---

#### Task 37: Polish UI/UX
**Status**: ⏳ Not Started  
**Assignee**: TBD  
**Estimated Time**: 6-8 hours  
**Dependencies**: All implementation tasks  

**Description**: Polish UI/UX for multi-day plan features.

**Acceptance Criteria**:
- [ ] Loading states improved
- [ ] Error messages improved
- [ ] Accessibility improved
- [ ] Responsive design improved
- [ ] User experience improved
- [ ] UI is polished

**Files to Create/Modify**:
- All component files
- CSS/styling files

---

#### Task 38: Performance Optimization
**Status**: ⏳ Not Started  
**Assignee**: TBD  
**Estimated Time**: 4-6 hours  
**Dependencies**: All implementation tasks  

**Description**: Optimize performance for multi-day plan features.

**Acceptance Criteria**:
- [ ] Database queries optimized
- [ ] API responses optimized
- [ ] Component rendering optimized
- [ ] Large multi-day plans handled efficiently
- [ ] Export performance optimized
- [ ] Performance tests passing

**Files to Create/Modify**:
- Service files
- API endpoints
- Component files

---

#### Task 39: Final Testing and QA
**Status**: ⏳ Not Started  
**Assignee**: TBD  
**Estimated Time**: 8-10 hours  
**Dependencies**: All implementation tasks  

**Description**: Final testing and QA for multi-day plan features.

**Acceptance Criteria**:
- [ ] All user flows tested
- [ ] Error handling tested
- [ ] Edge cases tested
- [ ] Accessibility tested
- [ ] Responsive design tested
- [ ] Performance tested
- [ ] All tests passing
- [ ] QA sign-off obtained

---

## Task Dependency Graph

```
Level 0 (No Dependencies):
  Task 1: Database Migration
    └─> Task 2: Generate Types

Level 1 (Depends on Level 0):
  Task 3: TypeScript Types
  Task 4: Validation Schemas
  Task 5: Database Services
    └─> Task 2

Level 2 (Depends on Level 1):
  Tasks 6-11: API Endpoints
    └─> Tasks 4, 5
  Task 13: AI Service Updates
    └─> Task 3
  Task 14: AI Endpoints
    └─> Task 13
  Task 15: Export Service
    └─> Task 3

Level 3 (Depends on Level 2):
  Tasks 16-20: Custom Hooks
    └─> Tasks 12, 13, 19
  Tasks 21-26: Components
    └─> Tasks 12, 13, 16, 17, 18, 19, 20, 22

Level 4 (Depends on Level 3):
  Tasks 27-29: Routes and Navigation
    └─> Tasks 23, 24

Level 5 (Depends on Level 4):
  Tasks 30-32: Testing
    └─> All implementation tasks

Level 6 (Depends on Level 5):
  Tasks 33-35: Migration and Cleanup
    └─> All implementation tasks

Level 7 (Depends on Level 6):
  Tasks 36-39: Polish and Documentation
    └─> All implementation tasks
```

## Standalone Task Groups

### Group 1: Database Foundation (Can start immediately)
- Task 1: Database Migration
- Task 2: Generate Types

### Group 2: Types and Services (Depends on Group 1)
- Task 3: TypeScript Types
- Task 4: Validation Schemas
- Task 5: Database Services

### Group 3: API Endpoints (Depends on Group 2)
- Tasks 6-11: API Endpoints
- Task 12: API Client

### Group 4: AI Service (Depends on Group 2, can parallel with Group 3)
- Task 13: AI Service Updates
- Task 14: AI Endpoints
- Task 15: Export Service

### Group 5: Frontend Components (Depends on Groups 3 & 4)
- Tasks 16-20: Custom Hooks
- Tasks 21-26: Components

### Group 6: Routes (Depends on Group 5)
- Tasks 27-29: Routes and Navigation

### Group 7: Testing (Depends on Group 6)
- Tasks 30-32: Testing

### Group 8: Migration (Depends on Group 7)
- Tasks 33-35: Migration and Cleanup

### Group 9: Polish (Depends on Group 8)
- Tasks 36-39: Polish and Documentation

## Estimated Timeline

- **Group 1**: 5-8 hours
- **Group 2**: 11-15 hours
- **Group 3**: 25-35 hours
- **Group 4**: 15-20 hours
- **Group 5**: 35-45 hours
- **Group 6**: 6-9 hours
- **Group 7**: 26-32 hours
- **Group 8**: 13-18 hours
- **Group 9**: 22-30 hours

**Total Estimated Time**: 158-212 hours (~4-5 weeks for one developer)

## Parallel Work Opportunities

1. **Tasks 3, 4, 5** can be done in parallel (after Group 1)
2. **Tasks 6-11** can be done in parallel (after Group 2)
3. **Tasks 13, 14, 15** can be done in parallel with Group 3 (after Group 2)
4. **Tasks 16-20** can be done in parallel (after Groups 3 & 4)
5. **Tasks 21-26** can be done in parallel (after Groups 3 & 4)
6. **Tasks 30-32** can be done in parallel (after Group 6)

## Notes

- Each task is standalone and can be assigned to different developers
- Tasks have clear acceptance criteria for completion
- Dependencies are clearly marked
- Estimated time includes testing
- Tasks can be broken down further if needed
- Some tasks can be done in parallel to speed up development

