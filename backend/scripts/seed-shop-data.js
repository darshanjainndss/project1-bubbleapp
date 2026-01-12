const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const ShopItem = require('../models/ShopItem');
const Ability = require('../models/Ability');

// Shop Items Data
const shopItemsData = [
    // ===== COMBOS/BUNDLES =====
    {
        name: 'combo_lightning_10',
        displayName: 'Lightning Pack (10x)',
        description: 'Get 10 Lightning abilities to blast through levels!',
        type: 'bundle',
        icon: 'flash-on',
        color: '#FFD600',
        priceCoins: 200,
        priceMoney: 100,
        currency: 'INR',
        items: [{ abilityName: 'lightning', quantity: 10 }],
        isActive: true,
        sortOrder: 1
    },
    {
        name: 'combo_bomb_10',
        displayName: 'Bomb Pack (10x)',
        description: 'Get 10 Bomb abilities for massive destruction!',
        type: 'bundle',
        icon: 'dangerous',
        color: '#FF4444',
        priceCoins: 300,
        priceMoney: 150,
        currency: 'INR',
        items: [{ abilityName: 'bomb', quantity: 10 }],
        isActive: true,
        sortOrder: 2
    },
    {
        name: 'combo_all_abilities',
        displayName: 'Ultimate Combo',
        description: '5 of each ability: Lightning, Bomb, Freeze, and Fire!',
        type: 'bundle',
        icon: 'layers',
        color: '#FF00FF',
        priceCoins: 500,
        priceMoney: 250,
        currency: 'INR',
        items: [
            { abilityName: 'lightning', quantity: 5 },
            { abilityName: 'bomb', quantity: 5 },
            { abilityName: 'freeze', quantity: 5 },
            { abilityName: 'fire', quantity: 5 }
        ],
        isActive: true,
        sortOrder: 3
    },
    {
        name: 'combo_starter_pack',
        displayName: 'Starter Pack',
        description: '3 Lightning + 3 Freeze abilities for beginners!',
        type: 'bundle',
        icon: 'card-giftcard',
        color: '#00FFFF',
        priceCoins: 150,
        priceMoney: 75,
        currency: 'INR',
        items: [
            { abilityName: 'lightning', quantity: 3 },
            { abilityName: 'freeze', quantity: 3 }
        ],
        isActive: true,
        sortOrder: 4
    },

    // ===== SUBSCRIPTIONS =====
    {
        name: 'sub_1_week',
        displayName: 'Pro Week',
        description: 'Enjoy 1 week of maintenance-free gaming with NO ADS!',
        type: 'subscription',
        icon: 'calendar-today',
        color: '#00FF88',
        priceCoins: 0,
        priceMoney: 150,
        currency: 'INR',
        subscriptionDays: 7,
        features: ['No Ads'],
        isActive: true,
        sortOrder: 10
    },
    {
        name: 'sub_1_month',
        displayName: 'Elite Month',
        description: 'Ultimate 1 month subscription with NO ADS and daily bonus!',
        type: 'subscription',
        icon: 'stars',
        color: '#FFD700',
        priceCoins: 0,
        priceMoney: 499,
        currency: 'INR',
        subscriptionDays: 30,
        features: ['No Ads', 'Daily Bonus', '2x Coin Rewards'],
        isActive: true,
        sortOrder: 11
    },

    // ===== INDIVIDUAL ABILITIES =====
    {
        name: 'ability_lightning',
        displayName: 'Lightning',
        description: 'Destroys an entire row of bubbles',
        type: 'ability',
        icon: 'flash-on',
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
        displayName: 'Bomb',
        description: 'Destroys 6 neighboring bubbles',
        type: 'ability',
        icon: 'dangerous',
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
        displayName: 'Freeze',
        description: 'Freezes a column for easier targeting',
        type: 'ability',
        icon: 'ac-unit',
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
        displayName: 'Fire',
        description: 'Burns through obstacles and metal bubbles',
        type: 'ability',
        icon: 'local-fire-department',
        color: '#FF6600',
        priceCoins: 40,
        priceMoney: 0,
        currency: 'INR',
        items: [{ abilityName: 'fire', quantity: 1 }],
        isActive: true,
        sortOrder: 23
    }
];

// Abilities Data
const abilitiesData = [
    {
        name: 'lightning',
        displayName: 'Lightning',
        description: 'Destroys an entire row of bubbles',
        icon: 'flash-on',
        effect: 'destroyRow',
        pointsPerBubble: 10,
        price: 58,
        startingCount: 2,
        sortOrder: 1,
        isActive: true
    },
    {
        name: 'bomb',
        displayName: 'Bomb',
        description: 'Destroys 6 neighboring bubbles',
        icon: 'dangerous',
        effect: 'destroyNeighbors',
        pointsPerBubble: 15,
        price: 75,
        startingCount: 2,
        sortOrder: 2,
        isActive: true
    },
    {
        name: 'freeze',
        displayName: 'Freeze',
        description: 'Freezes a column for easier targeting',
        icon: 'ac-unit',
        effect: 'freezeColumn',
        pointsPerBubble: 5,
        price: 30,
        startingCount: 2,
        sortOrder: 3,
        isActive: true
    },
    {
        name: 'fire',
        displayName: 'Fire',
        description: 'Burns through obstacles and metal bubbles',
        icon: 'local-fire-department',
        effect: 'burnObstacles',
        pointsPerBubble: 20,
        price: 40,
        startingCount: 2,
        sortOrder: 4,
        isActive: true
    }
];

async function seedData() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to MongoDB');

        // Clear existing data
        console.log('\n🗑️  Clearing existing data...');
        await ShopItem.deleteMany({});
        await Ability.deleteMany({});
        console.log('✅ Existing data cleared');

        // Insert Abilities
        console.log('\n📦 Inserting Abilities...');
        const abilities = await Ability.insertMany(abilitiesData);
        console.log(`✅ Inserted ${abilities.length} abilities:`);
        abilities.forEach(ability => {
            console.log(`   - ${ability.displayName} (${ability.name})`);
        });

        // Insert Shop Items
        console.log('\n🛒 Inserting Shop Items...');
        const shopItems = await ShopItem.insertMany(shopItemsData);
        console.log(`✅ Inserted ${shopItems.length} shop items:`);

        // Group by type
        const bundles = shopItems.filter(item => item.type === 'bundle');
        const subscriptions = shopItems.filter(item => item.type === 'subscription');
        const abilities_shop = shopItems.filter(item => item.type === 'ability');

        console.log(`\n   📦 Bundles (${bundles.length}):`);
        bundles.forEach(item => {
            console.log(`      - ${item.displayName} | Coins: ${item.priceCoins} | Money: ₹${item.priceMoney}`);
        });

        console.log(`\n   🔒 Subscriptions (${subscriptions.length}):`);
        subscriptions.forEach(item => {
            console.log(`      - ${item.displayName} | Money: ₹${item.priceMoney} | Days: ${item.subscriptionDays}`);
        });

        console.log(`\n   ⚡ Abilities (${abilities_shop.length}):`);
        abilities_shop.forEach(item => {
            console.log(`      - ${item.displayName} | Coins: ${item.priceCoins}`);
        });

        console.log('\n✨ Database seeding completed successfully!');
        console.log('\n📊 Summary:');
        console.log(`   - Abilities: ${abilities.length}`);
        console.log(`   - Shop Items: ${shopItems.length}`);
        console.log(`     • Bundles: ${bundles.length}`);
        console.log(`     • Subscriptions: ${subscriptions.length}`);
        console.log(`     • Individual Abilities: ${abilities_shop.length}`);

    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed');
        process.exit(0);
    }
}

// Run the seeding
seedData();
