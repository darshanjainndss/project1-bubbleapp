const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const ShopItem = require('../models/ShopItem');

async function cleanupCoinPacks() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to MongoDB');

        console.log('\n🗑️ Removing coin pack items from shop...');
        
        const coinPackNames = ['coins_small', 'coins_medium', 'coins_large'];
        
        const result = await ShopItem.deleteMany({
            name: { $in: coinPackNames }
        });

        console.log(`✅ Removed ${result.deletedCount} coin pack items`);
        
        // Show remaining items
        const remainingItems = await ShopItem.find({ isActive: true }).sort({ sortOrder: 1 });
        console.log(`\n📦 Remaining shop items: ${remainingItems.length}`);
        
        const bundles = remainingItems.filter(item => item.type === 'bundle');
        const subscriptions = remainingItems.filter(item => item.type === 'subscription');
        const abilities = remainingItems.filter(item => item.type === 'ability');
        
        console.log(`   • Bundles/Packs: ${bundles.length}`);
        console.log(`   • Subscriptions: ${subscriptions.length}`);
        console.log(`   • Individual Abilities: ${abilities.length}`);

    } catch (error) {
        console.error('❌ Error cleaning up coin packs:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed');
        process.exit(0);
    }
}

cleanupCoinPacks();