const axios = require('axios');

// Test frontend-backend connection
async function testFrontendBackendConnection() {
  console.log('🧪 Testing Frontend-Backend Connection...\n');

  const API_URLS = [
    'http://localhost:3001/api',
    'http://192.168.1.39:3001/api', // Device IP from BackendService
    'http://10.0.2.2:3001/api'      // Android emulator
  ];

  let workingUrl = null;

  // Test which URL works
  for (const url of API_URLS) {
    try {
      console.log(`🔍 Testing: ${url}`);
      const response = await axios.get(`${url}/health`, { timeout: 5000 });
      
      if (response.status === 200) {
        console.log(`✅ Connection successful: ${url}`);
        console.log(`   Response: ${response.data.message}`);
        workingUrl = url;
        break;
      }
    } catch (error) {
      console.log(`❌ Failed: ${url} - ${error.message}`);
    }
  }

  if (!workingUrl) {
    console.log('\n❌ No working API URL found!');
    console.log('Make sure the backend server is running on port 3001');
    return;
  }

  console.log(`\n🎯 Using working URL: ${workingUrl}`);

  try {
    // Test key endpoints that the frontend uses
    console.log('\n📋 Testing Key Frontend Endpoints:');
    console.log('-'.repeat(40));

    // 1. Health check
    const health = await axios.get(`${workingUrl}/health`);
    console.log('✅ Health Check:', health.data.message);

    // 2. Abilities config (used by frontend)
    const abilities = await axios.get(`${workingUrl}/config/abilities`);
    console.log('✅ Abilities Config:', abilities.data.abilities.length, 'abilities');

    // 3. Ad config (used by frontend)
    const ads = await axios.get(`${workingUrl}/config/ads?platform=android&dev=true`);
    console.log('✅ Ad Config:', ads.data.adConfig.platform, 'platform');

    // 4. Complete game config (used by frontend)
    const gameConfig = await axios.get(`${workingUrl}/config/game?platform=android&dev=true`);
    console.log('✅ Game Config:', gameConfig.data.config.abilities.length, 'abilities +', gameConfig.data.config.ads ? 'ads' : 'no ads');

    // 5. Leaderboard (public endpoint)
    const leaderboard = await axios.get(`${workingUrl}/leaderboard?limit=5`);
    console.log('✅ Leaderboard:', leaderboard.data.leaderboard.length, 'players');

    console.log('\n🎉 Frontend-Backend Connection Test PASSED!');
    console.log('✅ All key endpoints are working correctly');
    console.log(`🔗 Frontend should use: ${workingUrl}`);

    // Show configuration summary
    console.log('\n📊 Configuration Summary:');
    console.log('='.repeat(40));
    console.log('Abilities Available:');
    abilities.data.abilities.forEach(ability => {
      console.log(`  - ${ability.displayName} (${ability.name}): ${ability.price} coins`);
    });
    
    console.log('\nAd Configuration:');
    console.log(`  Platform: ${ads.data.adConfig.platform}`);
    console.log(`  App ID: ${ads.data.adConfig.appId}`);
    console.log(`  Banner Ad Unit: ${ads.data.adConfig.bannerAdUnitId}`);
    console.log(`  Rewarded Ad Unit: ${ads.data.adConfig.rewardedAdUnitId}`);
    console.log(`  Coins per Ad: ${ads.data.adConfig.rewardConfig.coinsPerAd}`);

  } catch (error) {
    console.error('\n❌ Frontend-Backend Test Failed:', error.response?.data || error.message);
  }
}

// Run the test
testFrontendBackendConnection().catch(console.error);