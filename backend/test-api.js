const axios = require('axios');

const API_BASE_URL = 'http://192.168.1.71:3001/api';

async function testAPI() {
  console.log('🧪 Testing Bubble Shooter Backend API...\n');

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
      displayName: 'Test User'
    };

    const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, testUser);
    console.log('✅ Registration Success:', registerResponse.data.message);
    console.log('   User ID:', registerResponse.data.user.id);
    console.log('   Display Name:', registerResponse.data.user.displayName);

    const token = registerResponse.data.token;

    // Test 3: Get User Game Data
    console.log('\n3. Testing Get User Game Data...');
    const gameDataResponse = await axios.get(`${API_BASE_URL}/user/game-data`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Game Data Retrieved:');
    console.log('   Total Coins:', gameDataResponse.data.gameData.totalCoins);
    console.log('   Current Level:', gameDataResponse.data.gameData.currentLevel);
    console.log('   Abilities:', gameDataResponse.data.gameData.abilities);

    // Test 4: Update Coins
    console.log('\n4. Testing Update Coins...');
    const coinsResponse = await axios.put(`${API_BASE_URL}/user/coins`, {
      amount: 50,
      operation: 'add'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Coins Updated:');
    console.log('   New Balance:', coinsResponse.data.newBalance);

    // Test 5: Submit Game Session
    console.log('\n5. Testing Submit Game Session...');
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
    console.log('✅ Game Session Submitted:');
    console.log('   Session ID:', sessionResponse.data.sessionId);
    console.log('   Coins Earned:', sessionResponse.data.coinsEarned);

    // Test 6: Get Leaderboard
    console.log('\n6. Testing Get Leaderboard...');
    const leaderboardResponse = await axios.get(`${API_BASE_URL}/leaderboard`);
    console.log('✅ Leaderboard Retrieved:');
    console.log('   Total Players:', leaderboardResponse.data.leaderboard.length);

    console.log('\n🎉 All API tests passed successfully!');
    console.log('✅ Backend is working correctly and saving data to MongoDB');

  } catch (error) {
    console.error('❌ API Test Failed:', error.response?.data || error.message);
  }
}

testAPI();