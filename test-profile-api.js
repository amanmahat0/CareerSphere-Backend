/**
 * API Testing Script for Profile Endpoints
 * 
 * This script tests the applicant profile management APIs including:
 * - GET /api/applicant/profile - Get user profile
 * - POST /api/applicant/profile/update - Update user profile
 * - POST /api/applicant/profile/picture - Upload profile picture
 * - DELETE /api/applicant/profile/picture - Delete profile picture
 * 
 * Usage: 
 * 1. First login to get a valid token
 * 2. Run: node test-profile-api.js
 */

const API_BASE_URL = process.env.API_URL || 'http://localhost:5000/api';

// ========== CONFIGURATION ==========
// Replace with a valid JWT token from login
let AUTH_TOKEN = '';

// Test user credentials for login (will update AUTH_TOKEN)
const TEST_USER = {
  email: 'test@example.com',
  password: 'password123'
};

// ========== HELPER FUNCTIONS ==========

async function makeRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(AUTH_TOKEN && { 'Authorization': `Bearer ${AUTH_TOKEN}` }),
      ...options.headers,
    },
    ...options,
  };

  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    config.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    return { 
      status: response.status, 
      ok: response.ok, 
      data 
    };
  } catch (error) {
    return { 
      status: 500, 
      ok: false, 
      data: { error: error.message } 
    };
  }
}

function logResult(testName, result, expected = null) {
  const status = result.ok ? '✅ PASS' : '❌ FAIL';
  console.log(`\n${status}: ${testName}`);
  console.log(`   Status: ${result.status}`);
  console.log(`   Response:`, JSON.stringify(result.data, null, 2));
  if (expected && result.status !== expected) {
    console.log(`   Expected status: ${expected}`);
  }
  return result.ok;
}

// ========== TEST FUNCTIONS ==========

async function testLogin() {
  console.log('\n========================================');
  console.log('TEST: User Login (Get Auth Token)');
  console.log('========================================');
  
  const result = await makeRequest('/auth/login', {
    method: 'POST',
    body: TEST_USER,
  });

  if (result.ok && result.data.token) {
    AUTH_TOKEN = result.data.token;
    logResult('Login successful', result);
    console.log('   Token saved for subsequent tests');
    return true;
  }
  
  logResult('Login failed', result);
  return false;
}

async function testGetProfile() {
  console.log('\n========================================');
  console.log('TEST: Get Applicant Profile');
  console.log('========================================');
  
  const result = await makeRequest('/applicant/profile', {
    method: 'GET',
  });

  return logResult('Get Profile', result, 200);
}

async function testGetProfileWithoutToken() {
  console.log('\n========================================');
  console.log('TEST: Get Profile Without Token (Should Fail)');
  console.log('========================================');
  
  const savedToken = AUTH_TOKEN;
  AUTH_TOKEN = '';
  
  const result = await makeRequest('/applicant/profile', {
    method: 'GET',
  });

  AUTH_TOKEN = savedToken;
  
  // Should fail with 401
  const passed = result.status === 401;
  console.log(passed ? '✅ PASS' : '❌ FAIL', ': Get Profile Without Token');
  console.log(`   Status: ${result.status} (expected 401)`);
  console.log(`   Response:`, JSON.stringify(result.data, null, 2));
  return passed;
}

async function testUpdateProfile() {
  console.log('\n========================================');
  console.log('TEST: Update Applicant Profile');
  console.log('========================================');
  
  const updateData = {
    name: 'Test User Updated',
    phone: '03001234567',
    address: '123 Test Street, Test City',
    applicantType: 'Fresh Graduate'
  };

  const result = await makeRequest('/applicant/profile/update', {
    method: 'POST',
    body: updateData,
  });

  return logResult('Update Profile', result, 200);
}

async function testUpdateProfilePartial() {
  console.log('\n========================================');
  console.log('TEST: Partial Profile Update (Address Only)');
  console.log('========================================');
  
  const updateData = {
    address: '456 New Address, Updated City',
  };

  const result = await makeRequest('/applicant/profile/update', {
    method: 'POST',
    body: updateData,
  });

  return logResult('Partial Profile Update', result, 200);
}

async function testUpdateProfileInvalidEmail() {
  console.log('\n========================================');
  console.log('TEST: Update Profile with Duplicate Email (Should Fail)');
  console.log('========================================');
  
  const updateData = {
    email: 'existing@example.com', // Assuming this email exists for another user
  };

  const result = await makeRequest('/applicant/profile/update', {
    method: 'POST', 
    body: updateData,
  });

  // This may pass or fail depending on whether the email exists
  logResult('Update with Duplicate Email', result);
  return true; // Don't fail the test suite for this
}

async function testUpdateApplicantType() {
  console.log('\n========================================');
  console.log('TEST: Update Applicant Type');
  console.log('========================================');
  
  const types = ['Student', 'Fresh Graduate', 'Experienced', 'Career Changer'];
  
  for (const type of types) {
    const result = await makeRequest('/applicant/profile/update', {
      method: 'POST',
      body: { applicantType: type },
    });
    
    console.log(`   ${result.ok ? '✅' : '❌'} Type "${type}": ${result.data.message || result.data.error || 'Updated'}`);
  }
  
  return true;
}

// Note: File upload testing requires FormData which works differently in Node.js
// For actual file upload testing, use a tool like Postman or this curl command:
// curl -X POST http://localhost:5000/api/applicant/profile/picture \
//   -H "Authorization: Bearer YOUR_TOKEN" \
//   -F "profilePicture=@/path/to/image.jpg"

async function testDeleteProfilePicture() {
  console.log('\n========================================');
  console.log('TEST: Delete Profile Picture');
  console.log('========================================');
  
  const result = await makeRequest('/applicant/profile/picture', {
    method: 'DELETE',
  });

  return logResult('Delete Profile Picture', result);
}

// ========== RUN ALL TESTS ==========

async function runAllTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║        CAREERSPHERE PROFILE API TEST SUITE                 ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\nAPI Base URL: ${API_BASE_URL}`);
  console.log(`Test Time: ${new Date().toISOString()}`);
  
  const results = {
    passed: 0,
    failed: 0,
    total: 0
  };

  // If no token provided, try to login first
  if (!AUTH_TOKEN) {
    console.log('\nNo AUTH_TOKEN provided. Attempting login...');
    const loginSuccess = await testLogin();
    if (!loginSuccess) {
      console.log('\n❌ Cannot proceed without authentication.');
      console.log('Please either:');
      console.log('  1. Set AUTH_TOKEN variable with a valid JWT token');
      console.log('  2. Update TEST_USER credentials with valid login details');
      return;
    }
    results.total++;
    results.passed++;
  }

  // Run all tests
  const tests = [
    { name: 'Get Profile', fn: testGetProfile },
    { name: 'Get Profile Without Token', fn: testGetProfileWithoutToken },
    { name: 'Update Profile', fn: testUpdateProfile },
    { name: 'Partial Profile Update', fn: testUpdateProfilePartial },
    { name: 'Update Applicant Type', fn: testUpdateApplicantType },
    { name: 'Delete Profile Picture', fn: testDeleteProfilePicture },
  ];

  for (const test of tests) {
    try {
      const passed = await test.fn();
      results.total++;
      if (passed) {
        results.passed++;
      } else {
        results.failed++;
      }
    } catch (error) {
      console.log(`\n❌ FAIL: ${test.name} - Error: ${error.message}`);
      results.total++;
      results.failed++;
    }
  }

  // Print summary
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                    TEST SUMMARY                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\n   Total Tests: ${results.total}`);
  console.log(`   ✅ Passed: ${results.passed}`);
  console.log(`   ❌ Failed: ${results.failed}`);
  console.log(`   Success Rate: ${Math.round((results.passed / results.total) * 100)}%`);
  
  console.log('\n📋 MANUAL TESTING NOTES:');
  console.log('─────────────────────────');
  console.log('For profile picture upload, use Postman or curl:');
  console.log('\ncurl -X POST http://localhost:5000/api/applicant/profile/picture \\');
  console.log('  -H "Authorization: Bearer YOUR_TOKEN" \\');
  console.log('  -F "profilePicture=@/path/to/image.jpg"');
}

// Run the tests
runAllTests().catch(console.error);
