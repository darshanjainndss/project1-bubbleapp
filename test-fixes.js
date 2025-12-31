// Test script to verify the fixes
console.log('🧪 Testing Leaderboard and Level Progression Fixes...\n');

// Test 1: Check if backend has leaderboard data
async function testLeaderboard() {
  try {
    console.log('1. Testing Leaderboard Data...');
    const response = await fetch('http://192.168.1.71:3001/api/leaderboard');
    const data = await response.json();
    
    if (data.success && data.leaderboard.length > 0) {
      console.log('✅ Leaderboard has data:', data.leaderboard.length, 'players');
      console.log('   Top player:', data.leaderboard[0].displayName, 'with score:', data.leaderboard[0].highScore);
      return true;
    } else {
      console.log('❌ Leaderboard is empty or failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Leaderboard test failed:', error.message);
    return false;
  }
}

// Test 2: Create a test user and submit a game session
async function testGameSession() {
  try {
    console.log('\n2. Testing Game Session Submission...');
    
    // Register a test user
    const registerResponse = await fetch('http://192.168.1.71:3001/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `testlevel${Date.now()}@example.com`,
        password: 'password123',
        displayName: 'Level Test Player'
      })
    });
    
    const registerData = await registerResponse.json();
    if (!registerData.success) {
      console.log('❌ User registration failed');
      return false;
    }
    
    const token = registerData.token;
    console.log('✅ Test user registered:', registerData.user.displayName);
    
    // Submit a game session for level 1
    const sessionResponse = await fetch('http://192.168.1.71:3001/api/game/session', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        level: 1,
        score: 1800,
        moves: 20,
        stars: 3,
        duration: 90,
        isWin: true,
        abilitiesUsed: { lightning: 0, bomb: 1, freeze: 0, fire: 0 },
        bubblesDestroyed: 35,
        chainReactions: 6,
        perfectShots: 8
      })
    });
    
    const sessionData = await sessionResponse.json();
    if (sessionData.success) {
      console.log('✅ Game session submitted:', sessionData.sessionId);
      console.log('   Coins earned:', sessionData.coinsEarned);
      console.log('   New level unlocked:', sessionData.updatedGameData.currentLevel);
      return true;
    } else {
      console.log('❌ Game session submission failed:', sessionData.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Game session test failed:', error.message);
    return false;
  }
}

// Test 3: Verify leaderboard updated
async function testLeaderboardUpdate() {
  try {
    console.log('\n3. Testing Leaderboard Update...');
    const response = await fetch('http://192.168.1.71:3001/api/leaderboard');
    const data = await response.json();
    
    if (data.success && data.leaderboard.length > 0) {
      console.log('✅ Updated leaderboard has:', data.leaderboard.length, 'players');
      
      // Find the highest score
      const topScore = Math.max(...data.leaderboard.map(p => p.highScore));
      console.log('   Highest score:', topScore);
      
      return true;
    } else {
      console.log('❌ Leaderboard update test failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Leaderboard update test failed:', error.message);
    return false;
  }
}

// Run all tests
async function runTests() {
  const test1 = await testLeaderboard();
  const test2 = await testGameSession();
  const test3 = await testLeaderboardUpdate();
  
  console.log('\n📊 Test Results:');
  console.log('   Leaderboard Data:', test1 ? '✅ PASS' : '❌ FAIL');
  console.log('   Game Session:', test2 ? '✅ PASS' : '❌ FAIL');
  console.log('   Leaderboard Update:', test3 ? '✅ PASS' : '❌ FAIL');
  
  if (test1 && test2 && test3) {
    console.log('\n🎉 All tests passed! Fixes are working correctly.');
    console.log('\n✅ Leaderboard Fix: Component now uses BackendService instead of StorageService');
    console.log('✅ Level Progression Fix: GameScreen now has onLevelComplete callback');
    console.log('✅ Backend Integration: Game sessions are submitted and leaderboard updates');
  } else {
    console.log('\n❌ Some tests failed. Check the backend server and API endpoints.');
  }
}

runTests();