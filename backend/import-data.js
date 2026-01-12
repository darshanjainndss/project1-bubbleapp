const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function importData() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        console.log('📍 URI:', process.env.MONGODB_URI);

        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to MongoDB\n');

        // Read JSON files
        const abilitiesPath = path.join(__dirname, 'data', 'abilities.json');
        const shopItemsPath = path.join(__dirname, 'data', 'shopitems.json');

        console.log('📖 Reading abilities.json...');
        const abilitiesData = JSON.parse(fs.readFileSync(abilitiesPath, 'utf8'));

        console.log('📖 Reading shopitems.json...');
        const shopItemsData = JSON.parse(fs.readFileSync(shopItemsPath, 'utf8'));

        // Get collections
        const db = mongoose.connection.db;
        const abilitiesCollection = db.collection('abilities');
        const shopItemsCollection = db.collection('shopitems');

        // Drop existing collections
        console.log('\n🗑️  Dropping existing collections...');
        try {
            await abilitiesCollection.drop();
            console.log('   - Dropped abilities collection');
        } catch (err) {
            console.log('   - Abilities collection does not exist (OK)');
        }

        try {
            await shopItemsCollection.drop();
            console.log('   - Dropped shopitems collection');
        } catch (err) {
            console.log('   - ShopItems collection does not exist (OK)');
        }

        // Insert abilities
        console.log('\n📦 Inserting abilities...');
        const abilitiesResult = await abilitiesCollection.insertMany(abilitiesData);
        console.log(`✅ Inserted ${abilitiesResult.insertedCount} abilities:`);
        abilitiesData.forEach(ability => {
            console.log(`   - ${ability.displayName} (${ability.name}) - Price: ${ability.price} coins`);
        });

        // Insert shop items
        console.log('\n🛒 Inserting shop items...');
        const shopItemsResult = await shopItemsCollection.insertMany(shopItemsData);
        console.log(`✅ Inserted ${shopItemsResult.insertedCount} shop items:`);

        // Group by type
        const bundles = shopItemsData.filter(item => item.type === 'bundle');
        const subscriptions = shopItemsData.filter(item => item.type === 'subscription');
        const abilities = shopItemsData.filter(item => item.type === 'ability');

        console.log(`\n   📦 Bundles (${bundles.length}):`);
        bundles.forEach(item => {
            console.log(`      - ${item.displayName} | Coins: ${item.priceCoins} | Money: ₹${item.priceMoney}`);
        });

        console.log(`\n   🔒 Subscriptions (${subscriptions.length}):`);
        subscriptions.forEach(item => {
            console.log(`      - ${item.displayName} | Money: ₹${item.priceMoney} | Days: ${item.subscriptionDays}`);
        });

        console.log(`\n   ⚡ Abilities (${abilities.length}):`);
        abilities.forEach(item => {
            console.log(`      - ${item.displayName} | Coins: ${item.priceCoins}`);
        });

        console.log('\n✨ Data import completed successfully!');
        console.log('\n📊 Summary:');
        console.log(`   - Abilities Collection: ${abilitiesResult.insertedCount} documents`);
        console.log(`   - ShopItems Collection: ${shopItemsResult.insertedCount} documents`);
        console.log(`     • Bundles: ${bundles.length}`);
        console.log(`     • Subscriptions: ${subscriptions.length}`);
        console.log(`     • Individual Abilities: ${abilities.length}`);

    } catch (error) {
        console.error('❌ Error importing data:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed');
        process.exit(0);
    }
}

// Run the import
importData();
