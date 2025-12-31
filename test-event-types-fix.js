/**
 * Test script to verify correct event types are used
 */

const fs = require('fs');

console.log('🔧 Testing Event Types Fix...\n');

// Test both rewarded ad components
const components = [
  'src/components/RewardedAdButton.tsx',
  'src/components/SimpleRewardedAdButton.tsx'
];

components.forEach((componentPath, index) => {
  console.log(`📁 Testing ${componentPath}:`);
  
  try {
    const content = fs.readFileSync(componentPath, 'utf8');
    
    // Check imports
    const hasRewardedAdEventType = content.includes('RewardedAdEventType');
    const hasAdEventType = content.includes('AdEventType');
    console.log(`   ✅ RewardedAdEventType import: ${hasRewardedAdEventType}`);
    console.log(`   ✅ AdEventType import: ${hasAdEventType}`);
    
    // Check correct event usage
    const hasCorrectLoaded = content.includes('RewardedAdEventType.LOADED');
    const hasCorrectEarned = content.includes('RewardedAdEventType.EARNED_REWARD');
    const hasCorrectClosed = content.includes('AdEventType.CLOSED');
    const hasCorrectError = content.includes('AdEventType.ERROR');
    
    console.log(`   ✅ LOADED event (RewardedAdEventType): ${hasCorrectLoaded}`);
    console.log(`   ✅ EARNED_REWARD event (RewardedAdEventType): ${hasCorrectEarned}`);
    console.log(`   ✅ CLOSED event (AdEventType): ${hasCorrectClosed}`);
    console.log(`   ✅ ERROR event (AdEventType): ${hasCorrectError}`);
    
    const allCorrect = hasRewardedAdEventType && hasAdEventType && 
                      hasCorrectLoaded && hasCorrectEarned && 
                      hasCorrectClosed && hasCorrectError;
    
    console.log(`   ${allCorrect ? '🎉' : '❌'} All event types correct: ${allCorrect}\n`);
    
  } catch (error) {
    console.log(`   ❌ Error reading ${componentPath}\n`);
  }
});

console.log('📚 Event Type Rules (from official docs):');
console.log('   - RewardedAdEventType.LOADED ✅');
console.log('   - RewardedAdEventType.EARNED_REWARD ✅');
console.log('   - AdEventType.CLOSED ✅');
console.log('   - AdEventType.ERROR ✅');

console.log('\n🚀 Test Instructions:');
console.log('   1. Run: npx react-native run-android');
console.log('   2. Should load without event listener errors');
console.log('   3. Look for the green "WATCH AD (+50 Coins)" button');
console.log('   4. Click to watch test rewarded ad');
console.log('   5. Earn 50 coins and see success alert');

console.log('\n💡 What was fixed:');
console.log('   - Added RewardedAdEventType import');
console.log('   - Used RewardedAdEventType for LOADED and EARNED_REWARD');
console.log('   - Used AdEventType for CLOSED and ERROR');
console.log('   - Follows official documentation syntax');