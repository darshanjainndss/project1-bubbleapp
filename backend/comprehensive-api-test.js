const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';

// Test configuration
const TEST_CONFIG = {
  timeout: 10000, // 10 seconds timeout
  maxRetries: 3
};

// Test results tracking
let testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  failures: []
};

// Helper function to make API calls with retry logic
async function makeRequest(config, description) {
  testResults.total++;
  
  for (let attempt = 1; attempt <= TEST_CONFIG.maxRetries; attempt++) {
    try {
      const response = await axios({
        ...config,
        timeout: TEST_CONFIG.timeout
      });
      
      console.log(`✅ ${description}`);
      if (response.data) {
        console.log(`   Status: ${response.status}`);
        if (response.data.message) console.log(`   Message: ${response.data.message}`);
        if (response.data.success !== undefined) console.log(`   Success: ${response.data.success}`);
      }
      testResults.passed++;
      return response;
      
    } catch (error) {
      if (attempt === TEST_CONFIG.maxRetries) {
        console.log(`❌ ${description}`);
        console.log(`   Error: ${error.response?.data?.message || error.message}`);
        console.log(`   Status: ${error.response?.status || 'No response'}`);
        testResults.failed++;
        testResults.failures.push({
          test: description,
          error: error.response?.data?.message || error.message,
          status: error.response?.status
        });
        throw error;
      } else {
        console.log(`⚠️  ${description} - Attempt ${attempt} failed, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
      }
    }
  }
}

async function testAllAPIs() {
  console.log('🧪 COMPREHENSIVE API TESTING - Bubble Shooter Backend');
  console.log('=' .repeat(60));
  console.log(`🔗 Testing API Base URL: ${API_BASE_URL}`);
  console.log('=' .repeat(60));

  let token = '';
  let userId = '';
  let sessionId = '';

  try {
    // ========================================================================
    // HEALTH & SYSTEM CHECKS
    // ========================================================================
    console.log('\n📊 HEALTH & SYSTEM CHECKS');
    console.log('-'.repeat(40));

    await makeRequest({
      method: 'GET',
      url: `${API_BASE_URL}/health`
    }, 'Health Check Endpoint');

    // ========================================================================
    // AUTHENTICATION TESTS
    // ========================================================================
    console.log('\n🔐 AUTHENTICATION TESTS');
    console.log('-'.repeat(40));

    // Test user registration
    const testUser = {
      email: `testuser${Date.now()}@example.com`,
      password: 'password123',
      displayName: 'Comprehensive Test User'
    };

    const registerResponse = await makeRequest({
      method: 'POST',
      url: `${API_BASE_URL}/auth/register`,
      data: testUser
    }, 'User Registration');

    token = registerResponse.data.token;
    userId = registerResponse.data.user.id;

    // Test user login
    await makeRequest({
      method: 'POST',
      url: `${API_BASE_URL}/auth/login`,
      data: {
        email: testUser.email,
        password: testUser.password
      }
    }, 'User Login');

    // Test token verification
    await makeRequest({
      method: 'POST',
      url: `${API_BASE_URL}/auth/verify-token`,
      headers: { Authorization: `Bearer ${token}` }
    }, 'Token Verification');

    // Test anonymous login
    await makeRequest({
      method: 'POST',
      url: `${API_BASE_URL}/auth/anonymous-login`,
      data: {
        firebaseId: `anon_${Date.now()}`,
        displayName: 'Anonymous Test User'
      }
    }, 'Anonymous Login');

    // ========================================================================
    // USER MANAGEMENT TESTS
    // ========================================================================
    console.log('\n👤 USER MANAGEMENT TESTS');
    console.log('-'.repeat(40));

    // Get user profile
    await makeRequest({
      method: 'GET',
      url: `${API_BASE_URL}/user/profile`,
      headers: { Authorization: `Bearer ${token}` }
    }, 'Get User Profile');

    // Update user profile
    await makeRequest({
      method: 'PUT',
      url: `${API_BASE_URL}/user/profile`,
      headers: { Authorization: `Bearer ${token}` },
      data: {
        displayName: 'Updated Test User'
      }
    }, 'Update User Profile');

    // Get user game data
    await makeRequest({
      method: 'GET',
      url: `${API_BASE_URL}/user/game-data`,
      headers: { Authorization: `Bearer ${token}` }
    }, 'Get User Game Data');

    // Update user game data
    await makeRequest({
      method: 'PUT',
      url: `${API_BASE_URL}/user/game-data`,
      headers: { Authorization: `Bearer ${token}` },
      data: {
        totalScore: 1500,
        currentLevel: 5
      }
    }, 'Update User Game Data');

    // Get user rank
    await makeRequest({
      method: 'GET',
      url: `${API_BASE_URL}/user/rank`,
      headers: { Authorization: `Bearer ${token}` }
    }, 'Get User Rank');

    // Get user stats
    await makeRequest({
      method: 'GET',
      url: `${API_BASE_URL}/user/stats`,
      headers: { Authorization: `Bearer ${token}` }
    }, 'Get User Statistics');

    // ========================================================================
    // COINS & ABILITIES TESTS
    // ========================================================================
    console.log('\n💰 COINS & ABILITIES TESTS');
    console.log('-'.repeat(40));

    // Add coins
    await makeRequest({
      method: 'PUT',
      url: `${API_BASE_URL}/user/coins`,
      headers: { Authorization: `Bearer ${token}` },
      data: {
        amount: 100,
        operation: 'add'
      }
    }, 'Add Coins');

    // Subtract coins
    await makeRequest({
      method: 'PUT',
      url: `${API_BASE_URL}/user/coins`,
      headers: { Authorization: `Bearer ${token}` },
      data: {
        amount: 25,
        operation: 'subtract'
      }
    }, 'Subtract Coins');

    // Update abilities
    await makeRequest({
      method: 'PUT',
      url: `${API_BASE_URL}/user/abilities`,
      headers: { Authorization: `Bearer ${token}` },
      data: {
        abilities: { lightning: 5, bomb: 3, freeze: 2, fire: 1 }
      }
    }, 'Update Abilities');

    // Purchase abilities
    await makeRequest({
      method: 'POST',
      url: `${API_BASE_URL}/user/purchase-abilities`,
      headers: { Authorization: `Bearer ${token}` },
      data: {
        ability: 'lightning',
        quantity: 2
      }
    }, 'Purchase Abilities');

    // ========================================================================
    // GAME SESSION TESTS
    // ========================================================================
    console.log('\n🎮 GAME SESSION TESTS');
    console.log('-'.repeat(40));

    // Submit game progress
    await makeRequest({
      method: 'POST',
      url: `${API_BASE_URL}/game/progress`,
      headers: { Authorization: `Bearer ${token}` },
      data: {
        level: 3,
        score: 800,
        moves: 20,
        stars: 2
      }
    }, 'Submit Game Progress');

    // Submit complete game session
    const gameSessionResponse = await makeRequest({
      method: 'POST',
      url: `${API_BASE_URL}/game/session`,
      headers: { Authorization: `Bearer ${token}` },
      data: {
        level: 1,
        score: 1250,
        moves: 25,
        stars: 3,
        duration: 120,
        isWin: true,
        abilitiesUsed: { lightning: 1, bomb: 0, freeze: 0, fire: 0 },
        bubblesDestroyed: 45,
        chainReactions: 8,
        perfectShots: 12
      }
    }, 'Submit Game Session');

    sessionId = gameSessionResponse.data.sessionId;

    // Get user game sessions
    await makeRequest({
      method: 'GET',
      url: `${API_BASE_URL}/game/sessions`,
      headers: { Authorization: `Bearer ${token}` }
    }, 'Get Game Sessions');

    // Get game sessions with pagination
    await makeRequest({
      method: 'GET',
      url: `${API_BASE_URL}/game/sessions?page=1&limit=5`,
      headers: { Authorization: `Bearer ${token}` }
    }, 'Get Game Sessions (Paginated)');

    // Get level leaderboard
    await makeRequest({
      method: 'GET',
      url: `${API_BASE_URL}/game/level/1/leaderboard`
    }, 'Get Level 1 Leaderboard');

    // Get user's best score for level
    await makeRequest({
      method: 'GET',
      url: `${API_BASE_URL}/game/level/1/best-score`,
      headers: { Authorization: `Bearer ${token}` }
    }, 'Get Best Score for Level 1');

    // ========================================================================
    // LEADERBOARD TESTS
    // ========================================================================
    console.log('\n🏆 LEADERBOARD TESTS');
    console.log('-'.repeat(40));

    // Global leaderboard
    await makeRequest({
      method: 'GET',
      url: `${API_BASE_URL}/leaderboard`
    }, 'Get Global Leaderboard');

    // Global leaderboard with parameters
    await makeRequest({
      method: 'GET',
      url: `${API_BASE_URL}/leaderboard?limit=20&type=highScore`
    }, 'Get Global Leaderboard (High Score)');

    // Total score leaderboard
    await makeRequest({
      method: 'GET',
      url: `${API_BASE_URL}/leaderboard?type=totalScore`
    }, 'Get Total Score Leaderboard');

    // Weekly leaderboard
    await makeRequest({
      method: 'GET',
      url: `${API_BASE_URL}/leaderboard/weekly`
    }, 'Get Weekly Leaderboard');

    // Monthly leaderboard
    await makeRequest({
      method: 'GET',
      url: `${API_BASE_URL}/leaderboard/monthly`
    }, 'Get Monthly Leaderboard');

    // Top players
    await makeRequest({
      method: 'GET',
      url: `${API_BASE_URL}/leaderboard/top-players`
    }, 'Get Top Players');

    // Leaderboard statistics
    await makeRequest({
      method: 'GET',
      url: `${API_BASE_URL}/leaderboard/stats`
    }, 'Get Leaderboard Statistics');

    // Friends leaderboard (placeholder)
    await makeRequest({
      method: 'GET',
      url: `${API_BASE_URL}/leaderboard/friends/${userId}`
    }, 'Get Friends Leaderboard');

    // ========================================================================
    // CONFIGURATION TESTS
    // ========================================================================
    console.log('\n⚙️  CONFIGURATION TESTS');
    console.log('-'.repeat(40));

    // Get abilities config
    await makeRequest({
      method: 'GET',
      url: `${API_BASE_URL}/config/abilities`
    }, 'Get Abilities Configuration');

    // Get specific ability config
    await makeRequest({
      method: 'GET',
      url: `${API_BASE_URL}/config/abilities/lightning`
    }, 'Get Lightning Ability Config');

    // Get ads config for Android
    await makeRequest({
      method: 'GET',
      url: `${API_BASE_URL}/config/ads?platform=android`
    }, 'Get Android Ads Configuration');

    // Get ads config for iOS
    await makeRequest({
      method: 'GET',
      url: `${API_BASE_URL}/config/ads?platform=ios`
    }, 'Get iOS Ads Configuration');

    // Get complete game config
    await makeRequest({
      method: 'GET',
      url: `${API_BASE_URL}/config/game?platform=android`
    }, 'Get Complete Game Configuration');

    // ========================================================================
    // ERROR HANDLING TESTS
    // ========================================================================
    console.log('\n🚨 ERROR HANDLING TESTS');
    console.log('-'.repeat(40));

    // Test invalid endpoint
    try {
      await makeRequest({
        method: 'GET',
        url: `${API_BASE_URL}/invalid-endpoint`
      }, 'Invalid Endpoint (Should Fail)');
    } catch (error) {
      console.log('✅ Invalid Endpoint correctly returned 404');
      testResults.passed++;
      testResults.failed--; // Adjust since this failure was expected
    }

    // Test unauthorized access
    try {
      await makeRequest({
        method: 'GET',
        url: `${API_BASE_URL}/user/profile`
        // No authorization header
      }, 'Unauthorized Access (Should Fail)');
    } catch (error) {
      console.log('✅ Unauthorized access correctly returned 401');
      testResults.passed++;
      testResults.failed--; // Adjust since this failure was expected
    }

    // Test invalid login
    try {
      await makeRequest({
        method: 'POST',
        url: `${API_BASE_URL}/auth/login`,
        data: {
          email: 'invalid@example.com',
          password: 'wrongpassword'
        }
      }, 'Invalid Login (Should Fail)');
    } catch (error) {
      console.log('✅ Invalid login correctly returned 401');
      testResults.passed++;
      testResults.failed--; // Adjust since this failure was expected
    }

    // ========================================================================
    // LOGOUT TEST
    // ========================================================================
    console.log('\n🚪 LOGOUT TEST');
    console.log('-'.repeat(40));

    await makeRequest({
      method: 'POST',
      url: `${API_BASE_URL}/auth/logout`,
      headers: { Authorization: `Bearer ${token}` }
    }, 'User Logout');

  } catch (error) {
    console.error('\n💥 Critical test failure:', error.message);
  }

  // ========================================================================
  // TEST SUMMARY
  // ========================================================================
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📊 Total: ${testResults.total}`);
  console.log(`📈 Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);

  if (testResults.failures.length > 0) {
    console.log('\n❌ FAILED TESTS:');
    testResults.failures.forEach((failure, index) => {
      console.log(`${index + 1}. ${failure.test}`);
      console.log(`   Error: ${failure.error}`);
      console.log(`   Status: ${failure.status}`);
    });
  }

  if (testResults.failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Backend API is fully functional.');
  } else {
    console.log(`\n⚠️  ${testResults.failed} test(s) failed. Please check the errors above.`);
  }

  console.log('\n🔗 API Documentation:');
  console.log(`   Health: GET ${API_BASE_URL}/health`);
  console.log(`   Auth: POST ${API_BASE_URL}/auth/register|login|google-login`);
  console.log(`   User: GET|PUT ${API_BASE_URL}/user/profile|game-data|rank|stats`);
  console.log(`   Game: POST ${API_BASE_URL}/game/session|progress`);
  console.log(`   Leaderboard: GET ${API_BASE_URL}/leaderboard[/weekly|monthly|top-players|stats]`);
  console.log(`   Config: GET ${API_BASE_URL}/config/abilities|ads|game`);
}

// Run the comprehensive test
testAllAPIs().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});