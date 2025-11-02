# Getting a Supabase JWT Token for Testing

This guide explains how to get a JWT token from Supabase to use with the test scripts.

## Quick Start (Using Scripts)

### Step 1: Set Environment Variables

```bash
# For remote Supabase
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_KEY="your-anon-key"

# For local Supabase  
export SUPABASE_URL="http://localhost:54321"
export SUPABASE_KEY="<anon-key-from-supabase-status>"
```

### Step 2: Create a Test User (if needed)

```bash
# Set service role key (for admin operations)
export SUPABASE_KEY="<service-role-key>"  # Different from anon key!
export TEST_EMAIL="test@example.com"
export TEST_PASSWORD="secure-password-123"

bash create-test-user.sh
```

### Step 3: Get JWT Token

```bash
# Switch back to anon key (for regular auth)
export SUPABASE_KEY="your-anon-key"
export TEST_EMAIL="test@example.com"
export TEST_PASSWORD="secure-password-123"

bash get-supabase-token.sh
```

### Step 4: Use Token for Testing

```bash
# Copy the token from the output and set it
export JWT_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Run tests
bash test-bash.sh
```

## Manual Methods

### Method 1: Using curl (Remote Supabase)

```bash
# Sign in and get token
curl -X POST 'https://your-project.supabase.co/auth/v1/token?grant_type=password' \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "your-password"
  }'

# Extract access_token from response and export:
export JWT_TOKEN="<access_token_from_response>"
```

### Method 2: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Users**
3. Create a new user or use an existing one
4. You can manually reset their password or use the admin API

### Method 3: Using Supabase CLI (Local)

If you're using local Supabase:

```bash
# Start Supabase
supabase start

# Get status (shows URLs and keys)
supabase status

# Create user via SQL (connect to local DB)
psql "postgresql://postgres:postgres@localhost:54322/postgres"
# Then run:
# INSERT INTO auth.users (email, encrypted_password, email_confirmed_at)
# VALUES ('test@example.com', crypt('password123', gen_salt('bf')), now());
```

## Local Supabase Setup

For local development:

```bash
# Start local Supabase
supabase start

# Get your local credentials
supabase status

# You'll see output like:
# API URL: http://localhost:54321
# anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Then:

```bash
# Set environment for local Supabase
export SUPABASE_URL="http://localhost:54321"
export SUPABASE_KEY="<anon-key-from-status-output>"

# Create user (using service role key temporarily)
export SUPABASE_KEY="<service-role-key-from-status-output>"
export TEST_EMAIL="test@example.com"
export TEST_PASSWORD="test123"
bash create-test-user.sh

# Get token (switch back to anon key)
export SUPABASE_KEY="<anon-key-from-status-output>"
bash get-supabase-token.sh
```

## Using the Token

Once you have the token:

```bash
# Export it
export JWT_TOKEN="your-jwt-token-here"

# Run full test suite
bash test-bash.sh

# Or use in individual curl commands
curl -X POST http://localhost:3000/api/ai/sessions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "patient_age": 30,
    "activity_level": "moderate",
    "target_kcal": 2000
  }'
```

## Troubleshooting

### "User not found" or "Invalid credentials"
- Verify the user exists in Supabase
- Check email/password are correct
- For local Supabase, ensure user is created in the local database

### "Invalid API key"
- Use **anon key** for authentication requests
- Use **service_role key** only for admin operations (like creating users)
- Don't mix them up!

### Token expires
- JWT tokens typically expire after 1 hour (configurable in Supabase)
- Just run `get-supabase-token.sh` again to get a new token

### Local Supabase connection issues
- Ensure `supabase start` completed successfully
- Check `supabase status` shows all services running
- Verify you're using `localhost:54321` (not the default production port)

## Security Notes

⚠️ **Important:**
- Never commit service_role keys or JWT tokens
- Service role keys have admin access - never expose them
- Tokens in test scripts are temporary - they expire
- Use test accounts, not production user accounts

