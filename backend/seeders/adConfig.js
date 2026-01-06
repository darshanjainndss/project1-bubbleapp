const mongoose = require('mongoose');
const AdConfig = require('../models/AdConfig');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const adConfigs = [
    {
        platform: 'android',
        appId: 'ca-app-pub-3940256099942544~3347511713', // Test App ID
        maxAdContentRating: 'G',
        tagForUnderAgeOfConsent: false,
        tagForChildDirectedTreatment: false
    },
    {
        platform: 'ios',
        appId: 'ca-app-pub-3940256099942544~1458002511', // Test App ID
        maxAdContentRating: 'G',
        tagForUnderAgeOfConsent: false,
        tagForChildDirectedTreatment: false
    }
];

async function seedAdConfig() {
    try {
        console.log('🌱 Seeding AdConfig...');

        // Clear existing config
        await AdConfig.deleteMany({});
        console.log('🗑️ Cleared existing AdConfig');

        // Insert new config
        const createdConfigs = await AdConfig.insertMany(adConfigs);
        const rewardAmount = process.env.REWARDED_AD_COINS || 50;
        console.log(`✅ Created ${createdConfigs.length} ad configurations with ${rewardAmount} coins reward (from environment)`);

        return createdConfigs;
    } catch (error) {
        console.error('❌ Error seeding AdConfig:', error);
        throw error;
    }
}

module.exports = { seedAdConfig, adConfigs };

if (require.main === module) {
    require('dotenv').config();

    mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
        .then(async () => {
            console.log('✅ Connected to MongoDB');
            await seedAdConfig();
            console.log('🎉 AdConfig seeding completed!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ MongoDB connection error:', error);
            process.exit(1);
        });
}