const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { seedAbilities } = require('./abilities');
const { seedAdUnits } = require('./seedAdUnits');
const { seedAdConfig } = require('./adConfig');

async function seedAll() {
    try {
        console.log('🚀 Starting Master Seeder...');

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to MongoDB');

        // Run seeders sequentially
        await seedAbilities();
        await seedAdConfig();

        // seedAdUnits handle its own connection usually, but we can call the logic if we export it properly
        // Looking at seedAdUnits.js, it clears and inserts. 
        // Wait, seedAdUnits.js exports { seedAdUnits, adUnitsData } but it also has its own connection logic.
        // I should probably refactor seedAdUnits to be more modular or just call it.

        const AdUnit = require('../models/AdUnit');
        const { adUnitsData } = require('./seedAdUnits');

        console.log('🌱 Seeding AdUnits...');
        await AdUnit.deleteMany({});
        await AdUnit.insertMany(adUnitsData);
        console.log(`✅ Created ${adUnitsData.length} ad units`);

        console.log('🎉 Master Seeding completed successfully!');
    } catch (error) {
        console.error('❌ Error during master seeding:', error);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
        process.exit(0);
    }
}

seedAll();
