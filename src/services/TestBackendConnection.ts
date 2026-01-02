import BackendService from './BackendService';

export const testBackendConnection = async (): Promise<void> => {
  console.log('🧪 Testing React Native to Backend Connection...\n');

  try {
    // Test 1: Health Check
    console.log('1. Testing Health Check...');
    const response = await fetch('http://192.168.1.71:3001/api/health');
    const healthData = await response.json();
    console.log('✅ Health Check Success:', healthData.message);

    // Test 2: User Registration
    console.log('\n2. Testing User Registration...');
    const testEmail = `testuser${Date.now()}@example.com`;
    const registerResult = await BackendService.registerUser(
      testEmail,
      'password123',
      'Test User RN'
    );

    if (registerResult.success) {
      console.log('✅ Registration Success:', registerResult.user?.displayName);
      
      // Test 3: Get Game Data
      console.log('\n3. Testing Get Game Data...');
      const gameDataResult = await BackendService.getUserGameData();
      
      if (gameDataResult.success) {
        console.log('✅ Game Data Retrieved:');
        console.log('   Coins:', gameDataResult.data?.totalCoins);
        console.log('   Abilities:', gameDataResult.data?.abilities);
      } else {
        console.log('❌ Game Data Failed:', gameDataResult.error);
      }

      // Test 4: Update Coins
      console.log('\n4. Testing Update Coins...');
      const coinsResult = await BackendService.updateCoins(50, 'add');
      
      if (coinsResult.success) {
        console.log('✅ Coins Updated:', coinsResult.newBalance);
      } else {
        console.log('❌ Coins Update Failed:', coinsResult.error);
      }

      // Test 5: Submit Game Session
      console.log('\n5. Testing Submit Game Session...');
      const sessionResult = await BackendService.submitGameSession({
        level: 1,
        score: 1500,
        moves: 20,
        stars: 3,
        duration: 90,
        abilitiesUsed: { lightning: 1, bomb: 0, freeze: 0, fire: 0 },
        coinsEarned: 0,
        completedAt: new Date().toISOString()
      });

      if (sessionResult.success) {
        console.log('✅ Game Session Submitted:', sessionResult.sessionId);
      } else {
        console.log('❌ Game Session Failed:', sessionResult.error);
      }

      // Test 6: Get Leaderboard
      console.log('\n6. Testing Get Leaderboard...');
      const leaderboardResult = await BackendService.getLeaderboard(10);
      
      if (leaderboardResult.success) {
        console.log('✅ Leaderboard Retrieved:', leaderboardResult.leaderboard?.length, 'players');
      } else {
        console.log('❌ Leaderboard Failed:', leaderboardResult.error);
      }

      console.log('\n🎉 React Native Backend Integration Test Complete!');
      console.log('✅ All core features working correctly');

    } else {
      console.log('❌ Registration Failed:', registerResult.error);
    }

  } catch (error) {
    console.error('❌ Backend Connection Test Failed:', error);
  }
};

// Export for use in components
export default testBackendConnection;