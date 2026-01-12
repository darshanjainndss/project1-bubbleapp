const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testPurchaseFlow() {
    try {
        console.log('🧪 Testing Purchase Flow...\n');

        // You'll need to replace this with a real auth token
        const authToken = 'YOUR_AUTH_TOKEN_HERE';
        
        if (authToken === 'YOUR_AUTH_TOKEN_HERE') {
            console.log('❌ Please set a real auth token in the script');
            console.log('💡 You can get one by logging into the app and checking the network requests');
            return;
        }

        // Test 1: Get shop items
        console.log('1️⃣ Getting shop items...');
        const shopResponse = await axios.get(`${BASE_URL}/api/shop`);
        
        if (!shopResponse.data.success) {
            console.log('❌ Failed to get shop items');
            return;
        }

        const abilityItems = shopResponse.data.data.filter(item => item.type === 'ability');
        if (abilityItems.length === 0) {
            console.log('❌ No ability items found in shop');
            return;
        }

        const testItem = abilityItems[0]; // Get first ability item
        console.log(`✅ Found test item: ${testItem.displayName} (${testItem.priceCoins} coins)`);

        // Test 2: Get user data before purchase
        console.log('\n2️⃣ Getting user data before purchase...');
        const userResponse = await axios.get(`${BASE_URL}/api/user/game-data`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (!userResponse.data.success) {
            console.log('❌ Failed to get user data');
            return;
        }

        const beforeCoins = userResponse.data.data.totalCoins;
        const beforeAbilities = userResponse.data.data.abilities || {};
        console.log(`✅ Before purchase - Coins: ${beforeCoins}`);
        console.log(`✅ Before purchase - Abilities:`, beforeAbilities);

        // Test 3: Make purchase
        console.log('\n3️⃣ Making purchase...');
        const purchaseResponse = await axios.post(`${BASE_URL}/api/shop/purchase`, {
            itemId: testItem._id,
            paymentMethod: 'coins'
        }, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (!purchaseResponse.data.success) {
            console.log('❌ Purchase failed:', purchaseResponse.data.message);
            return;
        }

        console.log('✅ Purchase successful!');
        console.log('📊 Purchase result:', purchaseResponse.data);

        // Test 4: Get user data after purchase
        console.log('\n4️⃣ Getting user data after purchase...');
        const afterResponse = await axios.get(`${BASE_URL}/api/user/game-data`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (!afterResponse.data.success) {
            console.log('❌ Failed to get user data after purchase');
            return;
        }

        const afterCoins = afterResponse.data.data.totalCoins;
        const afterAbilities = afterResponse.data.data.abilities || {};
        console.log(`✅ After purchase - Coins: ${afterCoins} (spent: ${beforeCoins - afterCoins})`);
        console.log(`✅ After purchase - Abilities:`, afterAbilities);

        // Test 5: Verify changes
        console.log('\n5️⃣ Verifying changes...');
        const coinsSpent = beforeCoins - afterCoins;
        if (coinsSpent === testItem.priceCoins) {
            console.log('✅ Coins correctly deducted');
        } else {
            console.log(`❌ Coin deduction mismatch. Expected: ${testItem.priceCoins}, Actual: ${coinsSpent}`);
        }

        // Check if abilities increased
        const abilityName = testItem.items[0].abilityName;
        const beforeCount = beforeAbilities[abilityName] || 0;
        const afterCount = afterAbilities[abilityName] || 0;
        const expectedIncrease = testItem.items[0].quantity;

        if (afterCount === beforeCount + expectedIncrease) {
            console.log(`✅ ${abilityName} ability correctly increased by ${expectedIncrease}`);
        } else {
            console.log(`❌ ${abilityName} ability increase mismatch. Before: ${beforeCount}, After: ${afterCount}, Expected increase: ${expectedIncrease}`);
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

testPurchaseFlow();