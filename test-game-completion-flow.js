const BackendService = require('./src/services/BackendService');

// Test script to verify game completion flow
async function testGameCompletionFlow() {
  console.log('🧪 Testing Game Completion Flow...');
  
  try {
    // 1. Get initial user data
    console.log('\n1. Getting initial user data...');
    const initialData = await BackendService.getUserGameData();
    console.log('Initial data:', {
      totalScore: initialData.data?.totalScore,
      totalCoins: initialData.data?.totalCoins,
      currentLevel: initialData.data?.currentLevel
    });

    // 2. Submit a test game session
    console.log('\n2. Submitting test game session...');
    const sessionData = {
      level: 1,
      score: 1500,
      moves: 20,
      stars: 3,
      duration: 120,
      abilitiesUsed: { lightning: 1, bomb: 0, freeze: 0, fire: 0 },
      bubblesDestroyed: 50,
      chainReactions: 5,
      perfectShots: 3,
      coinsEarned: 85,
      isWin: true
    };

    const sessionResult = await BackendService.submitGameSession(sessionData);
    console.log('Session result:', sessionResult);

    if (sessionResult.success) {
      console.log('Updated game data from session:', sessionResult.data.updatedGameData);
    }

    // 3. Get user data again to verify update
    console.log('\n3. Getting updated user data...');
    const updatedData = await BackendService.getUserGameData();
    console.log('Updated data:', {
      totalScore: updatedData.data?.totalScore,
      totalCoins: updatedData.data?.totalCoins,
      currentLevel: updatedData.data?.currentLevel
    });

    // 4. Compare data
    console.log('\n4. Data comparison:');
    if (initialData.data && updatedData.data) {
      console.log('Score change:', updatedData.data.totalScore - initialData.data.totalScore);
      console.log('Coins change:', updatedData.data.totalCoins - initialData.data.totalCoins);
      console.log('Level change:', updatedData.data.currentLevel - initialData.data.currentLevel);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testGameCompletionFlow();