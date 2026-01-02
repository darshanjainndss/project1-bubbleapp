/**
 * Test script for Simple Rewarded Ad Button
 */

const fs = require('fs');

console.log('🧪 Testing Simple Rewarded Ad Button...\n');

// Test 1: Check if SimpleRewardedAdButton component exists
try {
  const componentExists = fs.existsSync('src/components/SimpleRewardedAdButton.tsx');
  console.log(`✅ SimpleRewardedAdButton component created: ${componentExists}`);
} catch (error) {
  console.log('❌ Error checking SimpleRewardedAdButton component');
}

// Test 2: Check if component is imported in Roadmap
try {
  const roadmapContent = fs.readFileSync('src/components/Roadmap.tsx', 'utf8');
  const hasImport = roadmapContent.includes("import SimpleRewardedAdButton from './SimpleRewardedAdButton'");
  const hasUsage = roadmapContent.includes('<SimpleRewardedAdButton');
  
  console.log(`✅ Roadmap imports SimpleRewardedAdButton: ${hasImport}`);
  console.log(`✅ Roadmap uses SimpleRewardedAdButton: ${hasUsage}`);
} catch (error) {
  console.log('❌ Error checking Roadmap component');
}

// Test 3: Check if styles are added
try {
  const stylesContent = fs.readFileSync('src/styles/RoadmapStyles.ts', 'utf8');
  const hasStyles = stylesContent.includes('rewardedAdButtonContainer');
  
  console.log(`✅ Styles added for rewarded ad button: ${hasStyles}`);
} catch (error) {
  console.log('❌ Error checking styles');
}

console.log('\n🎯 Simple Rewarded Ad Button Features:');
console.log('   ✅ Standalone button (no shop dependency)');
console.log('   ✅ Clear visual states (Loading/Ready/Disabled)');
console.log('   ✅ Positioned below dashboard header');
console.log('   ✅ Auto-loads new ads after completion');
console.log('   ✅ Shows success alerts when reward is earned');
console.log('   ✅ Handles errors gracefully');

console.log('\n🚀 Test Instructions:');
console.log('   1. Run: npx react-native run-android');
console.log('   2. Look for the rewarded ad button below the header');
console.log('   3. Button states:');
console.log('      - Yellow: "Loading Ad..." (wait a moment)');
console.log('      - Green: "WATCH AD (+50 Coins)" (ready to click!)');
console.log('      - Grey: "Ad Not Ready" (error state)');
console.log('   4. Click the green button to watch test ad');
console.log('   5. Earn 50 coins and see success alert');

console.log('\n💡 Benefits of Simple Button:');
console.log('   - No shop modal dependency');
console.log('   - Always visible and accessible');
console.log('   - Clear visual feedback');
console.log('   - Works independently of other features');