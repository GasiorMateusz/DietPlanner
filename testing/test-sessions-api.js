/**
 * Test script for POST /api/ai/sessions endpoint
 * 
 * Usage:
 * 1. Set environment variables:
 *    - SUPABASE_URL
 *    - SUPABASE_KEY
 *    - SUPABASE_TEST_USER_EMAIL (optional, for auth testing)
 *    - SUPABASE_TEST_USER_PASSWORD (optional, for auth testing)
 *    - OPENROUTER_API_KEY
 * 
 * 2. Start the dev server: npm run dev
 * 
 * 3. Run this script: node test-api.js
 */

// Note: astro.config.mjs shows port 3000 - adjust if needed
const API_URL = process.env.API_URL || 'http://localhost:3000/api/ai/sessions';

// Test data matching CreateAiSessionCommand
const testPayload = {
  patient_age: 30,
  patient_weight: 70.5,
  patient_height: 170.0,
  activity_level: 'moderate',
  target_kcal: 2000,
  target_macro_distribution: {
    p_perc: 30,
    f_perc: 25,
    c_perc: 45,
  },
  meal_names: 'Breakfast, Lunch, Dinner',
  exclusions_guidelines: 'Gluten-free, no nuts',
};

/**
 * Test 1: No authentication (should return 401)
 */
async function testWithoutAuth() {
  console.log('\n=== Test 1: Request without authentication ===');
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload),
    });

    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, JSON.stringify(data, null, 2));
    
    if (response.status === 401) {
      console.log('✅ PASS: Correctly returned 401 Unauthorized');
    } else {
      console.log('❌ FAIL: Expected 401, got', response.status);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

/**
 * Test 2: Invalid JSON (should return 400)
 */
async function testInvalidJSON() {
  console.log('\n=== Test 2: Request with invalid JSON ===');
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer invalid-token',
      },
      body: 'invalid json{',
    });

    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, JSON.stringify(data, null, 2));
    
    if (response.status === 400) {
      console.log('✅ PASS: Correctly returned 400 Bad Request for invalid JSON');
    } else {
      console.log('❌ FAIL: Expected 400, got', response.status);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

/**
 * Test 3: Invalid validation (should return 400)
 */
async function testInvalidValidation() {
  console.log('\n=== Test 3: Request with invalid validation ===');
  try {
    const invalidPayload = {
      patient_age: -5, // Invalid: negative age
      activity_level: 'invalid', // Invalid: not in enum
      target_kcal: 'not-a-number', // Invalid: not a number
    };

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer invalid-token',
      },
      body: JSON.stringify(invalidPayload),
    });

    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, JSON.stringify(data, null, 2));
    
    if (response.status === 400) {
      console.log('✅ PASS: Correctly returned 400 Bad Request for invalid data');
    } else {
      console.log('❌ FAIL: Expected 400, got', response.status);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

/**
 * Test 4: Valid request with authentication
 * Note: This requires a valid JWT token
 */
async function testWithAuth(jwtToken) {
  console.log('\n=== Test 4: Valid request with authentication ===');
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`,
      },
      body: JSON.stringify(testPayload),
    });

    const data = await response.json();
    console.log(`Status: ${response.status}`);
    
    if (response.status === 201) {
      console.log('✅ PASS: Successfully created session');
      console.log('Session ID:', data.session_id);
      console.log('Prompt Count:', data.prompt_count);
      console.log('Message Preview:', data.message?.content?.substring(0, 100) + '...');
    } else if (response.status === 401) {
      console.log('⚠️  SKIP: Authentication required - need valid JWT token');
      console.log('Response:', JSON.stringify(data, null, 2));
    } else if (response.status === 502) {
      console.log('⚠️  WARNING: OpenRouter API unavailable or API key not configured');
      console.log('Response:', JSON.stringify(data, null, 2));
    } else {
      console.log('❌ FAIL: Unexpected status', response.status);
      console.log('Response:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

/**
 * Helper function to get a Supabase JWT token
 * Requires SUPABASE_URL, SUPABASE_KEY, and optionally test user credentials
 */
async function getAuthToken() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;
  const testEmail = process.env.SUPABASE_TEST_USER_EMAIL;
  const testPassword = process.env.SUPABASE_TEST_USER_PASSWORD;

  if (!supabaseUrl || !supabaseKey) {
    console.log('⚠️  SUPABASE_URL and SUPABASE_KEY environment variables not set');
    return null;
  }

  if (!testEmail || !testPassword) {
    console.log('⚠️  SUPABASE_TEST_USER_EMAIL and SUPABASE_TEST_USER_PASSWORD not set');
    console.log('   Skipping authenticated test. Set these to test with authentication.');
    return null;
  }

  try {
    // Attempt to sign in with test credentials
    const authResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
      },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });

    if (authResponse.ok) {
      const authData = await authResponse.json();
      return authData.access_token;
    } else {
      console.log('⚠️  Failed to get auth token:', await authResponse.text());
      return null;
    }
  } catch (error) {
    console.log('⚠️  Error getting auth token:', error.message);
    return null;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('🚀 Starting API tests for POST /api/ai/sessions');
  console.log(`📡 Testing endpoint: ${API_URL}`);
  
  // Run tests that don't require authentication
  await testWithoutAuth();
  await testInvalidJSON();
  await testInvalidValidation();
  
  // Try to get auth token and run authenticated test
  const token = await getAuthToken();
  if (token) {
    await testWithAuth(token);
  } else {
    console.log('\n⚠️  Skipping authenticated test - no valid token available');
    console.log('   To test with authentication:');
    console.log('   1. Set SUPABASE_URL and SUPABASE_KEY environment variables');
    console.log('   2. Set SUPABASE_TEST_USER_EMAIL and SUPABASE_TEST_USER_PASSWORD');
    console.log('   3. Or manually obtain a JWT token and pass it to testWithAuth()');
  }
  
  console.log('\n✅ Test suite completed');
}

// Run tests
runTests().catch(console.error);

