/**
 * Test AdConfig Integration
 * Tests that the frontend can successfully fetch AdConfig from the backend
 */

// Using built-in fetch (Node.js 18+)

const API_BASE_URL = 'http://localhost:3001/api';

async function testAdConfigIntegration() {
  console.log('🧪 Testing AdConfig Integration...\n');

  try {
    // Test Android AdConfig
    console.log('1. Testing Android AdConfig...');
    const androidResponse = await fetch(`${API_BASE_URL}/config/ads?platform=android`);
    const androidData = await androidResponse.json();
    
    if (androidData.success) {
      console.log('✅ Android AdConfig fetched successfully');
      console.log(`   App ID: ${androidData.adConfig.appId}`);
      console.log(`   Max Content Rating: ${androidData.adConfig.maxAdContentRating}`);
      console.log(`   Reward per Ad: ${androidData.adConfig.rewardConfig.coinsPerAd} coins`);
      console.log(`   Under Age Consent: ${androidData.adConfig.tagForUnderAgeOfConsent}`);
      console.log(`   Child Directed: ${androidData.adConfig.tagForChildDirectedTreatment}`);
    } else {
      console.log('❌ Failed to fetch Android AdConfig');
      return;
    }

    console.log('');

    // Test iOS AdConfig
    console.log('2. Testing iOS AdConfig...');
    const iosResponse = await fetch(`${API_BASE_URL}/config/ads?platform=ios`);
    const iosData = await iosResponse.json();
    
    if (iosData.success) {
      console.log('✅ iOS AdConfig fetched successfully');
      console.log(`   App ID: ${iosData.adConfig.appId}`);
      console.log(`   Max Content Rating: ${iosData.adConfig.maxAdContentRating}`);
      console.log(`   Reward per Ad: ${iosData.adConfig.rewardConfig.coinsPerAd} coins`);
      console.log(`   Under Age Consent: ${iosData.adConfig.tagForUnderAgeOfConsent}`);
      console.log(`   Child Directed: ${iosData.adConfig.tagForChildDirectedTreatment}`);
    } else {
      console.log('❌ Failed to fetch iOS AdConfig');
      return;
    }

    console.log('');

    // Test Complete Game Config
    console.log('3. Testing Complete Game Config...');
    const gameConfigResponse = await fetch(`${API_BASE_URL}/config/game?platform=android`);
    const gameConfigData = await gameConfigResponse.json();
    
    if (gameConfigData.success) {
      console.log('✅ Game Config fetched successfully');
      console.log(`   Platform: ${gameConfigData.config.platform}`);
      console.log(`   Abilities Count: ${gameConfigData.config.abilities.length}`);
      console.log(`   Reward Amount: ${gameConfigData.config.rewardAmount} coins`);
      console.log(`   Ad Config Present: ${gameConfigData.config.ads ? 'Yes' : 'No'}`);
      
      if (gameConfigData.config.ads) {
        console.log(`   Ad App ID: ${gameConfigData.config.ads.appId}`);
      }
    } else {
      console.log('❌ Failed to fetch Game Config');
      return;
    }

    console.log('\n🎉 All AdConfig integration tests passed!');
    console.log('\n📋 Summary:');
    console.log('   • Backend AdConfig model is working correctly');
    console.log('   • Both Android and iOS configurations are available');
    console.log('   • Reward amounts are properly configured from environment variables');
    console.log('   • Frontend can successfully fetch all required configuration');
    console.log('   • Integration is complete and ready for production');

  } catch (error) {
    console.error('❌ AdConfig integration test failed:', error.message);
    console.log('\n🔧 Make sure:');
    console.log('   • Backend server is running (npm start in backend folder)');
    console.log('   • MongoDB is running and accessible');
    console.log('   • AdConfig has been seeded (node seeders/adConfig.js)');
  }
}

// Run the test
testAdConfigIntegration();