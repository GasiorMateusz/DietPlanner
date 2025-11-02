# Testing Guide for Meal Plans API Endpoints

This guide explains how to test the Meal Plans API endpoints (`/api/meal-plans`) with real requests.

## Prerequisites

1. **Environment Variables Setup**
   
   Create a `.env` file in the root directory with:
   ```env
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_KEY=your_supabase_anon_key
   ```

   Note: The code uses `SUPABASE_KEY` (not `SUPABASE_ANON_KEY` as mentioned in some docs).

2. **Start the Development Server**
   ```bash
   npm run dev
   ```
   
   The server should start on `http://localhost:3000` (default Astro port) or the port specified in `astro.config.mjs`.

3. **Supabase Authentication**
   
   For full testing including authenticated requests, you'll need:
   - A test user account in your Supabase project
   - A valid JWT token from that user
   
   See `SUPABASE_AUTH_GUIDE.md` or use the `create-test-user.sh` script to create a test user.

## Endpoints Overview

The Meal Plans API provides full CRUD operations:

- `GET /api/meal-plans` - List all meal plans (with optional search and sorting)
- `POST /api/meal-plans` - Create a new meal plan
- `GET /api/meal-plans/{id}` - Retrieve a single meal plan by ID
- `PUT /api/meal-plans/{id}` - Update an existing meal plan
- `DELETE /api/meal-plans/{id}` - Delete a meal plan

All endpoints require authentication (Bearer token in Authorization header).

## Testing Methods

### Method 1: Node.js Test Script (Recommended)

The `test-meal-plans-api.js` script includes comprehensive test scenarios for all endpoints:

```bash
# Set environment variables (optional, for authenticated tests)
export SUPABASE_URL="your-supabase-url"
export SUPABASE_KEY="your-supabase-key"
export SUPABASE_TEST_USER_EMAIL="test@example.com"
export SUPABASE_TEST_USER_PASSWORD="test-password"
export API_URL="http://localhost:3000"

# Run the test script
node testing/test-meal-plans-api.js
```

**Tests included:**
- ✅ Authentication checks (401 responses)
- ✅ Validation error handling (400 responses)
- ✅ GET /api/meal-plans (list with filters)
- ✅ POST /api/meal-plans (create)
- ✅ GET /api/meal-plans/{id} (get by ID)
- ✅ PUT /api/meal-plans/{id} (update)
- ✅ DELETE /api/meal-plans/{id} (delete)
- ✅ Invalid UUID handling (400/404)
- ✅ Query parameter validation

### Method 2: Bash Test Script

The `test-meal-plans-bash.sh` script provides curl-based testing:

```bash
# Make script executable (if needed)
chmod +x testing/test-meal-plans-bash.sh

# Set environment variables (optional, for authenticated tests)
export JWT_TOKEN="your-jwt-token"
export API_URL="http://localhost:3000"

# Run the script
bash testing/test-meal-plans-bash.sh
```

### Method 3: Manual cURL Commands

#### Test 1: List Meal Plans (Authenticated)

```bash
curl -X GET http://localhost:3000/api/meal-plans \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Expected: `200 OK` with array of meal plans

#### Test 2: List Meal Plans with Search and Sort

```bash
curl -X GET "http://localhost:3000/api/meal-plans?search=Test&sort=name&order=asc" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Expected: `200 OK` with filtered and sorted meal plans

#### Test 3: Create Meal Plan (Authenticated)

```bash
curl -X POST http://localhost:3000/api/meal-plans \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Weight Reduction Plan - J.K.",
    "plan_content": {
      "daily_summary": {
        "kcal": 2000,
        "proteins": 150,
        "fats": 60,
        "carbs": 215
      },
      "meals": [
        {
          "name": "Breakfast",
          "ingredients": "Oats 50g, milk 200ml, berries 100g, almonds 20g",
          "preparation": "Mix oats with milk, let sit overnight. Top with berries and almonds.",
          "summary": {
            "kcal": 400,
            "p": 20,
            "f": 10,
            "c": 58
          }
        },
        {
          "name": "Lunch",
          "ingredients": "Chicken breast 150g, quinoa 100g, vegetables 200g, olive oil 10ml",
          "preparation": "Grill chicken, cook quinoa, steam vegetables. Combine and drizzle with olive oil.",
          "summary": {
            "kcal": 600,
            "p": 50,
            "f": 20,
            "c": 65
          }
        },
        {
          "name": "Dinner",
          "ingredients": "Salmon 150g, sweet potato 200g, broccoli 150g, olive oil 10ml",
          "preparation": "Bake salmon and sweet potato at 400°F for 15-20 minutes. Steam broccoli.",
          "summary": {
            "kcal": 500,
            "p": 40,
            "f": 20,
            "c": 52
          }
        }
      ]
    },
    "startup_data": {
      "patient_age": 30,
      "patient_weight": 70.5,
      "patient_height": 170.0,
      "activity_level": "moderate",
      "target_kcal": 2000,
      "target_macro_distribution": {
        "p_perc": 30,
        "f_perc": 25,
        "c_perc": 45
      },
      "meal_names": "Breakfast, Lunch, Dinner",
      "exclusions_guidelines": "Gluten-free, no nuts"
    }
  }'
```

Expected: `201 Created` with complete meal plan object

#### Test 4: Get Meal Plan by ID

```bash
# Replace MEAL_PLAN_ID with actual UUID from previous create response
curl -X GET http://localhost:3000/api/meal-plans/MEAL_PLAN_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Expected: `200 OK` with complete meal plan object

#### Test 5: Update Meal Plan

```bash
curl -X PUT http://localhost:3000/api/meal-plans/MEAL_PLAN_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Updated Plan Name",
    "target_kcal": 1800
  }'
```

Expected: `200 OK` with updated meal plan object

#### Test 6: Delete Meal Plan

```bash
curl -X DELETE http://localhost:3000/api/meal-plans/MEAL_PLAN_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Expected: `204 No Content` (empty response body)

#### Test 7: Unauthenticated Request (should return 401)

```bash
curl -X GET http://localhost:3000/api/meal-plans \
  -H "Content-Type: application/json"
```

Expected: `{"error": "Unauthorized", "details": "Authentication required"}` with status 401

#### Test 8: Invalid Validation (should return 400)

```bash
curl -X POST http://localhost:3000/api/meal-plans \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "",
    "plan_content": {
      "daily_summary": { "kcal": -100, "proteins": 150, "fats": 60, "carbs": 215 },
      "meals": []
    },
    "startup_data": {
      "patient_age": -5,
      "activity_level": "invalid"
    }
  }'
```

Expected: Validation error details with status 400

### Method 4: Using Postman or Insomnia

1. **Create a new request collection** for Meal Plans API

2. **Set up environment variables:**
   - `base_url`: `http://localhost:3000`
   - `jwt_token`: Your Supabase JWT token

3. **Create requests for each endpoint:**
   - GET `{{base_url}}/api/meal-plans`
   - POST `{{base_url}}/api/meal-plans`
   - GET `{{base_url}}/api/meal-plans/{id}`
   - PUT `{{base_url}}/api/meal-plans/{id}`
   - DELETE `{{base_url}}/api/meal-plans/{id}`

4. **Add Authorization header to all requests:**
   - Type: `Bearer Token`
   - Token: `{{jwt_token}}`

## Expected Responses

### Success Responses

**200 OK (GET /api/meal-plans):**
```json
[
  {
    "id": "uuid-here",
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
      "meal_names": "Breakfast, Lunch, Dinner",
      "exclusions_guidelines": "Gluten-free, no nuts"
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

**201 Created (POST /api/meal-plans):**
```json
{
  "id": "new-uuid",
  "user_id": "auth-user-uuid",
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
  "meal_names": "Breakfast, Lunch, Dinner",
  "exclusions_guidelines": "Gluten-free, no nuts.",
  "created_at": "2025-01-23T12:00:00Z",
  "updated_at": "2025-01-23T12:00:00Z"
}
```

**200 OK (GET /api/meal-plans/{id} and PUT /api/meal-plans/{id}):**
Same structure as POST response - complete meal plan object.

**204 No Content (DELETE /api/meal-plans/{id}):**
Empty response body.

### Error Responses

**401 Unauthorized:**
```json
{
  "error": "Unauthorized",
  "details": "Authentication required"
}
```

**400 Bad Request (Validation Error):**
```json
{
  "error": "Validation failed",
  "details": [
    {
      "code": "invalid_type",
      "expected": "number",
      "received": "string",
      "path": ["startup_data", "patient_age"],
      "message": "Expected number, received string"
    },
    {
      "code": "too_small",
      "minimum": 1,
      "path": ["plan_content", "meals"],
      "message": "Array must contain at least 1 element(s)"
    }
  ]
}
```

**400 Bad Request (Invalid JSON):**
```json
{
  "error": "Invalid JSON in request body",
  "details": "Unexpected token..."
}
```

**400 Bad Request (Invalid UUID):**
```json
{
  "error": "Validation failed",
  "details": [
    {
      "code": "invalid_string",
      "validation": "uuid",
      "path": ["id"],
      "message": "Invalid uuid"
    }
  ]
}
```

**404 Not Found:**
```json
{
  "error": "Meal plan not found",
  "details": "Meal plan not found with ID: uuid-here"
}
```

**500 Internal Server Error:**
```json
{
  "error": "An internal error occurred",
  "details": "[Optional: Error message in development]"
}
```

## Query Parameters (GET /api/meal-plans)

The list endpoint supports the following query parameters:

- `search` (optional, string): Case-insensitive partial match on meal plan name
- `sort` (optional, enum): Field to sort by. Valid values: `created_at`, `updated_at`, `name`. Default: `updated_at`
- `order` (optional, enum): Sort order. Valid values: `asc`, `desc`. Default: `desc`

Examples:
- `GET /api/meal-plans?search=Weight`
- `GET /api/meal-plans?sort=name&order=asc`
- `GET /api/meal-plans?search=Test&sort=created_at&order=desc`

## Troubleshooting

### Issue: "Unauthorized" even with valid token
- Check that the Supabase client is properly configured in middleware
- Verify the JWT token is valid and not expired
- Ensure the Authorization header format is: `Bearer <token>`
- Verify the user exists in Supabase and RLS policies allow access

### Issue: "Meal plan not found" (404)
- Verify the meal plan ID is correct (must be a valid UUID)
- Check that the meal plan belongs to the authenticated user (RLS policy)
- Verify the meal plan exists in the database

### Issue: "Validation failed" (400)
- Check that all required fields are provided
- Verify field types match the schema (numbers vs strings, etc.)
- Ensure `plan_content.meals` array has at least one meal
- Verify `activity_level` is one of: `sedentary`, `light`, `moderate`, `high`
- Check that macro percentages are between 0-100

### Issue: Server not responding
- Check that the dev server is running: `npm run dev`
- Verify the port matches the configuration (default: 3000)
- Check server logs for errors

### Issue: Database errors (500)
- Verify Supabase is running and accessible
- Check that migrations have been applied (especially `meal_plans` table)
- Verify RLS policies allow operations on `meal_plans` table
- Check database logs for detailed error messages

## Local Supabase Setup

If using local Supabase:

1. **Start Supabase locally:**
   ```bash
   supabase start
   ```

2. **Get local credentials:**
   ```bash
   supabase status
   ```

3. **Update `.env` with local values:**
   ```env
   SUPABASE_URL=http://localhost:54321
   SUPABASE_KEY=<anon-key-from-status>
   ```

4. **Create a test user:**
   ```bash
   bash testing/create-test-user.sh
   ```
   Or manually:
   ```bash
   supabase auth users create test@example.com --password testpassword
   ```

5. **Get JWT token for testing:**
   ```bash
   bash testing/get-supabase-token.sh
   ```

## Test Data Structure

The test scripts use the following structure for creating meal plans:

- **name**: String (required, 1-255 characters)
- **source_chat_session_id**: UUID (optional, nullable)
- **plan_content**: Object containing:
  - **daily_summary**: Object with `kcal`, `proteins`, `fats`, `carbs` (all positive numbers)
  - **meals**: Array of meal objects (at least 1 required), each with:
    - **name**: String
    - **ingredients**: String
    - **preparation**: String
    - **summary**: Object with `kcal`, `p`, `f`, `c` (all non-negative numbers)
- **startup_data**: Object containing patient information:
  - **patient_age**: Number (optional, nullable, 1-150)
  - **patient_weight**: Number (optional, nullable, positive)
  - **patient_height**: Number (optional, nullable, positive)
  - **activity_level**: Enum (optional, nullable): `sedentary`, `light`, `moderate`, `high`
  - **target_kcal**: Number (optional, nullable, 1-10000)
  - **target_macro_distribution**: Object (optional, nullable) with `p_perc`, `f_perc`, `c_perc` (0-100 each)
  - **meal_names**: String (optional, nullable, max 500 chars)
  - **exclusions_guidelines**: String (optional, nullable, max 2000 chars)

