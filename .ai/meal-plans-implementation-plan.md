# API Endpoint Implementation Plan: Meal Plans (`/api/meal-plans`)

## 1. Endpoint Overview

This implementation plan covers the complete CRUD API for the meal plans resource. The meal plans endpoints allow authenticated dietitians to create, read, update, delete, and export meal plans. All endpoints interact with the `public.meal_plans` table in Supabase, which stores meal plan data with associated patient information and nutritional targets. Row-Level Security (RLS) policies ensure users can only access their own meal plans.

### Endpoints Covered

- `GET /api/meal-plans` - List all meal plans for the authenticated user (with search and sorting)
- `POST /api/meal-plans` - Create a new meal plan
- `GET /api/meal-plans/{id}` - Retrieve a single meal plan by ID
- `PUT /api/meal-plans/{id}` - Update an existing meal plan
- `DELETE /api/meal-plans/{id}` - Delete a meal plan
- `GET /api/meal-plans/{id}/export` - Export a meal plan as a `.doc` file

## 2. Request Details

### GET /api/meal-plans

- **HTTP Method:** GET
- **URL Structure:** `/api/meal-plans`
- **Query Parameters:**
  - `search` (string, optional): Filters meal plans by name using case-insensitive partial match. Leverages the `pg_trgm` GIN index for performance.
  - `sort` (string, optional): Field to sort by. Valid values: `created_at`, `updated_at`, `name`. Default: `updated_at`.
  - `order` (string, optional): Sort order. Valid values: `asc`, `desc`. Default: `desc`.
- **Request Body:** None
- **Authentication:** Required (Bearer token in Authorization header)

### POST /api/meal-plans

- **HTTP Method:** POST
- **URL Structure:** `/api/meal-plans`
- **Query Parameters:** None
- **Request Body:**
  - **Content-Type:** `application/json`
  - **Structure:** Must match `CreateMealPlanCommand` type
  - **Required Fields:**
    - `name` (string): Name of the meal plan
    - `plan_content` (MealPlanContent): Complete meal plan JSON structure with daily summary and meals array
    - `startup_data` (MealPlanStartupData): Patient information and targets used to generate the plan
  - **Optional Fields:**
    - `source_chat_session_id` (uuid): ID of the AI chat session that generated this plan
- **Authentication:** Required

### GET /api/meal-plans/{id}

- **HTTP Method:** GET
- **URL Structure:** `/api/meal-plans/{id}` where `{id}` is a UUID
- **Path Parameters:**
  - `id` (uuid, required): The UUID of the meal plan to retrieve
- **Query Parameters:** None
- **Request Body:** None
- **Authentication:** Required

### PUT /api/meal-plans/{id}

- **HTTP Method:** PUT
- **URL Structure:** `/api/meal-plans/{id}` where `{id}` is a UUID
- **Path Parameters:**
  - `id` (uuid, required): The UUID of the meal plan to update
- **Query Parameters:** None
- **Request Body:**
  - **Content-Type:** `application/json`
  - **Structure:** Must match `UpdateMealPlanCommand` type (partial update, all fields optional)
  - **Commonly Updated Fields:**
    - `name` (string): Updated name
    - `plan_content` (MealPlanContent): Updated meal plan content
    - Other fields from `TypedMealPlanUpdate` as needed
- **Authentication:** Required

### DELETE /api/meal-plans/{id}

- **HTTP Method:** DELETE
- **URL Structure:** `/api/meal-plans/{id}` where `{id}` is a UUID
- **Path Parameters:**
  - `id` (uuid, required): The UUID of the meal plan to delete
- **Query Parameters:** None
- **Request Body:** None
- **Authentication:** Required

### GET /api/meal-plans/{id}/export

- **HTTP Method:** GET
- **URL Structure:** `/api/meal-plans/{id}/export` where `{id}` is a UUID
- **Path Parameters:**
  - `id` (uuid, required): The UUID of the meal plan to export
- **Query Parameters:** None
- **Request Body:** None
- **Authentication:** Required

## 3. Used Types

### Request Command Models

- **CreateMealPlanCommand** (from `src/types.ts`): Request body for `POST /api/meal-plans`
  - Contains: `name`, `source_chat_session_id?`, `plan_content`, `startup_data`
- **UpdateMealPlanCommand** (from `src/types.ts`): Request body for `PUT /api/meal-plans/{id}`
  - Type alias for `TypedMealPlanUpdate` - allows partial updates

### Response DTOs

- **GetMealPlansResponseDto** (from `src/types.ts`): Response for `GET /api/meal-plans`
  - Type: `MealPlanListItemDto[]`
  - Each item contains: `id`, `name`, `created_at`, `updated_at`, `startup_data`, `daily_summary`
- **CreateMealPlanResponseDto** (from `src/types.ts`): Response for `POST /api/meal-plans`
  - Type: `TypedMealPlanRow` - complete database row
- **GetMealPlanByIdResponseDto** (from `src/types.ts`): Response for `GET /api/meal-plans/{id}`
  - Type: `TypedMealPlanRow` - complete database row
- **UpdateMealPlanResponseDto** (from `src/types.ts`): Response for `PUT /api/meal-plans/{id}`
  - Type: `TypedMealPlanRow` - complete updated database row

### Supporting Types

- **MealPlanContent** (from `src/types.ts`): Structure of the `plan_content` JSONB field
  - Contains: `daily_summary` (MealPlanContentDailySummary) and `meals` (MealPlanMeal[])
- **MealPlanStartupData** (from `src/types.ts`): Patient information and targets
  - Contains: `patient_age`, `patient_weight`, `patient_height`, `activity_level`, `target_kcal`, `target_macro_distribution`, `meal_names`, `exclusions_guidelines`
- **TypedMealPlanRow** (from `src/types.ts`): Strongly-typed database row with proper JSON types
- **TypedMealPlanInsert** (from `src/types.ts`): Strongly-typed insert payload
- **TypedMealPlanUpdate** (from `src/types.ts`): Strongly-typed update payload
- **TargetMacroDistribution** (from `src/types.ts`): Structure for macro distribution JSON
- **activity_level_enum** (from database): `'sedentary' | 'light' | 'moderate' | 'high'`

## 4. Response Details

### GET /api/meal-plans (200 OK)

```json
[
  {
    "id": "uuid",
    "name": "Weight Reduction Plan - J.K.",
    "created_at": "2025-01-23T12:00:00Z",
    "updated_at": "2025-01-23T12:00:00Z",
    "startup_data": {
      "patient_age": 30,
      "patient_weight": 70.5,
      "patient_height": 170.0,
      "activity_level": "moderate",
      "target_kcal": 2000,
      "target_macro_distribution": { "p_perc": 30, "f_perc": 25, "c_perc": 45 },
      "meal_names": "Breakfast, Second Breakfast, Lunch, Dinner",
      "exclusions_guidelines": "Gluten-free, no nuts."
    },
    "daily_summary": {
      "kcal": 2000,
      "proteins": 150,
      "fats": 60,
      "carbs": 215
    }
  }
]
```

### POST /api/meal-plans (201 Created)

```json
{
  "id": "new-uuid",
  "user_id": "auth-user-uuid",
  "source_chat_session_id": "uuid",
  "name": "New Patient Plan",
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
  "patient_age": 30,
  "patient_weight": 70.5,
  "patient_height": 170.0,
  "activity_level": "moderate",
  "target_kcal": 2000,
  "target_macro_distribution": { "p_perc": 30, "f_perc": 25, "c_perc": 45 },
  "meal_names": "Breakfast, Second Breakfast, Lunch, Dinner",
  "exclusions_guidelines": "Gluten-free, no nuts.",
  "created_at": "2025-01-23T12:00:00Z",
  "updated_at": "2025-01-23T12:00:00Z"
}
```

### GET /api/meal-plans/{id} (200 OK)

Same structure as POST response - complete `TypedMealPlanRow`.

### PUT /api/meal-plans/{id} (200 OK)

Same structure as POST response - complete updated `TypedMealPlanRow`.

### DELETE /api/meal-plans/{id} (204 No Content)

Empty response body.

### GET /api/meal-plans/{id}/export (200 OK)

- **Content-Type:** `application/msword`
- **Content-Disposition:** `attachment; filename="plan-name.doc"`
- **Body:** Binary data of the generated `.doc` file

### Error Responses (400, 401, 404, 500)

```json
{
  "error": "A descriptive error message",
  "details": "[Optional: Additional error details or validation errors]"
}
```

## 5. Data Flow

### Route Handler Structure (`/src/pages/api/meal-plans/[id].ts` or separate files)

All route handlers follow this pattern:

1. **Authentication:**
   - Retrieve Supabase client from `locals.supabase`
   - Get authenticated user: `const { data: { user }, error } = await supabase.auth.getUser()`
   - If `error` or `!user`, return 401 Unauthorized

2. **Request Parsing/Validation:**
   - For POST/PUT: Parse JSON body, validate with Zod schema
   - For GET with query params: Parse and validate query parameters
   - For routes with `{id}`: Extract and validate UUID format

3. **Service Call:**
   - Call appropriate method from `MealPlanService` with validated data and `user.id`

4. **Response:**
   - Return appropriate status code with DTO or error message

### Service Layer (`/src/lib/meal-plans/meal-plan.service.ts` - To be created)

The service handles all business logic and database operations:

#### `listMealPlans(userId: string, filters: ListFilters, supabase: SupabaseClient)`

1. Build Supabase query:
   - Start with `.from('meal_plans').select('*')`
   - Filter by `user_id` (though RLS handles this, explicit filter is defensive)
   - Apply search filter: `.ilike('name', `%${search}%`)` if `search` provided
   - Apply sorting: `.order(sortField, { ascending: order === 'asc' })`
2. Execute query and get results
3. Transform database rows to `MealPlanListItemDto[]`:
   - Extract `daily_summary` from `plan_content.daily_summary`
   - Build `startup_data` from flat fields
   - Include `id`, `name`, `created_at`, `updated_at`
4. Return transformed array

#### `createMealPlan(command: CreateMealPlanCommand, userId: string, supabase: SupabaseClient)`

1. Flatten the nested command structure:
   - Extract `name` and `source_chat_session_id` from command
   - Extract `plan_content` from command
   - Flatten `startup_data` fields to database columns: `patient_age`, `patient_weight`, `patient_height`, `activity_level`, `target_kcal`, `target_macro_distribution`, `meal_names`, `exclusions_guidelines`
2. Build insert payload matching `TypedMealPlanInsert`:
   ```typescript
   const insertPayload = {
     user_id: userId,
     name: command.name,
     source_chat_session_id: command.source_chat_session_id ?? null,
     plan_content: command.plan_content,
     patient_age: command.startup_data.patient_age ?? null,
     patient_weight: command.startup_data.patient_weight ?? null,
     // ... all other startup_data fields
   };
   ```
3. Insert into database: `await supabase.from('meal_plans').insert(insertPayload).select().single()`
4. Validate foreign key constraint: If `source_chat_session_id` is provided, verify it exists (optional validation)
5. Transform result to `TypedMealPlanRow` and return

#### `getMealPlanById(id: string, userId: string, supabase: SupabaseClient)`

1. Query database: `await supabase.from('meal_plans').select('*').eq('id', id).single()`
2. RLS automatically filters by `user_id`, so if no result, the plan doesn't exist or belongs to another user
3. If no result, throw `NotFoundError`
4. Return result as `TypedMealPlanRow`

#### `updateMealPlan(id: string, command: UpdateMealPlanCommand, userId: string, supabase: SupabaseClient)`

1. Verify plan exists and belongs to user: Call `getMealPlanById` first (or check via update result)
2. Build update payload from command (only include provided fields)
3. Update database: `await supabase.from('meal_plans').update(updatePayload).eq('id', id).select().single()`
4. The `updated_at` trigger automatically updates the timestamp
5. If no rows affected, throw `NotFoundError`
6. Return updated row as `TypedMealPlanRow`

#### `deleteMealPlan(id: string, userId: string, supabase: SupabaseClient)`

1. Verify plan exists and belongs to user (optional but recommended for better error messages)
2. Delete from database: `await supabase.from('meal_plans').delete().eq('id', id)`
3. If no rows affected, throw `NotFoundError`
4. Return void (204 response)

#### `exportMealPlan(id: string, userId: string, supabase: SupabaseClient)` (Future Implementation)

1. Retrieve complete meal plan via `getMealPlanById`
2. Format meal plan data for document generation
3. Generate `.doc` file using a document generation library (e.g., `docx`)
4. Return file buffer and metadata (filename)

### Database Interactions

- All queries leverage RLS policies which automatically filter by `auth.uid() = user_id`
- Indexes optimize queries:
  - `idx_meal_plans_user_id`: Fast filtering by user
  - `idx_meal_plans_name_trgm`: Fast search by name using trigram matching
- The `on_meal_plan_update` trigger automatically updates `updated_at` on every UPDATE

## 6. Security Considerations

### Authentication

All endpoints require a valid Supabase JWT token in the `Authorization: Bearer <token>` header. The route handler must:

1. Call `supabase.auth.getUser()` to validate the token
2. Return 401 Unauthorized if authentication fails
3. Extract `user.id` for all database operations

### Authorization (RLS)

Row-Level Security policies ensure:

- Users can only SELECT, INSERT, UPDATE, DELETE their own meal plans (`auth.uid() = user_id`)
- The service must always set `user_id` correctly on inserts
- RLS will reject any attempt to access another user's plans

**Important:** While RLS provides security, the service should still explicitly filter by `user_id` for clarity and defense-in-depth.

### Input Validation

#### Zod Schemas Required

1. **`createMealPlanSchema`** (for POST):
   - Validate `name`: `z.string().min(1).max(255)`
   - Validate `source_chat_session_id`: `z.string().uuid().optional().nullable()`
   - Validate `plan_content`: Complex nested schema validating `MealPlanContent` structure
     - `daily_summary`: Object with `kcal`, `proteins`, `fats`, `carbs` (all positive numbers)
     - `meals`: Array of objects with `name`, `ingredients`, `preparation`, `summary` (with kcal, p, f, c)
   - Validate `startup_data`: Schema matching `MealPlanStartupData`
     - `patient_age`: `z.number().int().positive().max(150).nullable().optional()`
     - `patient_weight`: `z.number().positive().max(1000).nullable().optional()`
     - `patient_height`: `z.number().positive().max(300).nullable().optional()`
     - `activity_level`: `z.enum(['sedentary', 'light', 'moderate', 'high']).nullable().optional()`
     - `target_kcal`: `z.number().int().positive().max(10000).nullable().optional()`
     - `target_macro_distribution`: Object with `p_perc`, `f_perc`, `c_perc` (0-100, sum validation recommended)
     - `meal_names`: `z.string().max(500).nullable().optional()`
     - `exclusions_guidelines`: `z.string().max(2000).nullable().optional()`

2. **`updateMealPlanSchema`** (for PUT):
   - All fields optional (partial update)
   - Same validation rules as create schema but with `.optional()` on all fields
   - If `name` is provided, it must not be empty

3. **`listMealPlansQuerySchema`** (for GET query params):
   - `search`: `z.string().max(100).optional()`
   - `sort`: `z.enum(['created_at', 'updated_at', 'name']).optional().default('updated_at')`
   - `order`: `z.enum(['asc', 'desc']).optional().default('desc')`

4. **`mealPlanIdParamSchema`** (for path params):
   - `id`: `z.string().uuid()`

### SQL Injection Prevention

- Use Supabase query builder methods (`.eq()`, `.select()`, etc.) which parameterize queries
- Never concatenate user input into raw SQL strings

### JSON Injection Prevention

- Validate all JSON structures using Zod before storing in database
- Ensure `plan_content` and `target_macro_distribution` match expected schemas

### Foreign Key Validation

- If `source_chat_session_id` is provided, validate it exists and belongs to the user (optional but recommended)
- Database foreign key constraint will enforce referential integrity

### File Export Security

- Validate the meal plan belongs to the user before generating export
- Sanitize filename to prevent path traversal attacks
- Set appropriate Content-Disposition headers

## 7. Error Handling

### 400 Bad Request

**Triggers:**
- Request body fails Zod validation (POST/PUT)
- Query parameters fail validation (GET with filters)
- Path parameter `id` is not a valid UUID
- Invalid enum values (e.g., `activity_level`, `sort`, `order`)
- Business logic validation fails (e.g., empty `name` on update)

**Response:**
```json
{
  "error": "Validation failed",
  "details": [/* Zod error array or custom validation errors */]
}
```

**Handling:**
- Return validation errors from `zodError.errors` for debugging
- In production, consider sanitizing detailed error messages

### 401 Unauthorized

**Triggers:**
- No `Authorization` header provided
- Invalid or expired JWT token
- `supabase.auth.getUser()` returns error or null user

**Response:**
```json
{
  "error": "Unauthorized",
  "details": "Authentication required"
}
```

**Handling:**
- Return immediately after authentication check
- Do not reveal whether a resource exists if user is unauthenticated

### 404 Not Found

**Triggers:**
- Meal plan with provided `id` does not exist
- Meal plan exists but belongs to another user (RLS filters it out)
- Foreign key validation: `source_chat_session_id` does not exist (if validation is implemented)

**Response:**
```json
{
  "error": "Meal plan not found",
  "details": "No meal plan found with the provided ID"
}
```

**Handling:**
- Check if Supabase query returns null/empty result
- Throw custom `NotFoundError` in service, catch in route handler

### 500 Internal Server Error

**Triggers:**
- Database connection failure
- Unexpected Supabase error
- JSON parsing errors (if not caught earlier)
- Service layer throws unexpected error

**Response:**
```json
{
  "error": "An internal error occurred",
  "details": "[Optional: Error message in development, omitted in production]"
}
```

**Handling:**
- Log full error details server-side
- Return generic message to client (don't expose internal details)
- Consider implementing error logging to an error tracking service

### Custom Error Types

Create custom error classes for better error handling:

```typescript
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public details: unknown) {
    super(message);
    this.name = 'ValidationError';
  }
}
```

## 8. Performance Considerations

### Database Query Optimization

1. **List Endpoint:**
   - The `idx_meal_plans_name_trgm` GIN index optimizes `ILIKE '%search%'` queries
   - Default sort by `updated_at DESC` uses the index on `user_id` efficiently
   - Limit results if pagination is needed in the future (not in MVP)

2. **Get by ID:**
   - Primary key lookup is O(log n) with B-tree index
   - RLS check is applied at query time, minimal overhead

3. **Update:**
   - Single row update by primary key is very fast
   - Trigger execution for `updated_at` adds minimal overhead

### Response Size

1. **List Endpoint:**
   - Consider pagination if user has many meal plans (>100)
   - Currently returns all plans; add `limit` and `offset` query params if needed

2. **Full Plan Response:**
   - `plan_content` JSONB can be large if many meals
   - No compression needed for JSON responses (handled by HTTP/2)
   - Consider streaming for export endpoint if file size is large

### Caching (Future)

- List endpoint could be cached per user (cache invalidation on create/update/delete)
- Individual plan responses rarely change after creation (cache with long TTL)
- Not required for MVP

### N+1 Query Prevention

- List endpoint uses single query with all fields
- No additional queries needed for related data

## 9. Implementation Steps

### Step 1: Create Validation Schemas (`/src/lib/validation/meal-plans.schemas.ts`)

1. Create Zod schemas:
   - `targetMacroDistributionSchema` (reusable, may already exist in `ai.schemas.ts`)
   - `mealPlanContentDailySummarySchema`
   - `mealPlanMealSchema`
   - `mealPlanContentSchema`
   - `mealPlanStartupDataSchema`
   - `createMealPlanSchema`
   - `updateMealPlanSchema`
   - `listMealPlansQuerySchema`
   - `mealPlanIdParamSchema`

2. Export all schemas for use in route handlers

### Step 2: Create Meal Plan Service (`/src/lib/meal-plans/meal-plan.service.ts`)

1. Create `MealPlanService` class with static methods:
   - `listMealPlans(userId, filters, supabase)`
   - `createMealPlan(command, userId, supabase)`
   - `getMealPlanById(id, userId, supabase)`
   - `updateMealPlan(id, command, userId, supabase)`
   - `deleteMealPlan(id, userId, supabase)`

2. Implement data transformation logic:
   - Flatten `CreateMealPlanCommand` to database insert format
   - Transform database rows to DTOs

3. Handle errors:
   - Throw `NotFoundError` when plan not found
   - Throw standard `Error` for other failures

### Step 3: Create Custom Error Types (`/src/lib/errors.ts` - Optional but Recommended)

1. Define error classes:
   - `NotFoundError`
   - `ValidationError`
   - `DatabaseError`

2. Export for use across the application

### Step 4: Create API Route Files

#### Option A: Single Dynamic Route (`/src/pages/api/meal-plans/[id].ts`)

Handle all methods in one file using `export const GET/POST/PUT/DELETE`.

#### Option B: Separate Route Files (Recommended for Clarity)

1. **List/Create** (`/src/pages/api/meal-plans/index.ts`):
   - `export const GET` for list
   - `export const POST` for create

2. **Single Plan Operations** (`/src/pages/api/meal-plans/[id].ts`):
   - `export const GET` for get by ID
   - `export const PUT` for update
   - `export const DELETE` for delete

3. **Export** (`/src/pages/api/meal-plans/[id]/export.ts`):
   - `export const GET` for export (future implementation)

### Step 5: Implement List Endpoint (`GET /api/meal-plans`)

1. Authenticate user
2. Parse and validate query parameters using `listMealPlansQuerySchema`
3. Call `MealPlanService.listMealPlans(userId, filters, supabase)`
4. Return 200 with `GetMealPlansResponseDto`

### Step 6: Implement Create Endpoint (`POST /api/meal-plans`)

1. Authenticate user
2. Parse JSON body
3. Validate body using `createMealPlanSchema`
4. Call `MealPlanService.createMealPlan(validatedData, userId, supabase)`
5. Return 201 with `CreateMealPlanResponseDto`

### Step 7: Implement Get by ID Endpoint (`GET /api/meal-plans/{id}`)

1. Authenticate user
2. Extract and validate `id` from path params using `mealPlanIdParamSchema`
3. Call `MealPlanService.getMealPlanById(id, userId, supabase)`
4. Return 200 with `GetMealPlanByIdResponseDto`
5. Catch `NotFoundError` and return 404

### Step 8: Implement Update Endpoint (`PUT /api/meal-plans/{id}`)

1. Authenticate user
2. Extract and validate `id` from path params
3. Parse and validate JSON body using `updateMealPlanSchema`
4. Call `MealPlanService.updateMealPlan(id, validatedData, userId, supabase)`
5. Return 200 with `UpdateMealPlanResponseDto`
6. Catch `NotFoundError` and return 404

### Step 9: Implement Delete Endpoint (`DELETE /api/meal-plans/{id}`)

1. Authenticate user
2. Extract and validate `id` from path params
3. Call `MealPlanService.deleteMealPlan(id, userId, supabase)`
4. Return 204 No Content
5. Catch `NotFoundError` and return 404

### Step 10: Error Handling in Route Handlers

1. Wrap all service calls in try-catch blocks
2. Map error types to HTTP status codes:
   - `ValidationError` → 400
   - `NotFoundError` → 404
   - Authentication errors → 401
   - All other errors → 500
3. Return consistent error response format

### Step 11: Testing

1. Unit tests for service methods (mock Supabase client)
2. Integration tests for API endpoints (test against local Supabase)
3. Test authentication scenarios
4. Test RLS policies
5. Test validation errors
6. Test edge cases (empty results, invalid UUIDs, etc.)

### Step 12: Export Endpoint (Future Implementation)

1. Install document generation library (e.g., `docx`)
2. Implement `MealPlanService.exportMealPlan()`
3. Create route handler for `GET /api/meal-plans/{id}/export`
4. Generate `.doc` file with meal plan data
5. Return file with appropriate headers

## 10. File Structure

```
src/
├── lib/
│   ├── meal-plans/
│   │   └── meal-plan.service.ts      # Service layer for meal plans
│   ├── validation/
│   │   └── meal-plans.schemas.ts     # Zod validation schemas
│   └── errors.ts                     # Custom error classes (optional)
├── pages/
│   └── api/
│       └── meal-plans/
│           ├── index.ts              # GET list, POST create
│           ├── [id].ts               # GET by ID, PUT, DELETE
│           └── [id]/
│               └── export.ts         # GET export (future)
└── types.ts                          # Type definitions (already exists)
```

## 11. Dependencies

### Required Packages

- `zod` - Already installed (used in `ai.schemas.ts`)
- `@supabase/supabase-js` - Already installed

### Future Dependencies

- `docx` or similar - For export endpoint document generation

## 12. Notes and Considerations

### Authentication Testing

The existing `sessions.ts` endpoint has authentication temporarily disabled for testing. When implementing meal plans endpoints. Implement proper authentication from the start for this endpoint

### RLS Policy Testing

Ensure RLS policies are properly tested:
- Users cannot access other users' meal plans
- Users cannot update/delete other users' meal plans
- Anonymous users cannot access any meal plans

### Data Transformation

The service layer must handle the transformation between:
- **API Command/DTO** (nested structure with `startup_data` object)
- **Database Row** (flat structure with `patient_age`, `patient_weight`, etc. as separate columns)

This is a key architectural decision: the API uses a more user-friendly nested structure, while the database uses a normalized flat structure.

### Future Enhancements (not to implement at current poroject stage)

1. **Pagination:** Add `limit` and `offset` or cursor-based pagination to list endpoint
2. **Bulk Operations:** Add endpoints for bulk create/update/delete
3. **Export Formats:** Support multiple export formats (PDF, JSON, etc.)
4. **Versioning:** Track plan versions if editing history is needed
5. **Soft Delete:** Implement soft delete instead of hard delete if audit trail is required

