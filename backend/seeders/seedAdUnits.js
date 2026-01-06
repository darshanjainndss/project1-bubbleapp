const mongoose = require('mongoose');
const AdUnit = require('../models/AdUnit');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const adUnitsData = [
    {
        adId: "ca-app-pub-3940256099942544/2934735716", // Test Banner (iOS)
        adType: "banner",
        platform: "ios",
        priority: 1,
        isActive: true
    },
    {
        adId: "ca-app-pub-3940256099942544/1712485313", // Test Rewarded (iOS)
        adType: "rewarded",
        platform: "ios",
        priority: 1,
        isActive: true
    },
    {
        adId: "ca-app-pub-3940256099942544/6300978111", // Test Banner (Android)
        adType: "banner",
        platform: "android",
        priority: 1,
        isActive: true
    },
    {
        adId: "ca-app-pub-3940256099942544/5224354917", // Test Rewarded (Android)
        adType: "rewarded",
        platform: "android",
        priority: 1,
        isActive: true
    }
];

const seedAdUnits = async () => {
    try {
        console.log('🌱 Starting ad units seeding...');

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bubble-shooter');
        console.log('✅ Connected to MongoDB');

        // Clear existing ad units
        await AdUnit.deleteMany({});
        console.log('🗑️  Cleared existing ad units');

        // Insert new ad units
        const createdAdUnits = await AdUnit.insertMany(adUnitsData);
        console.log(`✅ Created ${createdAdUnits.length} ad units`);

        console.log('🎉 Ad units seeding completed successfully!');

    } catch (error) {
        console.error('❌ Error seeding ad units:', error);
        process.exit(1);
    } finally {
        // Close the connection
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
        process.exit(0);
    }
};

// Run the seeder if this file is executed directly
if (require.main === module) {
    seedAdUnits();
}

module.exports = { seedAdUnits, adUnitsData };
