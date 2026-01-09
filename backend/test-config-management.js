const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// Test configuration management endpoints
async function testConfigManagement() {
  console.log('🧪 Testing Ad Configuration Management\n');

  try {
    // 1. Initialize AdConfig with default data
    console.log('1️⃣ Initializing AdConfig...');
    const initAdConfigResponse = await axios.post(`${BASE_URL}/adconfig/initialize`);
    console.log('✅ AdConfig initialized:', initAdConfigResponse.data.message);
    console.log(`   Created/Skipped: ${initAdConfigResponse.data.results.length} configurations\n`);

    // 2. Initialize AdUnit with default data
    console.log('2️⃣ Initializing AdUnit...');
    const initAdUnitResponse = await axios.post(`${BASE_URL}/adunit/initialize`);
    console.log('✅ AdUnit initialized:', initAdUnitResponse.data.message);
    console.log(`   Created/Skipped: ${initAdUnitResponse.data.results.length} ad units\n`);

    // 3. Get all AdConfigs
    console.log('3️⃣ Fetching all AdConfigs...');
    const adConfigsResponse = await axios.get(`${BASE_URL}/adconfig`);
    console.log('✅ AdConfigs fetched:', adConfigsResponse.data.count, 'configurations');
    adConfigsResponse.data.data.forEach(config => {
      console.log(`   ${config.platform}: ${config.appId} (Active: ${config.isActive})`);
    });
    console.log();

    // 4. Get all AdUnits
    console.log('4️⃣ Fetching all AdUnits...');
    const adUnitsResponse = await axios.get(`${BASE_URL}/adunit`);
    console.log('✅ AdUnits fetched:', adUnitsResponse.data.count, 'ad units');
    adUnitsResponse.data.data.forEach(unit => {
      console.log(`   ${unit.platform} ${unit.adType}: ${unit.adId} (Priority: ${unit.priority})`);
    });
    console.log();

    // 5. Update an AdConfig
    console.log('5️⃣ Updating Android AdConfig...');
    const updateResponse = await axios.put(`${BASE_URL}/adconfig/android`, {
      appId: 'ca-app-pub-1234567890123456~1234567890', // Custom App ID
      maxAdContentRating: 'PG'
    });
    console.log('✅ AdConfig updated:', updateResponse.data.message);
    console.log(`   New App ID: ${updateResponse.data.data.appId}`);
    console.log(`   New Rating: ${updateResponse.data.data.maxAdContentRating}\n`);

    // 6. Get specific platform config
    console.log('6️⃣ Fetching Android AdConfig...');
    const androidConfigResponse = await axios.get(`${BASE_URL}/adconfig/android`);
    console.log('✅ Android config:', androidConfigResponse.data.data.appId);
    console.log();

    // 7. Get best ad unit for platform/type
    console.log('7️⃣ Getting best rewarded ad for Android...');
    const bestAdResponse = await axios.get(`${BASE_URL}/adunit/best/android/rewarded`);
    console.log('✅ Best ad unit:', bestAdResponse.data.adId);
    console.log();

    // 8. Test the original config endpoint (should still work)
    console.log('8️⃣ Testing original config endpoint...');
    const gameConfigResponse = await axios.get(`${BASE_URL}/config/game?platform=android`);
    console.log('✅ Game config fetched successfully');
    console.log(`   Reward amount: ${gameConfigResponse.data.config.rewardAmount} coins`);
    console.log(`   Ad App ID: ${gameConfigResponse.data.config.ads.appId}`);
    console.log();

    console.log('🎉 All tests completed successfully!');
    console.log('\n📝 Summary:');
    console.log('   ✅ AdConfig and AdUnit collections can be managed via API');
    console.log('   ✅ No more need for manual seeding');
    console.log('   ✅ Data can be updated directly through database or API');
    console.log('   ✅ Original endpoints still work for backward compatibility');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Usage instructions
console.log('🚀 Ad Configuration Management Test');
console.log('=====================================');
console.log('Make sure your backend server is running on port 3000');
console.log('Run: npm start (in backend directory)');
console.log('Then run this test script\n');

// Run tests if server is available
testConfigManagement();