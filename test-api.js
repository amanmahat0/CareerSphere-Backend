/**
 * Simple API Test Script
 * Run with: node test-api.js
 */

const BASE_URL = "http://localhost:5000/api";

// Test data
const testApplicant = {
  fullname: "Test Applicant",
  email: `test.applicant.${Date.now()}@example.com`,
  phonenumber: `+1${Math.floor(Math.random() * 1000000000)}`,
  password: "test123456",
  userType: "applicant"
};

const testInstitution = {
  fullname: "Test Institution",
  email: `test.institution.${Date.now()}@example.com`,
  phonenumber: `+1${Math.floor(Math.random() * 1000000000)}`,
  password: "test123456",
  userType: "institution"
};

// Helper function to make API requests
async function makeRequest(endpoint, method = "GET", body = null) {
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    return { status: 500, data: { error: error.message } };
  }
}

// Test functions
async function testApplicantSignup() {
  console.log("\n=== Testing Applicant Signup ===");
  const result = await makeRequest("/auth/signup", "POST", testApplicant);
  console.log(`Status: ${result.status}`);
  console.log("Response:", JSON.stringify(result.data, null, 2));
  return result;
}

async function testInstitutionSignup() {
  console.log("\n=== Testing Institution Signup ===");
  const result = await makeRequest("/auth/signup", "POST", testInstitution);
  console.log(`Status: ${result.status}`);
  console.log("Response:", JSON.stringify(result.data, null, 2));
  return result;
}

async function testApplicantLogin() {
  console.log("\n=== Testing Applicant Login ===");
  const result = await makeRequest("/auth/login", "POST", {
    email: testApplicant.email,
    password: testApplicant.password,
  });
  console.log(`Status: ${result.status}`);
  console.log("Response:", JSON.stringify(result.data, null, 2));
  return result;
}

async function testInstitutionLogin() {
  console.log("\n=== Testing Institution Login ===");
  const result = await makeRequest("/auth/login", "POST", {
    email: testInstitution.email,
    password: testInstitution.password,
  });
  console.log(`Status: ${result.status}`);
  console.log("Response:", JSON.stringify(result.data, null, 2));
  return result;
}

async function testForgotPassword(email, userType) {
  console.log(`\n=== Testing Forgot Password (${userType}) ===`);
  const result = await makeRequest("/auth/forgot-password", "POST", {
    email,
    userType,
  });
  console.log(`Status: ${result.status}`);
  console.log("Response:", JSON.stringify(result.data, null, 2));
  console.log("⚠️  Check server console for verification code!");
  return result;
}

async function testVerifyCode(email, code, userType) {
  console.log(`\n=== Testing Verify Code (${userType}) ===`);
  const result = await makeRequest("/auth/verify-code", "POST", {
    email,
    code,
    userType,
  });
  console.log(`Status: ${result.status}`);
  console.log("Response:", JSON.stringify(result.data, null, 2));
  return result;
}

async function testResetPassword(email, password, userType) {
  console.log(`\n=== Testing Reset Password (${userType}) ===`);
  const result = await makeRequest("/auth/reset-password", "POST", {
    email,
    password,
    userType,
  });
  console.log(`Status: ${result.status}`);
  console.log("Response:", JSON.stringify(result.data, null, 2));
  return result;
}

async function testErrorCases() {
  console.log("\n=== Testing Error Cases ===");
  
  // Test missing fields
  console.log("\n1. Testing missing fields:");
  const missingFields = await makeRequest("/auth/signup", "POST", {
    email: "test@example.com",
  });
  console.log(`Status: ${missingFields.status}`);
  console.log("Response:", JSON.stringify(missingFields.data, null, 2));

  // Test invalid email
  console.log("\n2. Testing invalid email:");
  const invalidEmail = await makeRequest("/auth/signup", "POST", {
    fullname: "Test",
    email: "invalid-email",
    phonenumber: "+1234567890",
    password: "test123",
    userType: "applicant",
  });
  console.log(`Status: ${invalidEmail.status}`);
  console.log("Response:", JSON.stringify(invalidEmail.data, null, 2));

  // Test short password
  console.log("\n3. Testing short password:");
  const shortPassword = await makeRequest("/auth/signup", "POST", {
    fullname: "Test",
    email: "test@example.com",
    phonenumber: "+1234567890",
    password: "123",
    userType: "applicant",
  });
  console.log(`Status: ${shortPassword.status}`);
  console.log("Response:", JSON.stringify(shortPassword.data, null, 2));

  // Test invalid login
  console.log("\n4. Testing invalid login:");
  const invalidLogin = await makeRequest("/auth/login", "POST", {
    email: "nonexistent@example.com",
    password: "wrongpassword",
  });
  console.log(`Status: ${invalidLogin.status}`);
  console.log("Response:", JSON.stringify(invalidLogin.data, null, 2));
}

// Main test runner
async function runTests() {
  console.log("🚀 Starting API Tests...");
  console.log("Make sure your server is running on http://localhost:5000");

  try {
    // Test signups
    await testApplicantSignup();
    await testInstitutionSignup();

    // Test logins
    await testApplicantLogin();
    await testInstitutionLogin();

    // Test forgot password flow (applicant)
    await testForgotPassword(testApplicant.email, "applicant");
    console.log("\n⚠️  Enter the verification code from server console:");
    // Note: In a real scenario, you'd get the code from email or console
    // For testing, you can manually enter it or check server logs

    // Test error cases
    await testErrorCases();

    console.log("\n✅ All tests completed!");
    console.log("\nTest Data Used:");
    console.log("Applicant:", testApplicant);
    console.log("Institution:", testInstitution);
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Run tests
runTests();

export {
  testApplicantSignup,
  testInstitutionSignup,
  testApplicantLogin,
  testInstitutionLogin,
  testForgotPassword,
  testVerifyCode,
  testResetPassword,
  testErrorCases,
};

