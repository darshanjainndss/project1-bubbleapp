const axios = require('axios');

const API_BASE_URL = 'http://192.168.1.71:3001/api';

async function testAllEndpoints() {
  console.log('🧪 Testing ALL Bubble Shooter Backend API Endpoints...\n');

  let token = '';
  let userId = '';

  try {
    // Test 1: Health Check
    console.log('1. Testing Health Check...');
    const healthResponse = await axios.get(`${API_BASE_URL}/health`);
    console.log('✅ Health Check:', healthResponse.data.message);

    // Test 2: User Registration
    console.log('\n2. Testing User Registration...');
    const testUser = {
      email: `testuser${Date.now()}@example.com`,
      password: 'password123',
      displayName: 'Test User API'
    };

    const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, testUser);
    console.log('✅ Registration Success:', registerResponse.data.message);
    token = registerResponse.data.token;
    userId = registerResponse.data.user.id;

    // Test 3: User Login
    console.log('\n3. Testing User Login...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    console.log('✅ Login Success:', loginResponse.data.message);

    // Test 4: Verify Token
    console.log('\n4. Testing Token Verification...');
    const verifyResponse = await axios.post(`${API_BASE_URL}/auth/verify-token`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Token Valid:', verifyResponse.data.message);

    // Test 5: Get User Profile
    console.log('\n5. Testing Get User Profile...');
    const profileResponse = await axios.get(`${API_BASE_URL}/user/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Profile Retrieved:', profileResponse.data.user.displayName);

    // Test 6: Update User Profile
    console.log('\n6. Testing Update User Profile...');
    const updateProfileResponse = await axios.put(`${API_BASE_URL}/user/profile`, {
      displayName: 'Updated Test User'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Profile Updated:', updateProfileResponse.data.user.displayName);

    // Test 7: Get User Game Data
    console.log('\n7. Testing Get User Game Data...');
    const gameDataResponse = await axios.get(`${API_BASE_URL}/user/game-data`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Game Data Retrieved:');
    console.log('   Total Coins:', gameDataResponse.data.gameData.totalCoins);
    console.log('   Abilities:', gameDataResponse.data.gameData.abilities);

    // Test 8: Update Coins (Add)
    console.log('\n8. Testing Update Coins (Add)...');
    const addCoinsResponse = await axios.put(`${API_BASE_URL}/user/coins`, {
      amount: 50,
      operation: 'add'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Coins Added:', addCoinsResponse.data.newBalance);

    // Test 9: Update Coins (Subtract)
    console.log('\n9. Testing Update Coins (Subtract)...');
    const subtractCoinsResponse = await axios.put(`${API_BASE_URL}/user/coins`, {
      amount: 25,
      operation: 'subtract'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Coins Subtracted:', subtractCoinsResponse.data.newBalance);

    // Test 10: Update Abilities
    console.log('\n10. Testing Update Abilities...');
    const abilitiesResponse = await axios.put(`${API_BASE_URL}/user/abilities`, {
      abilities: { lightning: 5, bomb: 3 }
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Abilities Updated:', abilitiesResponse.data.abilities);

    // Test 11: Purchase Abilities
    console.log('\n11. Testing Purchase Abilities...');
    const purchaseResponse = await axios.post(`${API_BASE_URL}/user/purchase-abilities`, {
      ability: 'lightning',
      quantity: 2
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Abilities Purchased:', purchaseResponse.data.message);

    // Test 12: Get User Rank
    console.log('\n12. Testing Get User Rank...');
    const rankResponse = await axios.get(`${API_BASE_URL}/user/rank`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ User Rank:', rankResponse.data.rank);

    // Test 13: Get User Stats
    console.log('\n13. Testing Get User Stats...');
    const statsResponse = await axios.get(`${API_BASE_URL}/user/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ User Stats Retrieved:', statsResponse.data.stats.totalGames);

    // Test 14: Submit Game Session
    console.log('\n14. Testing Submit Game Session...');
    const gameSession = {
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
    };

    const sessionResponse = await axios.post(`${API_BASE_URL}/game/session`, gameSession, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Game Session Submitted:', sessionResponse.data.sessionId);

    // Test 15: Get Game Sessions
    console.log('\n15. Testing Get Game Sessions...');
    const sessionsResponse = await axios.get(`${API_BASE_URL}/game/sessions`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Game Sessions Retrieved:', sessionsResponse.data.sessions.length);

    // Test 16: Get Level Leaderboard
    console.log('\n16. Testing Get Level Leaderboard...');
    const levelLeaderboardResponse = await axios.get(`${API_BASE_URL}/game/level/1/leaderboard`);
    console.log('✅ Level Leaderboard Retrieved:', levelLeaderboardResponse.data.leaderboard.length);

    // Test 17: Get Best Score for Level
    console.log('\n17. Testing Get Best Score for Level...');
    const bestScoreResponse = await axios.get(`${API_BASE_URL}/game/level/1/best-score`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Best Score Retrieved:', bestScoreResponse.data.bestScore);

    // Test 18: Get Global Leaderboard
    console.log('\n18. Testing Get Global Leaderboard...');
    const leaderboardResponse = await axios.get(`${API_BASE_URL}/leaderboard`);
    console.log('✅ Global Leaderboard Retrieved:', leaderboardResponse.data.leaderboard.length);

    // Test 19: Get Weekly Leaderboard
    console.log('\n19. Testing Get Weekly Leaderboard...');
    const weeklyResponse = await axios.get(`${API_BASE_URL}/leaderboard/weekly`);
    console.log('✅ Weekly Leaderboard Retrieved:', weeklyResponse.data.leaderboard.length);

    // Test 20: Get Monthly Leaderboard
    console.log('\n20. Testing Get Monthly Leaderboard...');
    const monthlyResponse = await axios.get(`${API_BASE_URL}/leaderboard/monthly`);
    console.log('✅ Monthly Leaderboard Retrieved:', monthlyResponse.data.leaderboard.length);

    // Test 21: Get Top Players
    console.log('\n21. Testing Get Top Players...');
    const topPlayersResponse = await axios.get(`${API_BASE_URL}/leaderboard/top-players`);
    console.log('✅ Top Players Retrieved:', topPlayersResponse.data.topPlayers.length);

    // Test 22: Get Leaderboard Stats
    console.log('\n22. Testing Get Leaderboard Stats...');
    const leaderboardStatsResponse = await axios.get(`${API_BASE_URL}/leaderboard/stats`);
    console.log('✅ Leaderboard Stats Retrieved:', leaderboardStatsResponse.data.stats.totalPlayers);

    // Test 23: Logout
    console.log('\n23. Testing Logout...');
    const logoutResponse = await axios.post(`${API_BASE_URL}/auth/logout`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Logout Success:', logoutResponse.data.message);

    console.log('\n🎉 ALL API ENDPOINTS TESTED SUCCESSFULLY!');
    console.log('✅ Backend is fully functional with all features working');

  } catch (error) {
    console.error('❌ API Test Failed:', error.response?.data || error.message);
    console.error('   Endpoint:', error.config?.url);
    console.error('   Method:', error.config?.method?.toUpperCase());
  }
}

testAllEndpoints();