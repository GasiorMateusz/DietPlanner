#!/bin/bash

# Script to get a Supabase JWT token for testing
# 
# Usage:
#   export SUPABASE_URL="your-supabase-url"
#   export SUPABASE_KEY="your-supabase-anon-key"
#   export TEST_EMAIL="test@example.com"
#   export TEST_PASSWORD="test-password-here"
#   bash get-supabase-token.sh
#
# Or for local Supabase:
#   export SUPABASE_URL="http://localhost:54321"
#   export SUPABASE_KEY="<your-local-anon-key>"
#   bash get-supabase-token.sh

# Auto-detect local Supabase if SUPABASE_URL is not set
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
  # Check if we can detect local Supabase
  if command -v npx &> /dev/null; then
    echo "🔍 Checking for local Supabase instance..."
    STATUS_OUTPUT=$(npx supabase status 2>/dev/null)
    
    if [ $? -eq 0 ] && echo "$STATUS_OUTPUT" | grep -q "API URL:"; then
      # Extract API URL
      DETECTED_URL=$(echo "$STATUS_OUTPUT" | grep "API URL:" | awk '{print $3}')
      
      # Extract Publishable key (anon key)
      DETECTED_ANON=$(echo "$STATUS_OUTPUT" | grep "Publishable key:" | awk '{print $3}')
      
      if [ -n "$DETECTED_URL" ] && [ -n "$DETECTED_ANON" ]; then
        SUPABASE_URL="${SUPABASE_URL:-$DETECTED_URL}"
        SUPABASE_KEY="${SUPABASE_KEY:-$DETECTED_ANON}"
        echo "✅ Auto-detected local Supabase:"
        echo "   URL: $SUPABASE_URL"
        echo "   Anon Key: ${SUPABASE_KEY:0:20}..."
        echo ""
      fi
    fi
  fi
fi

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
  echo "❌ Error: SUPABASE_URL and SUPABASE_KEY must be set"
  echo ""
  echo "For remote Supabase:"
  echo "  export SUPABASE_URL='https://your-project.supabase.co'"
  echo "  export SUPABASE_KEY='your-anon-key'"
  echo ""
  echo "For local Supabase:"
  echo "  export SUPABASE_URL='http://localhost:54321'"
  echo "  export SUPABASE_KEY='<Publishable key from: npx supabase status>'"
  echo ""
  exit 1
fi

# Use provided credentials or prompt
EMAIL="${TEST_EMAIL:-test@example.com}"
PASSWORD="${TEST_PASSWORD:-}"

if [ -z "$PASSWORD" ]; then
  echo "Enter password for $EMAIL (or set TEST_PASSWORD env var):" >&2
  read -s PASSWORD
  echo "" >&2
fi

# If still no password, use default (for local testing)
if [ -z "$PASSWORD" ]; then
  PASSWORD="testpassword123"
  echo "⚠️  No password provided, using default for local testing" >&2
fi

echo "🔐 Attempting to sign in..."
echo "📧 Email: $EMAIL"
echo "🌐 Supabase URL: $SUPABASE_URL"
echo ""

# Sign in via password grant
AUTH_URL="$SUPABASE_URL/auth/v1/token?grant_type=password"

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$AUTH_URL" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\"
  }")

# Extract HTTP code (last line) and body (everything else)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
# Remove the last line (HTTP code) - sed method works cross-platform
BODY=$(echo "$RESPONSE" | sed '$d')
# Remove trailing newline if present
BODY=$(printf '%s' "$BODY" | sed -z 's/\n$//')

if [ "$HTTP_CODE" == "200" ]; then
  # Extract access_token using Python, jq, or sed
  TOKEN=""
  
  # Try Python3 first (most reliable)
  if command -v python3 &> /dev/null; then
    TOKEN=$(printf '%s' "$BODY" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('access_token', ''), end='')" 2>/dev/null)
  fi
  
  # Fallback to jq if Python didn't work
  if [ -z "$TOKEN" ] && command -v jq &> /dev/null; then
    TOKEN=$(printf '%s' "$BODY" | jq -r '.access_token // empty' 2>/dev/null)
  fi
  
  # Final fallback to sed
  if [ -z "$TOKEN" ]; then
    TOKEN=$(printf '%s' "$BODY" | sed -n 's/.*"access_token":"\([^"]*\)".*/\1/p')
  fi

  if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
    echo "✅ Success! JWT Token retrieved:"
    echo ""
    echo "$TOKEN"
    echo ""
    echo "📋 To use with test-bash.sh:"
    echo "   export JWT_TOKEN='$TOKEN'"
    echo "   bash test-bash.sh"
    echo ""
    echo "💡 Or copy this token and set it as an environment variable"
  else
    echo "❌ Failed to extract token from response"
    echo "Response: $BODY"
    echo ""
    echo "💡 Debug: Try installing python3 or jq for better JSON parsing"
  fi
elif [ "$HTTP_CODE" == "400" ]; then
  echo "❌ Bad Request - User might not exist"
  echo ""
  echo "Response:"
  echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
  echo ""
  echo "💡 Create the user first:"
  echo "   bash create-test-user.sh"
elif [ "$HTTP_CODE" == "401" ]; then
  echo "❌ Unauthorized - Wrong email or password"
  echo ""
  echo "Response:"
  echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
else
  echo "❌ Error: HTTP $HTTP_CODE"
  echo ""
  echo "Response:"
  echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
fi

