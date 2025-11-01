# Testing Guide for POST /api/ai/sessions

This guide explains how to test the AI sessions endpoint with real requests.

## Prerequisites

1. **Environment Variables Setup**
   
   Create a `.env` file in the root directory with:
   ```env
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_KEY=your_supabase_anon_key
   OPENROUTER_API_KEY=your_openrouter_api_key
   ```

   Note: The code uses `SUPABASE_KEY` (not `SUPABASE_ANON_KEY` as mentioned in some docs).

2. **Start the Development Server**
   ```bash
   npm run dev
   ```
   
   The server should start on `http://localhost:4321` (default Astro port) or the port specified in `astro.config.mjs`.

3. **Supabase Authentication (Optional)**
   
   For full testing including authenticated requests, you'll need:
   - A test user account in your Supabase project
   - A valid JWT token from that user

## Testing Methods

### Method 1: Node.js Test Script

The `test-api.js` script includes multiple test scenarios:

```bash
# Set environment variables (optional, for authenticated tests)
export SUPABASE_URL="your-supabase-url"
export SUPABASE_KEY="your-supabase-key"
export SUPABASE_TEST_USER_EMAIL="test@example.com"
export SUPABASE_TEST_USER_PASSWORD="test-password"
export OPENROUTER_API_KEY="your-openrouter-key"

# Run the test script
node test-api.js
```

**Tests included:**
- ✅ Request without authentication (should return 401)
- ✅ Invalid JSON format (should return 400)
- ✅ Invalid validation data (should return 400)
- ✅ Valid authenticated request (if credentials provided)

### Method 2: Bash Test Script (Recommended for Windows/Git Bash)

The `test-bash.sh` script provides comprehensive curl-based testing:

```bash
# Make script executable (if needed)
chmod +x test-bash.sh

# Set environment variables (optional, for authenticated tests)
export JWT_TOKEN="your-jwt-token"
export API_URL="http://localhost:3000"  # Adjust port if needed

# Run the script
bash test-bash.sh
```

**Or use the quick test:**
```bash
bash quick-test.sh
```

### Method 3: Manual cURL Commands

#### Test 1: Unauthenticated Request (should return 401)
```bash
curl -X POST http://localhost:4321/api/ai/sessions \
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
  }'
```

Expected: `{"error": "Unauthorized"}` with status 401

#### Test 2: Invalid Validation (should return 400)
```bash
curl -X POST http://localhost:4321/api/ai/sessions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer invalid-token" \
  -d '{
    "patient_age": -5,
    "activity_level": "invalid"
  }'
```

Expected: Validation error details with status 400

#### Test 3: Authenticated Valid Request (should return 201)

First, obtain a JWT token from Supabase:

```bash
# Sign in to get a token
curl -X POST 'https://your-project.supabase.co/auth/v1/token?grant_type=password' \
  -H "apikey: YOUR_SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-test-user@example.com",
    "password": "your-test-password"
  }'
```

Copy the `access_token` from the response, then:

```bash
curl -X POST http://localhost:4321/api/ai/sessions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
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
  }'
```

Expected: 
```json
{
  "session_id": "uuid-here",
  "message": {
    "role": "assistant",
    "content": "AI-generated meal plan..."
  },
  "prompt_count": 1
}
```
with status 201

### Method 4: Using Postman or Insomnia

1. **Create a new POST request**
   - URL: `http://localhost:4321/api/ai/sessions`
   - Method: `POST`

2. **Headers:**
   - `Content-Type: application/json`
   - `Authorization: Bearer YOUR_JWT_TOKEN` (optional, for authenticated tests)

3. **Body (raw JSON):**
   ```json
   {
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
   ```

## Expected Responses

### Success (201 Created)
```json
{
  "session_id": "uuid-here",
  "message": {
    "role": "assistant",
    "content": "Here is your 1-day meal plan..."
  },
  "prompt_count": 1
}
```

### Error Responses

**401 Unauthorized:**
```json
{
  "error": "Unauthorized"
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
      "path": ["patient_age"],
      "message": "Expected number, received string"
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

**502 Bad Gateway (OpenRouter Error):**
```json
{
  "error": "AI service unavailable"
}
```

**500 Internal Server Error:**
```json
{
  "error": "An internal error occurred",
  "details": "Error message..."
}
```

## Troubleshooting

### Issue: "Unauthorized" even with valid token
- Check that the Supabase client is properly configured in middleware
- Verify the JWT token is valid and not expired
- Ensure the Authorization header format is: `Bearer <token>`

### Issue: "AI service unavailable" (502)
- Verify `OPENROUTER_API_KEY` is set correctly in `.env`
- Check that the OpenRouter API is accessible
- Verify you have credits/quota on your OpenRouter account

### Issue: Server not responding
- Check that the dev server is running: `npm run dev`
- Verify the port matches the configuration (default: 4321)
- Check server logs for errors

### Issue: Database errors (500)
- Verify Supabase is running and accessible
- Check that migrations have been applied
- Verify RLS policies allow INSERT on `ai_chat_sessions`

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
   supabase auth users create test@example.com --password testpassword
   ```

