const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const ShopItem = require('../models/ShopItem');

// Enhanced shop items data with better icons and descriptions
const shopItemsData = [
    // ===== PREMIUM BUNDLES =====
    {
        name: 'combo_lightning_10',
        displayName: 'Lightning Storm Pack',
        description: '⚡ 10 Lightning abilities to dominate any level! Strike with power!',
        type: 'bundle',
        icon: 'flash',
        color: '#FFD700',
        priceCoins: 200,
        priceMoney: 99,
        currency: 'INR',
        items: [{ abilityName: 'lightning', quantity: 10 }],
        isActive: true,
        sortOrder: 1
    },
    {
        name: 'combo_bomb_10',
        displayName: 'Explosive Arsenal',
        description: '💣 10 Bomb abilities for maximum destruction! Clear the field!',
        type: 'bundle',
        icon: 'bomb',
        color: '#FF4444',
        priceCoins: 300,
        priceMoney: 149,
        currency: 'INR',
        items: [{ abilityName: 'bomb', quantity: 10 }],
        isActive: true,
        sortOrder: 2
    },
    {
        name: 'combo_freeze_10',
        displayName: 'Ice Age Pack',
        description: '❄️ 10 Freeze abilities to control the battlefield! Time stops for you!',
        type: 'bundle',
        icon: 'snowflake',
        color: '#00BFFF',
        priceCoins: 180,
        priceMoney: 89,
        currency: 'INR',
        items: [{ abilityName: 'freeze', quantity: 10 }],
        isActive: true,
        sortOrder: 3
    },
    {
        name: 'combo_fire_10',
        displayName: 'Inferno Collection',
        description: '🔥 10 Fire abilities to burn through any obstacle! Unstoppable force!',
        type: 'bundle',
        icon: 'fire',
        color: '#FF6600',
        priceCoins: 220,
        priceMoney: 109,
        currency: 'INR',
        items: [{ abilityName: 'fire', quantity: 10 }],
        isActive: true,
        sortOrder: 4
    },
    {
        name: 'combo_all_abilities',
        displayName: 'Ultimate Power Pack',
        description: '🌟 5 of each ability! Lightning, Bomb, Freeze & Fire - Complete arsenal!',
        type: 'bundle',
        icon: 'star',
        color: '#FF00FF',
        priceCoins: 500,
        priceMoney: 249,
        currency: 'INR',
        items: [
            { abilityName: 'lightning', quantity: 5 },
            { abilityName: 'bomb', quantity: 5 },
            { abilityName: 'freeze', quantity: 5 },
            { abilityName: 'fire', quantity: 5 }
        ],
        isActive: true,
        sortOrder: 5
    },
    {
        name: 'combo_starter_pack',
        displayName: 'Beginner\'s Boost',
        description: '🎯 Perfect starter combo: 3 Lightning + 3 Freeze abilities!',
        type: 'bundle',
        icon: 'gift',
        color: '#00FFAA',
        priceCoins: 150,
        priceMoney: 75,
        currency: 'INR',
        items: [
            { abilityName: 'lightning', quantity: 3 },
            { abilityName: 'freeze', quantity: 3 }
        ],
        isActive: true,
        sortOrder: 6
    },
    {
        name: 'combo_mega_pack',
        displayName: 'Mega Power Bundle',
        description: '💎 20 Lightning + 15 Bomb + 15 Freeze + 10 Fire - Ultimate value!',
        type: 'bundle',
        icon: 'diamond',
        color: '#9932CC',
        priceCoins: 800,
        priceMoney: 399,
        currency: 'INR',
        items: [
            { abilityName: 'lightning', quantity: 20 },
            { abilityName: 'bomb', quantity: 15 },
            { abilityName: 'freeze', quantity: 15 },
            { abilityName: 'fire', quantity: 10 }
        ],
        isActive: true,
        sortOrder: 7
    },

    // ===== PREMIUM SUBSCRIPTIONS =====
    {
        name: 'sub_1_week',
        displayName: 'Pro Week Pass',
        description: '👑 7 days of ad-free gaming + daily coin bonus!',
        type: 'subscription',
        icon: 'calendar-outline',
        color: '#00FF88',
        priceCoins: 0,
        priceMoney: 149,
        currency: 'INR',
        subscriptionDays: 7,
        features: ['No Ads', 'Daily 50 Coin Bonus'],
        isActive: true,
        sortOrder: 10
    },
    {
        name: 'sub_1_month',
        displayName: 'Elite Monthly VIP',
        description: '🏆 30 days premium: No ads + daily bonus + 2x coin rewards!',
        type: 'subscription',
        icon: 'crown',
        color: '#FFD700',
        priceCoins: 0,
        priceMoney: 499,
        currency: 'INR',
        subscriptionDays: 30,
        features: ['No Ads', 'Daily 100 Coin Bonus', '2x Coin Rewards', 'Exclusive Themes'],
        isActive: true,
        sortOrder: 11
    },
    {
        name: 'sub_3_months',
        displayName: 'Champion Season Pass',
        description: '🎖️ 90 days ultimate experience + exclusive rewards!',
        type: 'subscription',
        icon: 'trophy',
        color: '#FF4500',
        priceCoins: 0,
        priceMoney: 1299,
        currency: 'INR',
        subscriptionDays: 90,
        features: ['No Ads', 'Daily 150 Coin Bonus', '3x Coin Rewards', 'All Themes', 'Priority Support'],
        isActive: true,
        sortOrder: 12
    },

    // ===== INDIVIDUAL ABILITIES =====
    {
        name: 'ability_lightning',
        displayName: 'Lightning Strike',
        description: '⚡ Destroys an entire row of bubbles instantly!',
        type: 'ability',
        icon: 'flash',
        color: '#00E0FF',
        priceCoins: 58,
        priceMoney: 0,
        currency: 'INR',
        items: [{ abilityName: 'lightning', quantity: 1 }],
        isActive: true,
        sortOrder: 20
    },
    {
        name: 'ability_bomb',
        displayName: 'Explosive Bomb',
        description: '💣 Destroys 6 neighboring bubbles with explosive power!',
        type: 'ability',
        icon: 'bomb',
        color: '#FF4444',
        priceCoins: 75,
        priceMoney: 0,
        currency: 'INR',
        items: [{ abilityName: 'bomb', quantity: 1 }],
        isActive: true,
        sortOrder: 21
    },
    {
        name: 'ability_freeze',
        displayName: 'Ice Freeze',
        description: '❄️ Freezes a column for precise targeting!',
        type: 'ability',
        icon: 'snowflake',
        color: '#00FFFF',
        priceCoins: 30,
        priceMoney: 0,
        currency: 'INR',
        items: [{ abilityName: 'freeze', quantity: 1 }],
        isActive: true,
        sortOrder: 22
    },
    {
        name: 'ability_fire',
        displayName: 'Blazing Fire',
        description: '🔥 Burns through obstacles and metal bubbles!',
        type: 'ability',
        icon: 'fire',
        color: '#FF6600',
        priceCoins: 40,
        priceMoney: 0,
        currency: 'INR',
        items: [{ abilityName: 'fire', quantity: 1 }],
        isActive: true,
        sortOrder: 23
    }
];

async function insertShopItems() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to MongoDB');

        console.log('\n🛒 Inserting/Updating Shop Items...');
        
        let insertedCount = 0;
        let updatedCount = 0;

        for (const itemData of shopItemsData) {
            const existingItem = await ShopItem.findOne({ name: itemData.name });
            
            if (existingItem) {
                await ShopItem.findOneAndUpdate(
                    { name: itemData.name },
                    { ...itemData, updatedAt: new Date() },
                    { new: true }
                );
                updatedCount++;
                console.log(`   ✏️  Updated: ${itemData.displayName}`);
            } else {
                await ShopItem.create({
                    ...itemData,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                insertedCount++;
                console.log(`   ➕ Inserted: ${itemData.displayName}`);
            }
        }

        console.log('\n✨ Shop items insertion completed successfully!');
        console.log('\n📊 Summary:');
        console.log(`   - New Items: ${insertedCount}`);
        console.log(`   - Updated Items: ${updatedCount}`);
        console.log(`   - Total Items: ${shopItemsData.length}`);

        // Group by type for display
        const bundles = shopItemsData.filter(item => item.type === 'bundle');
        const subscriptions = shopItemsData.filter(item => item.type === 'subscription');
        const abilities = shopItemsData.filter(item => item.type === 'ability');

        console.log(`\n📦 Item Breakdown:`);
        console.log(`   • Bundles/Packs: ${bundles.length}`);
        console.log(`   • Subscriptions: ${subscriptions.length}`);
        console.log(`   • Individual Abilities: ${abilities.length}`);

    } catch (error) {
        console.error('❌ Error inserting shop items:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed');
        process.exit(0);
    }
}

// Run the insertion
insertShopItems();