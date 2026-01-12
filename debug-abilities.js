const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function debugAbilities() {
    try {
        console.log('🔍 Debug Abilities Check...\n');

        // You'll need to replace this with a real auth token
        const authToken = 'YOUR_AUTH_TOKEN_HERE';
        
        if (authToken === 'YOUR_AUTH_TOKEN_HERE') {
            console.log('❌ Please set a real auth token in the script');
            console.log('💡 You can get one by:');
            console.log('   1. Open the app and login');
            console.log('   2. Open browser dev tools > Network tab');
            console.log('   3. Make any API call and copy the Authorization header');
            return;
        }

        // Test 1: Check shop items
        console.log('1️⃣ Checking shop items...');
        const shopResponse = await axios.get(`${BASE_URL}/api/shop`);
        
        if (shopResponse.data.success) {
            const items = shopResponse.data.data;
            const abilityItems = items.filter(item => item.type === 'ability');
            console.log(`✅ Found ${abilityItems.length} ability items in shop:`);
            abilityItems.forEach(item => {
                console.log(`   - ${item.displayName}: ${item.priceCoins} coins`);
                if (item.items && item.items.length > 0) {
                    console.log(`     Contains: ${item.items.map(i => `${i.quantity}x ${i.abilityName}`).join(', ')}`);
                }
            });
        } else {
            console.log('❌ Failed to get shop items');
        }

        // Test 2: Check user abilities
        console.log('\n2️⃣ Checking user abilities...');
        const debugResponse = await axios.get(`${BASE_URL}/api/user/debug-abilities`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (debugResponse.data.success) {
            const data = debugResponse.data.data;
            console.log('✅ User debug info:');
            console.log(`   - User ID: ${data.userId}`);
            console.log(`   - Email: ${data.email}`);
            console.log(`   - Total Coins: ${data.totalCoins}`);
            console.log(`   - Current Level: ${data.currentLevel}`);
            console.log(`   - Abilities Map Size: ${data.abilitiesMapSize}`);
            console.log(`   - Abilities:`, data.abilities);
        } else {
            console.log('❌ Failed to get user debug info');
        }

        // Test 3: Check regular user game data
        console.log('\n3️⃣ Checking regular user game data...');
        const gameDataResponse = await axios.get(`${BASE_URL}/api/user/game-data`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (gameDataResponse.data.success) {
            const data = gameDataResponse.data.data;
            console.log('✅ Game data:');
            console.log(`   - Total Coins: ${data.totalCoins}`);
            console.log(`   - Current Level: ${data.currentLevel}`);
            console.log(`   - Abilities:`, data.abilities);
        } else {
            console.log('❌ Failed to get game data');
        }

    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            console.log('❌ Backend server is not running!');
            console.log('💡 Start the backend server with: cd backend && npm start');
        } else if (error.response) {
            console.log('❌ API Error:', error.response.status, error.response.data);
        } else {
            console.log('❌ Error:', error.message);
        }
    }
}

debugAbilities();