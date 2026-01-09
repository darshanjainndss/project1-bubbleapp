const axios = require('axios');

// API Configuration
const API_BASE_URL = 'http://localhost:3001/api';
const FRONTEND_URLS = [
  'http://localhost:3001/api',
  'http://192.168.1.39:3001/api',
  'http://10.0.2.2:3001/api'
];

// Test Results Tracking
let results = {
  backend: { passed: 0, failed: 0, tests: [] },
  frontend: { passed: 0, failed: 0, tests: [] },
  integration: { passed: 0, failed: 0, tests: [] }
};

// Helper function to log test results
function logTest(category, testName, success, details = '') {
  const status = success ? '✅' : '❌';
  console.log(`${status} ${testName}${details ? ' - ' + details : ''}`);
  
  results[category].tests.push({ name: testName, success, details });
  if (success) {
    results[category].passed++;
  } else {
    results[category].failed++;
  }
}

async function runFinalVerification() {
  console.log('🔍 FINAL API & SYSTEM VERIFICATION');
  console.log('=' .repeat(60));
  console.log('Testing all APIs, URLs, and system integration...\n');

  // ========================================================================
  // BACKEND API VERIFICATION
  // ========================================================================
  console.log('🔧 BACKEND API VERIFICATION');
  console.log('-'.repeat(40));

  try {
    // Health Check
    const health = await axios.get(`${API_BASE_URL}/health`);
    logTest('backend', 'Health Check', health.status === 200, health.data.message);

    // Authentication Flow
    const testUser = {
      email: `finaltest${Date.now()}@example.com`,
      password: 'password123',
      displayName: 'Final Test User'
    };

    const register = await axios.post(`${API_BASE_URL}/auth/register`, testUser);
    logTest('backend', 'User Registration', register.status === 201);

    const login = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    logTest('backend', 'User Login', login.status === 200);

    const token = login.data.token;

    // User Management
    const profile = await axios.get(`${API_BASE_URL}/user/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    logTest('backend', 'Get User Profile', profile.status === 200);

    const gameData = await axios.get(`${API_BASE_URL}/user/game-data`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    logTest('backend', 'Get Game Data', gameData.status === 200);

    // Coins & Abilities
    const coins = await axios.put(`${API_BASE_URL}/user/coins`, {
      amount: 100, operation: 'add'
    }, { headers: { Authorization: `Bearer ${token}` } });
    logTest('backend', 'Update Coins', coins.status === 200);

    const purchase = await axios.post(`${API_BASE_URL}/user/purchase-abilities`, {
      ability: 'lightning', quantity: 1
    }, { headers: { Authorization: `Bearer ${token}` } });
    logTest('backend', 'Purchase Abilities', purchase.status === 200);

    // Game Sessions
    const session = await axios.post(`${API_BASE_URL}/game/session`, {
      level: 1, score: 1500, moves: 20, stars: 3, duration: 90, isWin: true,
      abilitiesUsed: { lightning: 1, bomb: 0, freeze: 0, fire: 0 },
      bubblesDestroyed: 50, chainReactions: 5, perfectShots: 10
    }, { headers: { Authorization: `Bearer ${token}` } });
    logTest('backend', 'Submit Game Session', session.status === 201);

    // Leaderboards
    const leaderboard = await axios.get(`${API_BASE_URL}/leaderboard`);
    logTest('backend', 'Global Leaderboard', leaderboard.status === 200);

    const weekly = await axios.get(`${API_BASE_URL}/leaderboard/weekly`);
    logTest('backend', 'Weekly Leaderboard', weekly.status === 200);

    // Configuration
    const abilities = await axios.get(`${API_BASE_URL}/config/abilities`);
    logTest('backend', 'Abilities Config', abilities.status === 200, `${abilities.data.abilities.length} abilities`);

    const ads = await axios.get(`${API_BASE_URL}/config/ads?platform=android&dev=true`);
    logTest('backend', 'Ads Config', ads.status === 200, ads.data.adConfig.platform);

    const gameConfig = await axios.get(`${API_BASE_URL}/config/game?platform=android&dev=true`);
    logTest('backend', 'Game Config', gameConfig.status === 200);

  } catch (error) {
    logTest('backend', 'Backend API Test', false, error.message);
  }

  // ========================================================================
  // FRONTEND CONNECTION VERIFICATION
  // ========================================================================
  console.log('\n📱 FRONTEND CONNECTION VERIFICATION');
  console.log('-'.repeat(40));

  let workingUrl = null;
  for (const url of FRONTEND_URLS) {
    try {
      const response = await axios.get(`${url}/health`, { timeout: 3000 });
      if (response.status === 200) {
        logTest('frontend', `Connection Test: ${url}`, true);
        if (!workingUrl) workingUrl = url;
      }
    } catch (error) {
      logTest('frontend', `Connection Test: ${url}`, false, 'Connection failed');
    }
  }

  if (workingUrl) {
    // Test key frontend endpoints
    try {
      const frontendTests = [
        { endpoint: '/config/abilities', name: 'Frontend Abilities Config' },
        { endpoint: '/config/ads?platform=android&dev=true', name: 'Frontend Ads Config' },
        { endpoint: '/leaderboard?limit=10', name: 'Frontend Leaderboard' }
      ];

      for (const test of frontendTests) {
        const response = await axios.get(`${workingUrl}${test.endpoint}`);
        logTest('frontend', test.name, response.status === 200);
      }
    } catch (error) {
      logTest('frontend', 'Frontend Endpoint Tests', false, error.message);
    }
  }

  // ========================================================================
  // INTEGRATION VERIFICATION
  // ========================================================================
  console.log('\n🔗 INTEGRATION VERIFICATION');
  console.log('-'.repeat(40));

  try {
    // Database connectivity
    const dbTest = await axios.get(`${API_BASE_URL}/leaderboard/stats`);
    logTest('integration', 'Database Integration', dbTest.status === 200, 
      `${dbTest.data.stats.totalPlayers} players in DB`);

    // Configuration consistency
    const configTest = await axios.get(`${API_BASE_URL}/config/game?platform=android&dev=true`);
    const hasAbilities = configTest.data.config.abilities.length > 0;
    const hasAds = configTest.data.config.ads !== null;
    logTest('integration', 'Configuration Completeness', hasAbilities && hasAds, 
      `${configTest.data.config.abilities.length} abilities, ads: ${hasAds ? 'yes' : 'no'}`);

    // Authentication flow
    const authTest = await axios.post(`${API_BASE_URL}/auth/register`, {
      email: `integrationtest${Date.now()}@example.com`,
      password: 'test123',
      displayName: 'Integration Test'
    });
    logTest('integration', 'Full Auth Flow', authTest.status === 201);

    // Game data persistence
    const token = authTest.data.token;
    const gameDataBefore = await axios.get(`${API_BASE_URL}/user/game-data`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    await axios.put(`${API_BASE_URL}/user/coins`, {
      amount: 200, operation: 'add'
    }, { headers: { Authorization: `Bearer ${token}` } });
    
    const gameDataAfter = await axios.get(`${API_BASE_URL}/user/game-data`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const coinsPersisted = gameDataAfter.data.gameData.totalCoins > gameDataBefore.data.gameData.totalCoins;
    logTest('integration', 'Data Persistence', coinsPersisted, 
      `Coins: ${gameDataBefore.data.gameData.totalCoins} → ${gameDataAfter.data.gameData.totalCoins}`);

  } catch (error) {
    logTest('integration', 'Integration Tests', false, error.message);
  }

  // ========================================================================
  // FINAL SUMMARY
  // ========================================================================
  console.log('\n' + '='.repeat(60));
  console.log('📊 FINAL VERIFICATION SUMMARY');
  console.log('='.repeat(60));

  const categories = ['backend', 'frontend', 'integration'];
  let totalPassed = 0;
  let totalFailed = 0;
  let totalTests = 0;

  categories.forEach(category => {
    const { passed, failed } = results[category];
    const total = passed + failed;
    const percentage = total > 0 ? ((passed / total) * 100).toFixed(1) : '0.0';
    
    console.log(`${category.toUpperCase()}:`);
    console.log(`  ✅ Passed: ${passed}`);
    console.log(`  ❌ Failed: ${failed}`);
    console.log(`  📊 Success Rate: ${percentage}%`);
    console.log('');

    totalPassed += passed;
    totalFailed += failed;
    totalTests += total;
  });

  const overallPercentage = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : '0.0';
  
  console.log('OVERALL RESULTS:');
  console.log(`✅ Total Passed: ${totalPassed}`);
  console.log(`❌ Total Failed: ${totalFailed}`);
  console.log(`📊 Overall Success Rate: ${overallPercentage}%`);

  if (totalFailed === 0) {
    console.log('\n🎉 ALL SYSTEMS OPERATIONAL!');
    console.log('✅ Backend API is fully functional');
    console.log('✅ Frontend can connect to backend');
    console.log('✅ Database integration working');
    console.log('✅ All configurations loaded');
    console.log('✅ Authentication system working');
    console.log('✅ Game data persistence working');
  } else {
    console.log('\n⚠️  ISSUES DETECTED:');
    categories.forEach(category => {
      const failedTests = results[category].tests.filter(test => !test.success);
      if (failedTests.length > 0) {
        console.log(`\n${category.toUpperCase()} Issues:`);
        failedTests.forEach(test => {
          console.log(`  ❌ ${test.name}: ${test.details}`);
        });
      }
    });
  }

  console.log('\n🔗 API ENDPOINTS VERIFIED:');
  console.log(`   Health: GET ${API_BASE_URL}/health`);
  console.log(`   Auth: POST ${API_BASE_URL}/auth/register|login`);
  console.log(`   User: GET|PUT ${API_BASE_URL}/user/profile|game-data`);
  console.log(`   Game: POST ${API_BASE_URL}/game/session`);
  console.log(`   Leaderboard: GET ${API_BASE_URL}/leaderboard`);
  console.log(`   Config: GET ${API_BASE_URL}/config/abilities|ads|game`);

  if (workingUrl && workingUrl !== API_BASE_URL) {
    console.log(`\n📱 Frontend should use: ${workingUrl}`);
  }
}

// Run the final verification
runFinalVerification().catch(error => {
  console.error('\n💥 Final verification failed:', error);
  process.exit(1);
});