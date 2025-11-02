#!/bin/bash

# Quick test for the API endpoint
# Make sure the dev server is running: npm run dev (in another terminal)

API_URL="${API_URL:-http://localhost:3000}/api/ai/sessions"

echo "Quick API Test"
echo "=============="
echo "Testing: $API_URL"
echo ""

# Simple test without auth (expect 401)
echo "Test 1: Unauthenticated request (expect 401)..."
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{"patient_age":30,"activity_level":"moderate"}' \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | tail -n 1

echo ""
echo "Done! Check the HTTP status above."

