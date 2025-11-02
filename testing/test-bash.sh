#!/bin/bash

# Test script for POST /api/ai/sessions endpoint
# Works on Git Bash, WSL, Linux, or macOS

API_URL="${API_URL:-http://localhost:3000}/api/ai/sessions"

echo "🚀 Testing POST /api/ai/sessions endpoint"
echo "📍 Endpoint: $API_URL"
echo ""

# Test 1: No authentication (should return 401)
echo "=== Test 1: Request without authentication ==="
response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
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
  }')

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

echo "Status: $http_code"
echo "Response:"
echo "$body" | python3 -m json.tool 2>/dev/null || echo "$body"

if [ "$http_code" == "401" ]; then
  echo "✅ PASS: Correctly returned 401 Unauthorized"
else
  echo "⚠️  Expected 401, got $http_code"
fi

echo ""
echo ""

# Test 2: Invalid JSON (should return 400)
echo "=== Test 2: Request with invalid JSON ==="
response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer invalid-token" \
  -d 'invalid json{')

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

echo "Status: $http_code"
echo "Response:"
echo "$body" | python3 -m json.tool 2>/dev/null || echo "$body"

if [ "$http_code" == "400" ]; then
  echo "✅ PASS: Correctly returned 400 Bad Request for invalid JSON"
else
  echo "⚠️  Expected 400, got $http_code"
fi

echo ""
echo ""

# Test 3: Invalid validation (should return 400)
echo "=== Test 3: Request with invalid validation ==="
response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer invalid-token" \
  -d '{
    "patient_age": -5,
    "activity_level": "invalid_enum_value",
    "target_kcal": "not-a-number"
  }')

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

echo "Status: $http_code"
echo "Response:"
echo "$body" | python3 -m json.tool 2>/dev/null || echo "$body"

if [ "$http_code" == "400" ]; then
  echo "✅ PASS: Correctly returned 400 Bad Request for invalid data"
else
  echo "⚠️  Expected 400, got $http_code"
fi

echo ""
echo ""

# Test 4: Valid request with authentication (if JWT_TOKEN is provided)
if [ -z "$JWT_TOKEN" ]; then
  echo "=== Test 4: Valid request with authentication ==="
  echo "⚠️  Skipping - JWT_TOKEN environment variable not set"
  echo "   To test authenticated requests:"
  echo "   1. Get a JWT token from Supabase"
  echo "   2. Export it: export JWT_TOKEN='your-token-here'"
  echo "   3. Re-run this script"
else
  echo "=== Test 4: Valid request with authentication ==="
  response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -d '{
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
    }')

  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')

  echo "Status: $http_code"
  echo "Response:"
  echo "$body" | python3 -m json.tool 2>/dev/null || echo "$body"

  if [ "$http_code" == "201" ]; then
    session_id=$(echo "$body" | python3 -c "import sys, json; print(json.load(sys.stdin).get('session_id', 'N/A'))" 2>/dev/null || echo "N/A")
    echo "✅ PASS: Successfully created session"
    echo "   Session ID: $session_id"
  elif [ "$http_code" == "401" ]; then
    echo "⚠️  Authentication failed - token may be invalid or expired"
  elif [ "$http_code" == "502" ]; then
    echo "⚠️  OpenRouter API unavailable - check OPENROUTER_API_KEY"
  else
    echo "⚠️  Unexpected status code: $http_code"
  fi
fi

echo ""
echo "✅ Test suite completed"

