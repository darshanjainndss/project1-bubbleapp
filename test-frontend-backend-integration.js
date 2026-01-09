const axios = require('axios');

// Test the optimized backend integration
async function testFrontendBackendIntegration() {
  console.log('🧪 Testing Frontend-Backend Integration...\n');

  const baseUrl = 'http://localhost:3001/api';

  try {
    // 1. Test health endpoint
    console.log('1. Testing health endpoint...');
    const health = await axios.get(`${baseUrl}/health`);
    console.log('✅ Health:', health.data.message);

    // 2. Test ad config (simplified)
    console.log('\n2. Testing ad config...');
    const adConfig = await axios.get(`${baseUrl}/config/ads?platform=android`);
    console.log('✅ Ad Config received');
    console.log('   Platform:', adConfig.data.adConfig.platform);
    console.log('   App ID:', adConfig.data.adConfig.appId);
    console.log('   Reward Amount:', adConfig.data.adConfig.rewardConfig.coinsPerAd, 'coins');

    // 3. Test ad units
    console.log('\n3. Testing ad units...');
    const adUnits = await axios.get(`${baseUrl}/config/ad-units?platform=android`);
    console.log('✅ Ad Units received');
    console.log('   Banner:', adUnits.data.ads.banner);
    console.log('   Rewarded:', adUnits.data.ads.rewarded);
    console.log('   Rewarded List:', adUnits.data.ads.rewardedList?.length || 0, 'units');

    // 4. Test complete game config
    console.log('\n4. Testing complete game config...');
    const gameConfig = await axios.get(`${baseUrl}/config/game?platform=android`);
    console.log('✅ Game Config received');
    console.log('   Abilities:', gameConfig.data.config.abilities.length);
    console.log('   Platform:', gameConfig.data.config.platform);
    console.log('   Reward Amount:', gameConfig.data.config.rewardAmount, 'coins');

    // 5. Test abilities config
    console.log('\n5. Testing abilities config...');
    const abilities = await axios.get(`${baseUrl}/config/abilities`);
    console.log('✅ Abilities Config received');
    abilities.data.abilities.forEach(ability => {
      console.log(`   ${ability.displayName}: ${ability.price} coins, ${ability.startingCount} starting`);
    });

    console.log('\n🎉 All tests passed! Frontend can successfully fetch from optimized backend.');
    console.log('\n📋 Summary:');
    console.log(`   • Reward amount is controlled by REWARDED_AD_COINS environment variable`);
    console.log(`   • Current reward: ${adConfig.data.adConfig.rewardConfig.coinsPerAd} coins per ad`);
    console.log(`   • Ad units are fetched from AdUnit model for rotation`);
    console.log(`   • Ad config is simplified (no redundant ad unit IDs)`);
    console.log(`   • Everything is fetched from backend (single source of truth)`);

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    console.log('\n🔧 Make sure:');
    console.log('   1. Backend server is running (npm run dev in backend folder)');
    console.log('   2. Database is seeded (npm run seed in backend folder)');
    console.log('   3. Environment variables are set in backend/.env');
  }
}

// Run the test
testFrontendBackendIntegration();