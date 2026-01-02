const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';

async function testLeaderboard() {
  console.log('🧪 Testing Leaderboard Endpoint...\n');

  try {
    // Test: Get Leaderboard
    console.log('Testing Leaderboard API...');
    const response = await axios.get(`${API_BASE_URL}/leaderboard?limit=10`);
    
    if (response.data.success) {
      console.log('✅ Leaderboard API Success');
      console.log('   Total entries:', response.data.total);
      
      if (response.data.leaderboard && response.data.leaderboard.length > 0) {
        console.log('\n📊 Sample leaderboard entries:');
        response.data.leaderboard.slice(0, 3).forEach((entry, index) => {
          console.log(`   ${index + 1}. ${entry.displayName} - ${entry.totalScore} pts (Rank: ${entry.rank})`);
        });
        
        // Check if email domains are removed
        const hasEmailDomains = response.data.leaderboard.some(entry => 
          entry.displayName.includes('@')
        );
        
        if (hasEmailDomains) {
          console.log('❌ Warning: Some entries still contain email domains');
        } else {
          console.log('✅ All email domains properly removed from display names');
        }
      } else {
        console.log('ℹ️  No leaderboard entries found (empty database)');
      }
    } else {
      console.log('❌ Leaderboard API failed:', response.data.message);
    }

  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Connection refused - make sure the backend server is running');
      console.log('   Run: npm run dev (in backend directory)');
    } else {
      console.log('❌ Error testing leaderboard:', error.message);
    }
  }
}

testLeaderboard();