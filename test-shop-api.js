const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testShopAPI() {
    try {
        console.log('🧪 Testing Updated Shop API...\n');

        // Test 1: Get shop items
        console.log('1️⃣ Testing GET /api/shop');
        const response = await axios.get(`${BASE_URL}/api/shop`);
        
        if (response.data.success) {
            console.log('✅ Shop API working!');
            console.log(`📦 Found ${response.data.data.length} shop items`);
            
            // Group items by type
            const items = response.data.data;
            const bundles = items.filter(item => item.type === 'bundle');
            const subscriptions = items.filter(item => item.type === 'subscription');
            const abilities = items.filter(item => item.type === 'ability');
            
            console.log(`\n📊 Item Breakdown:`);
            console.log(`   • Bundles/Packs: ${bundles.length}`);
            console.log(`   • Subscriptions: ${subscriptions.length}`);
            console.log(`   • Individual Abilities: ${abilities.length}`);
            
            console.log(`\n🎁 Sample Items:`);
            items.slice(0, 5).forEach(item => {
                console.log(`   - ${item.displayName} (${item.type})`);
                console.log(`     💰 Coins: ${item.priceCoins} | Money: ₹${item.priceMoney}`);
                if (item.items && item.items.length > 0) {
                    console.log(`     🎯 Contains: ${item.items.map(i => `${i.quantity}x ${i.abilityName}`).join(', ')}`);
                }
                if (item.features && item.features.length > 0) {
                    console.log(`     ✨ Features: ${item.features.join(', ')}`);
                }
                console.log('');
            });
            
            // Verify no coin packs remain
            const coinPacks = items.filter(item => item.name && item.name.startsWith('coins_'));
            if (coinPacks.length === 0) {
                console.log('✅ Coin packs successfully removed from shop');
            } else {
                console.log(`⚠️  Found ${coinPacks.length} coin packs still in shop`);
            }
            
        } else {
            console.log('❌ Shop API failed:', response.data.message);
        }

    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            console.log('❌ Backend server is not running!');
            console.log('💡 Start the backend server with: cd backend && npm start');
        } else {
            console.log('❌ Error testing shop API:', error.message);
        }
    }
}

testShopAPI();