const mongoose = require('mongoose');
const Ability = require('../models/Ability');
const AdConfig = require('../models/AdConfig');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Abilities seed data
const abilitiesData = [
  {
    name: 'lightning',
    displayName: 'Lightning',
    description: 'Destroys an entire row of bubbles',
    icon: 'lightning-bolt',
    effect: 'destroyRow',
    pointsPerBubble: 15,
    price: 50,
    startingCount: 2,
    sortOrder: 1
  },
  {
    name: 'bomb',
    displayName: 'Bomb',
    description: 'Destroys bubbles in a hexagonal area',
    icon: 'bomb',
    effect: 'destroyNeighbors',
    pointsPerBubble: 12,
    price: 75,
    startingCount: 2,
    sortOrder: 2
  },
  {
    name: 'freeze',
    displayName: 'Freeze',
    description: 'Freezes a column of bubbles',
    icon: 'snowflake',
    effect: 'freezeColumn',
    pointsPerBubble: 8,
    price: 30,
    startingCount: 2,
    sortOrder: 3
  },
  {
    name: 'fire',
    displayName: 'Fire',
    description: 'Burns through obstacles and metal grids',
    icon: 'fire',
    effect: 'burnObstacles',
    pointsPerBubble: 12,
    price: 40,
    startingCount: 2,
    sortOrder: 4
  }
];

// Ad configuration seed data
const adConfigData = [
  {
    platform: 'android',
    appId: 'ca-app-pub-3940256099942544~3347511713',
    bannerAdUnitId: {
      production: 'ca-app-pub-3940256099942544/6300978111',
      test: 'ca-app-pub-3940256099942544/6300978111'
    },
    rewardedAdUnitId: {
      production: 'ca-app-pub-3940256099942544/5224354917',
      test: 'ca-app-pub-3940256099942544/5224354917'
    },
    interstitialAdUnitId: {
      production: 'ca-app-pub-3940256099942544/1033173712',
      test: 'ca-app-pub-3940256099942544/1033173712'
    },
    maxAdContentRating: 'G',
    tagForUnderAgeOfConsent: false,
    tagForChildDirectedTreatment: false,
    rewardConfig: {
      coinsPerAd: 25,
      abilitiesPerAd: 1
    }
  },
  {
    platform: 'ios',
    appId: 'ca-app-pub-3940256099942544~1458002511',
    bannerAdUnitId: {
      production: 'ca-app-pub-3940256099942544/2934735716',
      test: 'ca-app-pub-3940256099942544/2934735716'
    },
    rewardedAdUnitId: {
      production: 'ca-app-pub-3940256099942544/1712485313',
      test: 'ca-app-pub-3940256099942544/1712485313'
    },
    interstitialAdUnitId: {
      production: 'ca-app-pub-3940256099942544/4411468910',
      test: 'ca-app-pub-3940256099942544/4411468910'
    },
    maxAdContentRating: 'G',
    tagForUnderAgeOfConsent: false,
    tagForChildDirectedTreatment: false,
    rewardConfig: {
      coinsPerAd: 25,
      abilitiesPerAd: 1
    }
  }
];

const seedGameConfig = async () => {
  try {
    console.log('🌱 Starting game configuration seeding...');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bubble-shooter');
    console.log('✅ Connected to MongoDB');

    // Seed Abilities
    console.log('🔥 Seeding abilities...');

    // Clear existing abilities
    await Ability.deleteMany({});
    console.log('🗑️  Cleared existing abilities');

    // Insert new abilities
    const createdAbilities = await Ability.insertMany(abilitiesData);
    console.log(`✅ Created ${createdAbilities.length} abilities:`);
    createdAbilities.forEach(ability => {
      console.log(`   - ${ability.displayName} (${ability.name}): ${ability.price} coins`);
    });

    // Seed Ad Configuration
    console.log('📱 Seeding ad configuration...');

    // Clear existing ad configs
    await AdConfig.deleteMany({});
    console.log('🗑️  Cleared existing ad configurations');

    // Insert new ad configs
    const createdAdConfigs = await AdConfig.insertMany(adConfigData);
    console.log(`✅ Created ${createdAdConfigs.length} ad configurations:`);
    createdAdConfigs.forEach(config => {
      console.log(`   - ${config.platform}: App ID ${config.appId}`);
    });

    console.log('🎉 Game configuration seeding completed successfully!');

    // Display summary
    console.log('\n📊 SEEDING SUMMARY:');
    console.log('==================');
    console.log(`Abilities: ${createdAbilities.length}`);
    console.log(`Ad Configs: ${createdAdConfigs.length}`);
    console.log('\n🚀 Your game is now configured with backend-driven abilities and ads!');

  } catch (error) {
    console.error('❌ Error seeding game configuration:', error);
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
  seedGameConfig();
}

module.exports = { seedGameConfig, abilitiesData, adConfigData };