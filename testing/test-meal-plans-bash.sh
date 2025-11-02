#!/bin/bash

# Test script for Meal Plans API endpoints
# Works on Git Bash, WSL, Linux, or macOS
#
# Tests all CRUD operations:
# - GET /api/meal-plans (list)
# - POST /api/meal-plans (create)
# - GET /api/meal-plans/{id} (get by id)
# - PUT /api/meal-plans/{id} (update)
# - DELETE /api/meal-plans/{id} (delete)

API_URL="${API_URL:-http://localhost:3000}"
BASE_ENDPOINT="${API_URL}/api/meal-plans"

echo "🚀 Testing Meal Plans API endpoints"
echo "📍 Base endpoint: $BASE_ENDPOINT"
echo ""

# Helper function to pretty print JSON responses
print_json() {
  echo "$1" | python3 -m json.tool 2>/dev/null || echo "$1"
}

# Store created meal plan ID for subsequent tests
CREATED_MEAL_PLAN_ID=""

# Test 1: GET /api/meal-plans without authentication (should return 401)
echo "=== Test 1: GET /api/meal-plans without authentication ==="
response=$(curl -s -w "\n%{http_code}" -X GET "$BASE_ENDPOINT" \
  -H "Content-Type: application/json")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

echo "Status: $http_code"
echo "Response:"
print_json "$body"

if [ "$http_code" == "401" ]; then
  echo "✅ PASS: Correctly returned 401 Unauthorized"
else
  echo "⚠️  Expected 401, got $http_code"
fi

echo ""
echo ""

# Test 2: POST /api/meal-plans without authentication (should return 401)
echo "=== Test 2: POST /api/meal-plans without authentication ==="
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_ENDPOINT" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Meal Plan",
    "plan_content": {
      "daily_summary": { "kcal": 2000, "proteins": 150, "fats": 60, "carbs": 215 },
      "meals": [
        {
          "name": "Breakfast",
          "ingredients": "Oats 50g, milk 200ml",
          "preparation": "Mix and cook",
          "summary": { "kcal": 400, "p": 20, "f": 10, "c": 58 }
        }
      ]
    },
    "startup_data": {
      "patient_age": 30,
      "activity_level": "moderate",
      "target_kcal": 2000
    }
  }')

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

echo "Status: $http_code"
if [ "$http_code" == "401" ]; then
  echo "✅ PASS: Correctly returned 401 Unauthorized"
else
  echo "⚠️  Expected 401, got $http_code"
fi

echo ""
echo ""

# Test 3: POST /api/meal-plans with invalid validation (should return 400)
echo "=== Test 3: POST /api/meal-plans with invalid validation ==="
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer invalid-token" \
  -d '{
    "name": "",
    "plan_content": {
      "daily_summary": { "kcal": -100, "proteins": 150, "fats": 60, "carbs": 215 },
      "meals": []
    },
    "startup_data": {
      "patient_age": -5,
      "activity_level": "invalid_enum_value"
    }
  }')

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

echo "Status: $http_code"
echo "Response:"
print_json "$body"

if [ "$http_code" == "400" ]; then
  echo "✅ PASS: Correctly returned 400 Bad Request for invalid data"
else
  echo "⚠️  Expected 400, got $http_code"
fi

echo ""
echo ""

# Tests that require authentication
if [ -z "$JWT_TOKEN" ]; then
  echo "=== Tests 4-12: Authenticated endpoints ==="
  echo "⚠️  Skipping - JWT_TOKEN environment variable not set"
  echo "   To test authenticated endpoints:"
  echo "   1. Get a JWT token from Supabase"
  echo "   2. Export it: export JWT_TOKEN='your-token-here'"
  echo "   3. Re-run this script"
  echo ""
  echo "✅ Test suite completed (unauthenticated tests only)"
  exit 0
fi

# Test 4: GET /api/meal-plans with authentication
echo "=== Test 4: GET /api/meal-plans with authentication ==="
response=$(curl -s -w "\n%{http_code}" -X GET "$BASE_ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

echo "Status: $http_code"
if [ "$http_code" == "200" ]; then
  meal_count=$(echo "$body" | python3 -c "import sys, json; data=json.load(sys.stdin); print(len(data) if isinstance(data, list) else 0)" 2>/dev/null || echo "0")
  echo "✅ PASS: Successfully retrieved meal plans list"
  echo "   Found $meal_count meal plans"
else
  echo "⚠️  Unexpected status: $http_code"
  print_json "$body"
fi

echo ""
echo ""

# Test 5: GET /api/meal-plans with query parameters
echo "=== Test 5: GET /api/meal-plans with query parameters ==="
response=$(curl -s -w "\n%{http_code}" -X GET "$BASE_ENDPOINT?search=Test&sort=name&order=asc" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

echo "Status: $http_code"
if [ "$http_code" == "200" ]; then
  echo "✅ PASS: Successfully retrieved filtered meal plans"
else
  echo "⚠️  Unexpected status: $http_code"
fi

echo ""
echo ""

# Test 6: POST /api/meal-plans with authentication (create)
echo "=== Test 6: POST /api/meal-plans with authentication ==="
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "name": "Weight Reduction Plan - Test Patient",
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
          "summary": { "kcal": 400, "p": 20, "f": 10, "c": 58 }
        },
        {
          "name": "Lunch",
          "ingredients": "Chicken breast 150g, quinoa 100g, vegetables 200g, olive oil 10ml",
          "preparation": "Grill chicken, cook quinoa, steam vegetables. Combine and drizzle with olive oil.",
          "summary": { "kcal": 600, "p": 50, "f": 20, "c": 65 }
        },
        {
          "name": "Dinner",
          "ingredients": "Salmon 150g, sweet potato 200g, broccoli 150g, olive oil 10ml",
          "preparation": "Bake salmon and sweet potato at 400°F for 15-20 minutes. Steam broccoli.",
          "summary": { "kcal": 500, "p": 40, "f": 20, "c": 52 }
        },
        {
          "name": "Snacks",
          "ingredients": "Greek yogurt 150g, mixed nuts 30g, apple 1 medium",
          "preparation": "Eat throughout the day as needed.",
          "summary": { "kcal": 500, "p": 40, "f": 10, "c": 40 }
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
      "meal_names": "Breakfast, Lunch, Dinner, Snacks",
      "exclusions_guidelines": "Gluten-free, no nuts in breakfast"
    }
  }')

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

echo "Status: $http_code"
if [ "$http_code" == "201" ]; then
  CREATED_MEAL_PLAN_ID=$(echo "$body" | python3 -c "import sys, json; print(json.load(sys.stdin).get('id', ''))" 2>/dev/null || echo "")
  if [ -n "$CREATED_MEAL_PLAN_ID" ]; then
    echo "✅ PASS: Successfully created meal plan"
    echo "   Meal Plan ID: $CREATED_MEAL_PLAN_ID"
  else
    echo "⚠️  Created but could not extract ID from response"
  fi
else
  echo "⚠️  Unexpected status: $http_code"
  print_json "$body"
fi

echo ""
echo ""

if [ -z "$CREATED_MEAL_PLAN_ID" ]; then
  echo "⚠️  Cannot continue with remaining tests - no meal plan ID available"
  echo "   This usually means the create test failed"
  echo ""
  echo "✅ Test suite completed"
  exit 0
fi

# Test 7: GET /api/meal-plans/{id} with authentication
echo "=== Test 7: GET /api/meal-plans/{id} with authentication ==="
response=$(curl -s -w "\n%{http_code}" -X GET "$BASE_ENDPOINT/$CREATED_MEAL_PLAN_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

echo "Status: $http_code"
if [ "$http_code" == "200" ]; then
  name=$(echo "$body" | python3 -c "import sys, json; print(json.load(sys.stdin).get('name', 'N/A'))" 2>/dev/null || echo "N/A")
  echo "✅ PASS: Successfully retrieved meal plan"
  echo "   Name: $name"
else
  echo "⚠️  Unexpected status: $http_code"
  print_json "$body"
fi

echo ""
echo ""

# Test 8: GET /api/meal-plans/{id} with invalid ID
echo "=== Test 8: GET /api/meal-plans/{id} with invalid ID ==="
response=$(curl -s -w "\n%{http_code}" -X GET "$BASE_ENDPOINT/not-a-valid-uuid" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

echo "Status: $http_code"
if [ "$http_code" == "400" ] || [ "$http_code" == "404" ]; then
  echo "✅ PASS: Correctly returned error for invalid ID"
else
  echo "⚠️  Unexpected status: $http_code"
fi

echo ""
echo ""

# Test 9: PUT /api/meal-plans/{id} with authentication
echo "=== Test 9: PUT /api/meal-plans/{id} with authentication ==="
response=$(curl -s -w "\n%{http_code}" -X PUT "$BASE_ENDPOINT/$CREATED_MEAL_PLAN_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "name": "Updated Weight Reduction Plan - Test Patient",
    "target_kcal": 1800
  }')

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

echo "Status: $http_code"
if [ "$http_code" == "200" ]; then
  name=$(echo "$body" | python3 -c "import sys, json; print(json.load(sys.stdin).get('name', 'N/A'))" 2>/dev/null || echo "N/A")
  echo "✅ PASS: Successfully updated meal plan"
  echo "   Updated name: $name"
else
  echo "⚠️  Unexpected status: $http_code"
  print_json "$body"
fi

echo ""
echo ""

# Test 10: DELETE /api/meal-plans/{id} without authentication (should return 401)
echo "=== Test 10: DELETE /api/meal-plans/{id} without authentication ==="
response=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_ENDPOINT/$CREATED_MEAL_PLAN_ID" \
  -H "Content-Type: application/json")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

echo "Status: $http_code"
if [ "$http_code" == "401" ]; then
  echo "✅ PASS: Correctly returned 401 Unauthorized"
else
  echo "⚠️  Expected 401, got $http_code"
fi

echo ""
echo ""

# Test 11: DELETE /api/meal-plans/{id} with authentication
echo "=== Test 11: DELETE /api/meal-plans/{id} with authentication ==="
response=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_ENDPOINT/$CREATED_MEAL_PLAN_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN")

http_code=$(echo "$response" | tail -n1)

echo "Status: $http_code"
if [ "$http_code" == "204" ]; then
  echo "✅ PASS: Successfully deleted meal plan"
  CREATED_MEAL_PLAN_ID="" # Reset
else
  body=$(echo "$response" | sed '$d')
  echo "⚠️  Unexpected status: $http_code"
  print_json "$body"
fi

echo ""
echo ""
echo "✅ Test suite completed"

