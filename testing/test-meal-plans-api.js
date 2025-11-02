/**
 * Test script for Meal Plans API endpoints
 *
 * Tests all CRUD operations:
 * - GET /api/meal-plans (list)
 * - POST /api/meal-plans (create)
 * - GET /api/meal-plans/{id} (get by id)
 * - PUT /api/meal-plans/{id} (update)
 * - DELETE /api/meal-plans/{id} (delete)
 *
 * Usage:
 * 1. Set environment variables:
 *    - SUPABASE_URL
 *    - SUPABASE_KEY
 *    - SUPABASE_TEST_USER_EMAIL (optional, for auth testing)
 *    - SUPABASE_TEST_USER_PASSWORD (optional, for auth testing)
 *    - API_URL (optional, defaults to http://localhost:3000)
 *
 * 2. Start the dev server: npm run dev
 *
 * 3. Run this script: node testing/test-meal-plans-api.js
 */

const API_URL = process.env.API_URL || "http://localhost:3000";
const BASE_ENDPOINT = `${API_URL}/api/meal-plans`;

// Test data matching CreateMealPlanCommand
const testMealPlanData = {
  name: "Weight Reduction Plan - Test Patient",
  source_chat_session_id: null,
  plan_content: {
    daily_summary: {
      kcal: 2000,
      proteins: 150,
      fats: 60,
      carbs: 215,
    },
    meals: [
      {
        name: "Breakfast",
        ingredients: "Oats 50g, milk 200ml, berries 100g, almonds 20g",
        preparation: "Mix oats with milk, let sit overnight. Top with berries and almonds in the morning.",
        summary: {
          kcal: 400,
          p: 20,
          f: 10,
          c: 58,
        },
      },
      {
        name: "Lunch",
        ingredients: "Chicken breast 150g, quinoa 100g, vegetables 200g, olive oil 10ml",
        preparation: "Grill chicken, cook quinoa, steam vegetables. Combine and drizzle with olive oil.",
        summary: {
          kcal: 600,
          p: 50,
          f: 20,
          c: 65,
        },
      },
      {
        name: "Dinner",
        ingredients: "Salmon 150g, sweet potato 200g, broccoli 150g, olive oil 10ml",
        preparation: "Bake salmon and sweet potato at 400°F for 15-20 minutes. Steam broccoli. Serve together.",
        summary: {
          kcal: 500,
          p: 40,
          f: 20,
          c: 52,
        },
      },
      {
        name: "Snacks",
        ingredients: "Greek yogurt 150g, mixed nuts 30g, apple 1 medium",
        preparation: "Eat yogurt, nuts, and apple throughout the day as needed.",
        summary: {
          kcal: 500,
          p: 40,
          f: 10,
          c: 40,
        },
      },
    ],
  },
  startup_data: {
    patient_age: 30,
    patient_weight: 70.5,
    patient_height: 170.0,
    activity_level: "moderate",
    target_kcal: 2000,
    target_macro_distribution: {
      p_perc: 30,
      f_perc: 25,
      c_perc: 45,
    },
    meal_names: "Breakfast, Lunch, Dinner, Snacks",
    exclusions_guidelines: "Gluten-free, no nuts in breakfast (allergies)",
  },
};

let createdMealPlanId = null;
let authToken = null;

/**
 * Helper function to get a Supabase JWT token
 */
async function getAuthToken() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;
  const testEmail = process.env.SUPABASE_TEST_USER_EMAIL;
  const testPassword = process.env.SUPABASE_TEST_USER_PASSWORD;

  if (!supabaseUrl || !supabaseKey) {
    console.log("⚠️  SUPABASE_URL and SUPABASE_KEY environment variables not set");
    return null;
  }

  if (!testEmail || !testPassword) {
    console.log("⚠️  SUPABASE_TEST_USER_EMAIL and SUPABASE_TEST_USER_PASSWORD not set");
    return null;
  }

  try {
    const authResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseKey,
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
      console.log("⚠️  Failed to get auth token:", await authResponse.text());
      return null;
    }
  } catch (error) {
    console.log("⚠️  Error getting auth token:", error.message);
    return null;
  }
}

/**
 * Test 1: GET /api/meal-plans without authentication (should return 401)
 */
async function testListWithoutAuth() {
  console.log("\n=== Test 1: GET /api/meal-plans without authentication ===");
  try {
    const response = await fetch(BASE_ENDPOINT, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, JSON.stringify(data, null, 2));

    if (response.status === 401) {
      console.log("✅ PASS: Correctly returned 401 Unauthorized");
      return true;
    } else {
      console.log("❌ FAIL: Expected 401, got", response.status);
      return false;
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
    return false;
  }
}

/**
 * Test 2: GET /api/meal-plans with authentication (should return 200)
 */
async function testListWithAuth() {
  if (!authToken) {
    console.log("⚠️  Skipping - no auth token available");
    return false;
  }

  console.log("\n=== Test 2: GET /api/meal-plans with authentication ===");
  try {
    const response = await fetch(BASE_ENDPOINT, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
    });

    const data = await response.json();
    console.log(`Status: ${response.status}`);

    if (response.status === 200) {
      console.log(`✅ PASS: Successfully retrieved meal plans list`);
      console.log(`   Found ${Array.isArray(data) ? data.length : 0} meal plans`);
      if (Array.isArray(data) && data.length > 0) {
        console.log(`   First meal plan: ${data[0].name} (ID: ${data[0].id})`);
      }
      return true;
    } else {
      console.log("❌ FAIL: Expected 200, got", response.status);
      console.log("Response:", JSON.stringify(data, null, 2));
      return false;
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
    return false;
  }
}

/**
 * Test 3: GET /api/meal-plans with query parameters (search, sort, order)
 */
async function testListWithFilters() {
  if (!authToken) {
    console.log("⚠️  Skipping - no auth token available");
    return false;
  }

  console.log("\n=== Test 3: GET /api/meal-plans with query parameters ===");
  try {
    const url = new URL(BASE_ENDPOINT);
    url.searchParams.set("search", "Test");
    url.searchParams.set("sort", "name");
    url.searchParams.set("order", "asc");

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
    });

    const data = await response.json();
    console.log(`Status: ${response.status}`);

    if (response.status === 200) {
      console.log(`✅ PASS: Successfully retrieved filtered meal plans`);
      console.log(`   Found ${Array.isArray(data) ? data.length : 0} meal plans`);
      return true;
    } else {
      console.log("❌ FAIL: Expected 200, got", response.status);
      console.log("Response:", JSON.stringify(data, null, 2));
      return false;
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
    return false;
  }
}

/**
 * Test 4: POST /api/meal-plans without authentication (should return 401)
 */
async function testCreateWithoutAuth() {
  console.log("\n=== Test 4: POST /api/meal-plans without authentication ===");
  try {
    const response = await fetch(BASE_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testMealPlanData),
    });

    const data = await response.json();
    console.log(`Status: ${response.status}`);

    if (response.status === 401) {
      console.log("✅ PASS: Correctly returned 401 Unauthorized");
      return true;
    } else {
      console.log("❌ FAIL: Expected 401, got", response.status);
      return false;
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
    return false;
  }
}

/**
 * Test 5: POST /api/meal-plans with invalid validation (should return 400)
 */
async function testCreateInvalidValidation() {
  console.log("\n=== Test 5: POST /api/meal-plans with invalid validation ===");
  try {
    const invalidData = {
      name: "", // Invalid: empty name
      plan_content: {
        daily_summary: {
          kcal: -100, // Invalid: negative calories
          proteins: 150,
          fats: 60,
          carbs: 215,
        },
        meals: [], // Invalid: empty meals array
      },
      startup_data: {
        patient_age: -5, // Invalid: negative age
        activity_level: "invalid", // Invalid: not in enum
      },
    };

    const response = await fetch(BASE_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken || "invalid-token"}`,
      },
      body: JSON.stringify(invalidData),
    });

    const data = await response.json();
    console.log(`Status: ${response.status}`);

    if (response.status === 400) {
      console.log("✅ PASS: Correctly returned 400 Bad Request for invalid data");
      console.log("Validation errors:", data.details?.length || 0, "errors");
      return true;
    } else {
      console.log("❌ FAIL: Expected 400, got", response.status);
      console.log("Response:", JSON.stringify(data, null, 2));
      return false;
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
    return false;
  }
}

/**
 * Test 6: POST /api/meal-plans with authentication (should return 201)
 */
async function testCreateWithAuth() {
  if (!authToken) {
    console.log("⚠️  Skipping - no auth token available");
    return false;
  }

  console.log("\n=== Test 6: POST /api/meal-plans with authentication ===");
  try {
    const response = await fetch(BASE_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(testMealPlanData),
    });

    const data = await response.json();
    console.log(`Status: ${response.status}`);

    if (response.status === 201) {
      console.log("✅ PASS: Successfully created meal plan");
      console.log(`   Meal Plan ID: ${data.id}`);
      console.log(`   Name: ${data.name}`);
      createdMealPlanId = data.id;
      return true;
    } else {
      console.log("❌ FAIL: Expected 201, got", response.status);
      console.log("Response:", JSON.stringify(data, null, 2));
      return false;
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
    return false;
  }
}

/**
 * Test 7: GET /api/meal-plans/{id} without authentication (should return 401)
 */
async function testGetByIdWithoutAuth() {
  if (!createdMealPlanId) {
    console.log("⚠️  Skipping - no meal plan ID available (need to create one first)");
    return false;
  }

  console.log("\n=== Test 7: GET /api/meal-plans/{id} without authentication ===");
  try {
    const response = await fetch(`${BASE_ENDPOINT}/${createdMealPlanId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    console.log(`Status: ${response.status}`);

    if (response.status === 401) {
      console.log("✅ PASS: Correctly returned 401 Unauthorized");
      return true;
    } else {
      console.log("❌ FAIL: Expected 401, got", response.status);
      return false;
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
    return false;
  }
}

/**
 * Test 8: GET /api/meal-plans/{id} with authentication (should return 200)
 */
async function testGetByIdWithAuth() {
  if (!authToken || !createdMealPlanId) {
    console.log("⚠️  Skipping - no auth token or meal plan ID available");
    return false;
  }

  console.log("\n=== Test 8: GET /api/meal-plans/{id} with authentication ===");
  try {
    const response = await fetch(`${BASE_ENDPOINT}/${createdMealPlanId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
    });

    const data = await response.json();
    console.log(`Status: ${response.status}`);

    if (response.status === 200) {
      console.log("✅ PASS: Successfully retrieved meal plan");
      console.log(`   Name: ${data.name}`);
      console.log(`   Meals count: ${data.plan_content?.meals?.length || 0}`);
      return true;
    } else {
      console.log("❌ FAIL: Expected 200, got", response.status);
      console.log("Response:", JSON.stringify(data, null, 2));
      return false;
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
    return false;
  }
}

/**
 * Test 9: GET /api/meal-plans/{id} with invalid ID (should return 400 or 404)
 */
async function testGetByIdInvalidId() {
  if (!authToken) {
    console.log("⚠️  Skipping - no auth token available");
    return false;
  }

  console.log("\n=== Test 9: GET /api/meal-plans/{id} with invalid ID ===");
  try {
    const invalidId = "not-a-valid-uuid";
    const response = await fetch(`${BASE_ENDPOINT}/${invalidId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
    });

    const data = await response.json();
    console.log(`Status: ${response.status}`);

    if (response.status === 400) {
      console.log("✅ PASS: Correctly returned 400 for invalid UUID format");
      return true;
    } else if (response.status === 404) {
      console.log("✅ PASS: Correctly returned 404 for non-existent meal plan");
      return true;
    } else {
      console.log("⚠️  Unexpected status:", response.status);
      console.log("Response:", JSON.stringify(data, null, 2));
      return false;
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
    return false;
  }
}

/**
 * Test 10: PUT /api/meal-plans/{id} with authentication (should return 200)
 */
async function testUpdateWithAuth() {
  if (!authToken || !createdMealPlanId) {
    console.log("⚠️  Skipping - no auth token or meal plan ID available");
    return false;
  }

  console.log("\n=== Test 10: PUT /api/meal-plans/{id} with authentication ===");
  try {
    const updateData = {
      name: "Updated Weight Reduction Plan - Test Patient",
      target_kcal: 1800, // Changed from 2000
    };

    const response = await fetch(`${BASE_ENDPOINT}/${createdMealPlanId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(updateData),
    });

    const data = await response.json();
    console.log(`Status: ${response.status}`);

    if (response.status === 200) {
      console.log("✅ PASS: Successfully updated meal plan");
      console.log(`   Updated name: ${data.name}`);
      console.log(`   Updated target_kcal: ${data.target_kcal}`);
      return true;
    } else {
      console.log("❌ FAIL: Expected 200, got", response.status);
      console.log("Response:", JSON.stringify(data, null, 2));
      return false;
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
    return false;
  }
}

/**
 * Test 11: DELETE /api/meal-plans/{id} without authentication (should return 401)
 */
async function testDeleteWithoutAuth() {
  if (!createdMealPlanId) {
    console.log("⚠️  Skipping - no meal plan ID available");
    return false;
  }

  console.log("\n=== Test 11: DELETE /api/meal-plans/{id} without authentication ===");
  try {
    const response = await fetch(`${BASE_ENDPOINT}/${createdMealPlanId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    console.log(`Status: ${response.status}`);

    if (response.status === 401) {
      console.log("✅ PASS: Correctly returned 401 Unauthorized");
      return true;
    } else {
      console.log("❌ FAIL: Expected 401, got", response.status);
      return false;
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
    return false;
  }
}

/**
 * Test 12: DELETE /api/meal-plans/{id} with authentication (should return 204)
 */
async function testDeleteWithAuth() {
  if (!authToken || !createdMealPlanId) {
    console.log("⚠️  Skipping - no auth token or meal plan ID available");
    return false;
  }

  console.log("\n=== Test 12: DELETE /api/meal-plans/{id} with authentication ===");
  try {
    const response = await fetch(`${BASE_ENDPOINT}/${createdMealPlanId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
    });

    console.log(`Status: ${response.status}`);

    if (response.status === 204) {
      console.log("✅ PASS: Successfully deleted meal plan");
      createdMealPlanId = null; // Reset since it's deleted
      return true;
    } else {
      const data = await response.json();
      console.log("❌ FAIL: Expected 204, got", response.status);
      console.log("Response:", JSON.stringify(data, null, 2));
      return false;
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
    return false;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log("🚀 Starting API tests for Meal Plans endpoints");
  console.log(`📡 Testing endpoints: ${BASE_ENDPOINT}`);
  console.log("");

  // Get auth token first
  authToken = await getAuthToken();
  if (!authToken) {
    console.log("⚠️  No auth token available - some tests will be skipped");
    console.log("   To test with authentication:");
    console.log("   1. Set SUPABASE_URL and SUPABASE_KEY environment variables");
    console.log("   2. Set SUPABASE_TEST_USER_EMAIL and SUPABASE_TEST_USER_PASSWORD");
    console.log("   3. Or manually obtain a JWT token and set AUTH_TOKEN env var");
    console.log("");
  }

  const results = [];

  // Tests that don't require auth
  results.push(await testListWithoutAuth());
  results.push(await testCreateWithoutAuth());
  results.push(await testCreateInvalidValidation());

  // Tests that require auth
  results.push(await testListWithAuth());
  results.push(await testListWithFilters());
  results.push(await testCreateWithAuth());
  results.push(await testGetByIdWithoutAuth());
  results.push(await testGetByIdWithAuth());
  results.push(await testGetByIdInvalidId());
  results.push(await testUpdateWithAuth());
  results.push(await testDeleteWithoutAuth());
  results.push(await testDeleteWithAuth());

  // Summary
  const passed = results.filter((r) => r === true).length;
  const total = results.filter((r) => r !== null).length;

  console.log("\n" + "=".repeat(50));
  console.log("📊 Test Summary");
  console.log("=".repeat(50));
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  console.log(`⚠️  Skipped: ${results.filter((r) => r === null).length}`);
  console.log("");

  if (passed === total) {
    console.log("🎉 All tests passed!");
  } else {
    console.log("⚠️  Some tests failed or were skipped");
  }
}

// Run tests
runTests().catch(console.error);
