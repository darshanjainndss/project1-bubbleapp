const mongoose = require('mongoose');
const Ability = require('../models/Ability');

const abilities = [
  {
    name: 'lightning',
    displayName: 'Lightning',
    description: 'Destroys an entire row of bubbles',
    icon: 'flash',
    effect: 'destroyRow',
    pointsPerBubble: 10,
    price: 58,
    startingCount: 2,
    sortOrder: 1
  },
  {
    name: 'bomb',
    displayName: 'Bomb',
    description: 'Destroys 6 neighboring bubbles',
    icon: 'bomb',
    effect: 'destroyNeighbors',
    pointsPerBubble: 15,
    price: 75,
    startingCount: 2,
    sortOrder: 2
  },
  {
    name: 'freeze',
    displayName: 'Freeze',
    description: 'Freezes a column for easier targeting',
    icon: 'snowflake',
    effect: 'freezeColumn',
    pointsPerBubble: 5,
    price: 30,
    startingCount: 2,
    sortOrder: 3
  },
  {
    name: 'fire',
    displayName: 'Fire',
    description: 'Burns through obstacles and metal bubbles',
    icon: 'fire',
    effect: 'burnObstacles',
    pointsPerBubble: 20,
    price: 40,
    startingCount: 2,
    sortOrder: 4
  }
];

async function seedAbilities() {
  try {
    console.log('🌱 Seeding abilities...');
    
    // Clear existing abilities
    await Ability.deleteMany({});
    console.log('🗑️ Cleared existing abilities');
    
    // Insert new abilities
    const createdAbilities = await Ability.insertMany(abilities);
    console.log(`✅ Created ${createdAbilities.length} abilities:`);
    
    createdAbilities.forEach(ability => {
      console.log(`   - ${ability.displayName} (${ability.name}): ${ability.price} coins`);
    });
    
    return createdAbilities;
  } catch (error) {
    console.error('❌ Error seeding abilities:', error);
    throw error;
  }
}

module.exports = { seedAbilities, abilities };

// Run seeder if called directly
if (require.main === module) {
  require('dotenv').config();
  
  mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log('✅ Connected to MongoDB');
    await seedAbilities();
    console.log('🎉 Abilities seeding completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  });
}