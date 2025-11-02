#!/bin/bash

# Test script for POST /api/ai/sessions endpoint using curl
# 
# Usage:
# 1. Set environment variables:
#    export SUPABASE_URL="your-supabase-url"
#    export SUPABASE_KEY="your-supabase-anon-key"
#    export JWT_TOKEN="your-jwt-token"  # Optional: will auto-fetch if not set
#    export TEST_EMAIL="test@example.com"  # Optional: for auto-authentication
#    export TEST_PASSWORD="testpassword123"  # Optional: for auto-authentication
#    export OPENROUTER_API_KEY="your-openrouter-key"
# 
# 2. Start the dev server: npm run dev
# 
# 3. Run this script: bash test-curl.sh

# astro.config.mjs shows port 3000 - adjust if needed
API_URL="${API_URL:-http://localhost:3000}/api/ai/sessions"

echo "🚀 Testing POST /api/ai/sessions endpoint"
echo ""

# Auto-detect and fetch JWT token if not provided
if [ -z "$JWT_TOKEN" ]; then
  echo "⚠️  JWT_TOKEN not set, attempting to fetch from Supabase..."
  
  # Check if we have Supabase credentials
  if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
    echo "❌ Cannot fetch token: SUPABASE_URL and SUPABASE_KEY must be set"
    echo "   Please set these environment variables or provide JWT_TOKEN manually"
    echo ""
  else
    # Try to get token using get-supabase-token.sh logic
    AUTH_URL="$SUPABASE_URL/auth/v1/token?grant_type=password"
    EMAIL="${TEST_EMAIL:-test@example.com}"
    PASSWORD="${TEST_PASSWORD:-testpassword123}"
    
    echo "📧 Attempting sign in as: $EMAIL"
    
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$AUTH_URL" \
      -H "apikey: $SUPABASE_KEY" \
      -H "Content-Type: application/json" \
      -d "{
        \"email\": \"$EMAIL\",
        \"password\": \"$PASSWORD\"
      }")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    BODY=$(printf '%s' "$BODY" | sed -z 's/\n$//')
    
    if [ "$HTTP_CODE" == "200" ]; then
      # Extract token
      if command -v python3 &> /dev/null; then
        JWT_TOKEN=$(printf '%s' "$BODY" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('access_token', ''), end='')" 2>/dev/null)
      elif command -v jq &> /dev/null; then
        JWT_TOKEN=$(printf '%s' "$BODY" | jq -r '.access_token // empty' 2>/dev/null)
      else
        JWT_TOKEN=$(printf '%s' "$BODY" | sed -n 's/.*"access_token":"\([^"]*\)".*/\1/p')
      fi
      
      if [ -n "$JWT_TOKEN" ] && [ "$JWT_TOKEN" != "null" ]; then
        echo "✅ Successfully obtained JWT token"
        export JWT_TOKEN
        echo ""
      else
        echo "❌ Failed to extract token from response"
        echo "Response: $BODY"
      fi
    else
      echo "⚠️  Could not obtain token (HTTP $HTTP_CODE)"
      echo "   You may need to create a test user first:"
      echo "   bash create-test-user.sh"
      echo ""
    fi
  fi
fi

# Test 1: No authentication (should return 401)
echo "=== Test 1: Request without authentication ==="
curl -X POST "$API_URL" \
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
  }' \
  -w "\nStatus: %{http_code}\n" \
  -s

echo ""
echo ""

# Test 2: Invalid validation (should return 400)
echo "=== Test 2: Request with invalid validation ==="
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer invalid-token" \
  -d '{
    "patient_age": -5,
    "activity_level": "invalid"
  }' \
  -w "\nStatus: %{http_code}\n" \
  -s

echo ""
echo ""

# Test 3: Valid request with authentication (if JWT_TOKEN is available)
if [ -z "$JWT_TOKEN" ]; then
  echo "=== Test 3: Valid request with authentication ==="
  echo "⚠️  Skipping - No valid JWT token available"
  echo "   Set JWT_TOKEN, SUPABASE_URL, and SUPABASE_KEY to test authenticated requests"
else
  echo "=== Test 3: Valid request with authentication ==="
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
  echo "$body" | python3 -m json.tool 2>/dev/null || echo "$body" | jq '.' 2>/dev/null || echo "$body"
  
  if [ "$http_code" == "201" ]; then
    session_id=$(echo "$body" | python3 -c "import sys, json; print(json.load(sys.stdin).get('session_id', 'N/A'))" 2>/dev/null || echo "N/A")
    echo ""
    echo "✅ PASS: Successfully created session"
    echo "   Session ID: $session_id"
  elif [ "$http_code" == "401" ]; then
    echo ""
    echo "⚠️  Authentication failed - token may be invalid or expired"
  elif [ "$http_code" == "502" ]; then
    echo ""
    echo "⚠️  OpenRouter API unavailable - check OPENROUTER_API_KEY"
  else
    echo ""
    echo "⚠️  Unexpected status code: $http_code"
  fi
fi

echo ""
echo "✅ Tests completed"

