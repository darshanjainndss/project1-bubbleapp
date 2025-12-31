/**
 * Test script to show exactly where the rewarded ad button is located
 */

const fs = require('fs');

console.log('📍 REWARDED AD BUTTON LOCATION GUIDE\n');

console.log('🎯 WHERE TO FIND THE REWARDED AD BUTTON:');
console.log('   ┌─────────────────────────────────────┐');
console.log('   │  SPACE ADVENTURE    [Coins] [Score] │');
console.log('   │  ─────────────────────────────────── │');
console.log('   │  [LEADERBOARD] [SHOP] [WATCH AD] [LOGOUT] │ ← HERE!');
console.log('   └─────────────────────────────────────┘');
console.log('');
console.log('📱 EXACT LOCATION:');
console.log('   - Screen: Main roadmap/level selection screen');
console.log('   - Position: Top header area');
console.log('   - Section: Bottom row of header buttons');
console.log('   - Button text: "WATCH AD"');
console.log('   - Color: Yellow/Gold (#FFD60A)');
console.log('   - Icon: Play circle');

// Verify the button is in the code
try {
  const roadmapContent = fs.readFileSync('src/components/Roadmap.tsx', 'utf8');
  
  const hasWatchAdButton = roadmapContent.includes('WATCH AD');
  const hasRewardedAdPress = roadmapContent.includes('onRewardedAdPress');
  const hasPlayIcon = roadmapContent.includes('play-circle-filled');
  
  console.log('\n✅ CODE VERIFICATION:');
  console.log(`   - "WATCH AD" button text: ${hasWatchAdButton}`);
  console.log(`   - onRewardedAdPress handler: ${hasRewardedAdPress}`);
  console.log(`   - Play circle icon: ${hasPlayIcon}`);
  
  if (hasWatchAdButton && hasRewardedAdPress && hasPlayIcon) {
    console.log('   🎉 Button is properly integrated!');
  }
  
} catch (error) {
  console.log('❌ Error checking code');
}

console.log('\n🚀 HOW TO TEST:');
console.log('   1. Run: npx react-native run-android');
console.log('   2. Look at the TOP of the screen');
console.log('   3. Find the header with your coins and score');
console.log('   4. Look at the bottom row of buttons');
console.log('   5. You should see: LEADERBOARD | SHOP | WATCH AD | LOGOUT');
console.log('   6. Tap the yellow "WATCH AD" button');
console.log('   7. Watch the test ad and earn 50 coins!');

console.log('\n💡 BUTTON FEATURES:');
console.log('   - Always visible in header');
console.log('   - No separate screen needed');
console.log('   - Integrated with existing UI');
console.log('   - Shows success alert when reward earned');
console.log('   - Auto-loads new ads after completion');

console.log('\n🔍 IF YOU STILL DON\'T SEE IT:');
console.log('   - Make sure you\'re on the main roadmap screen');
console.log('   - Look at the very top header area');
console.log('   - The button is between SHOP and LOGOUT');
console.log('   - It has a play icon and says "WATCH AD"');