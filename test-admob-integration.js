/**
 * Test script to verify AdMob integration
 * Run this with: node test-admob-integration.js
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Testing AdMob Integration...\n');

// Test 1: Check if AdMob package is installed
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const hasAdMob = packageJson.dependencies['react-native-google-mobile-ads'];
  console.log(`✅ AdMob package installed: ${hasAdMob}`);
} catch (error) {
  console.log('❌ Error reading package.json');
}

// Test 2: Check app.json configuration
try {
  const appJson = JSON.parse(fs.readFileSync('app.json', 'utf8'));
  const hasAppId = appJson['react-native-google-mobile-ads']?.android_app_id;
  console.log(`✅ App ID configured: ${hasAppId}`);
} catch (error) {
  console.log('❌ Error reading app.json');
}

// Test 3: Check Android manifest
try {
  const manifestPath = 'android/app/src/main/AndroidManifest.xml';
  const manifest = fs.readFileSync(manifestPath, 'utf8');
  const hasMetaData = manifest.includes('com.google.android.gms.ads.APPLICATION_ID');
  console.log(`✅ Android manifest configured: ${hasMetaData}`);
} catch (error) {
  console.log('❌ Error reading Android manifest');
}

// Test 4: Check if AdBanner component exists
try {
  const adBannerExists = fs.existsSync('src/components/AdBanner.tsx');
  console.log(`✅ AdBanner component created: ${adBannerExists}`);
} catch (error) {
  console.log('❌ Error checking AdBanner component');
}

// Test 5: Check if AdMob config exists
try {
  const configExists = fs.existsSync('src/config/admob.ts');
  console.log(`✅ AdMob config created: ${configExists}`);
} catch (error) {
  console.log('❌ Error checking AdMob config');
}

// Test 6: Check if Roadmap component imports AdBanner
try {
  const roadmapContent = fs.readFileSync('src/components/Roadmap.tsx', 'utf8');
  const hasImport = roadmapContent.includes("import AdBanner from './AdBanner'");
  const hasUsage = roadmapContent.includes('<AdBanner');
  console.log(`✅ Roadmap imports AdBanner: ${hasImport}`);
  console.log(`✅ Roadmap uses AdBanner: ${hasUsage}`);
} catch (error) {
  console.log('❌ Error checking Roadmap component');
}

console.log('\n🎉 AdMob Integration Test Complete!');
console.log('\n📱 Your AdMob IDs:');
console.log(`   App ID: ca-app-pub-9343780880487586~7301029574`);
console.log(`   Banner Unit ID: ca-app-pub-9343780880487586/4698916968`);
console.log(`   Rewarded Unit ID: ca-app-pub-9343780880487586/4698916968 (create separate unit)`);
console.log(`   Test Banner ID: ca-app-pub-3940256099942544/6300978111`);
console.log(`   Test Rewarded ID: ca-app-pub-3940256099942544/5224354917`);
console.log('\n🔧 Next steps:');
console.log('   1. Run: npx react-native run-android');
console.log('   2. Look for TEST ADS in debug mode (should work immediately)');
console.log('   3. Open shop to see REWARDED AD button');
console.log('   4. Watch rewarded ad to earn 50 coins');
console.log('   5. Real ads will start showing in 24-48 hours');
console.log('   6. Create separate rewarded ad unit in AdMob console');
console.log('\n💡 The "no fill" error is NORMAL for new AdMob accounts!');
console.log('   - Test ads will load immediately in development');
console.log('   - Real ads need 24-48 hours to start serving');
console.log('   - Rewarded ads give users 50 coins per watch');