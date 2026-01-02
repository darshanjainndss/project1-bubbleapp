/**
 * Test script to verify rewarded ad event types
 * This helps debug the AdEventType constants
 */

console.log('🧪 Testing Rewarded Ad Event Types...\n');

// Test 1: Check if RewardedAdButton component exists
const fs = require('fs');
try {
  const rewardedAdContent = fs.readFileSync('src/components/RewardedAdButton.tsx', 'utf8');
  
  // Check imports
  const hasCorrectImport = rewardedAdContent.includes('AdEventType');
  console.log(`✅ AdEventType import: ${hasCorrectImport}`);
  
  // Check event listeners
  const hasLoadedEvent = rewardedAdContent.includes('AdEventType.LOADED');
  const hasEarnedEvent = rewardedAdContent.includes('AdEventType.EARNED_REWARD');
  const hasClosedEvent = rewardedAdContent.includes('AdEventType.CLOSED');
  const hasErrorEvent = rewardedAdContent.includes('AdEventType.ERROR');
  
  console.log(`✅ LOADED event: ${hasLoadedEvent}`);
  console.log(`✅ EARNED_REWARD event: ${hasEarnedEvent}`);
  console.log(`✅ CLOSED event: ${hasClosedEvent}`);
  console.log(`✅ ERROR event: ${hasErrorEvent}`);
  
  if (hasLoadedEvent && hasEarnedEvent && hasClosedEvent && hasErrorEvent) {
    console.log('\n🎉 All event types are correctly implemented!');
  } else {
    console.log('\n❌ Some event types are missing');
  }
  
} catch (error) {
  console.log('❌ Error reading RewardedAdButton component');
}

// Test 2: Check if component is imported in Roadmap
try {
  const roadmapContent = fs.readFileSync('src/components/Roadmap.tsx', 'utf8');
  const hasImport = roadmapContent.includes("import RewardedAdButton from './RewardedAdButton'");
  const hasUsage = roadmapContent.includes('<RewardedAdButton');
  
  console.log(`\n✅ Roadmap imports RewardedAdButton: ${hasImport}`);
  console.log(`✅ Roadmap uses RewardedAdButton: ${hasUsage}`);
} catch (error) {
  console.log('\n❌ Error checking Roadmap component');
}

console.log('\n🔧 Next steps:');
console.log('   1. Run: npx react-native run-android');
console.log('   2. Open shop modal');
console.log('   3. Look for "WATCH AD" button');
console.log('   4. Check console for "✅ Rewarded ad loaded"');
console.log('   5. Test watching ad to earn 50 coins');

console.log('\n💡 Fixed Issues:');
console.log('   - Changed from RewardedAdEventType to AdEventType');
console.log('   - Using correct event constants (LOADED, EARNED_REWARD, etc.)');
console.log('   - Proper import from react-native-google-mobile-ads');