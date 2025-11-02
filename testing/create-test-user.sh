#!/bin/bash

# Script to create a test user in Supabase
# 
# Usage:
#   export SUPABASE_URL="your-supabase-url"
#   export SUPABASE_KEY="your-supabase-service-role-key"  # NOTE: Service role, not anon!
#   export TEST_EMAIL="test@example.com"
#   export TEST_PASSWORD="test-password-here"
#   bash create-test-user.sh
#
# Or for local Supabase (auto-detects credentials):
#   bash create-test-user.sh

# Auto-detect local Supabase if SUPABASE_URL is not set
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
  # Check if we can detect local Supabase
  if command -v npx &> /dev/null; then
    echo "🔍 Checking for local Supabase instance..."
    STATUS_OUTPUT=$(npx supabase status 2>/dev/null)
    
    if [ $? -eq 0 ] && echo "$STATUS_OUTPUT" | grep -q "API URL:"; then
      # Extract API URL
      DETECTED_URL=$(echo "$STATUS_OUTPUT" | grep "API URL:" | awk '{print $3}')
      
      # Extract Secret key (service role key)
      DETECTED_SECRET=$(echo "$STATUS_OUTPUT" | grep "Secret key:" | awk '{print $3}')
      
      if [ -n "$DETECTED_URL" ] && [ -n "$DETECTED_SECRET" ]; then
        SUPABASE_URL="${SUPABASE_URL:-$DETECTED_URL}"
        SUPABASE_KEY="${SUPABASE_KEY:-$DETECTED_SECRET}"
        echo "✅ Auto-detected local Supabase:"
        echo "   URL: $SUPABASE_URL"
        echo "   Service Role Key: ${SUPABASE_KEY:0:20}..."
        echo ""
      fi
    fi
  fi
fi

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
  echo "❌ Error: SUPABASE_URL and SUPABASE_KEY must be set"
  echo ""
  echo "⚠️  NOTE: SUPABASE_KEY should be the SERVICE_ROLE_KEY (not anon key) for admin operations"
  echo ""
  echo "For local Supabase, run:"
  echo "   npx supabase status"
  echo "   export SUPABASE_URL='http://127.0.0.1:54321'"
  echo "   export SUPABASE_KEY='<Secret key from status output>'"
  echo ""
  exit 1
fi

EMAIL="${TEST_EMAIL:-test@example.com}"
PASSWORD="${TEST_PASSWORD:-testpassword123}"

echo "👤 Creating test user..."
echo "📧 Email: $EMAIL"
echo "🌐 Supabase URL: $SUPABASE_URL"
echo ""

# Create user via admin API (requires service role key)
ADMIN_URL="$SUPABASE_URL/auth/v1/admin/users"

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$ADMIN_URL" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\",
    \"email_confirm\": true
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" == "200" ] || [ "$HTTP_CODE" == "201" ]; then
  echo "✅ User created successfully!"
  echo ""
  echo "📋 Response:"
  echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
  echo ""
  echo "💡 Now get a JWT token:"
  echo "   export TEST_EMAIL='$EMAIL'"
  echo "   export TEST_PASSWORD='$PASSWORD'"
  echo "   bash get-supabase-token.sh"
elif [ "$HTTP_CODE" == "422" ]; then
  echo "⚠️  User might already exist"
  echo ""
  echo "Response:"
  echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
  echo ""
  echo "💡 Try to sign in instead:"
  echo "   bash get-supabase-token.sh"
else
  echo "❌ Error: HTTP $HTTP_CODE"
  echo ""
  echo "Response:"
  echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
  echo ""
  echo "💡 For local Supabase, get service role key with:"
  echo "   supabase status"
fi

