const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Ability = require('../models/Ability');

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

async function seedAbilities() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to MongoDB');

        console.log('\n⚡ Inserting/Updating Abilities...');
        
        let insertedCount = 0;
        let updatedCount = 0;

        for (const abilityData of abilitiesData) {
            const existingAbility = await Ability.findOne({ name: abilityData.name });
            
            if (existingAbility) {
                await Ability.findOneAndUpdate(
                    { name: abilityData.name },
                    { ...abilityData, updatedAt: new Date() },
                    { new: true }
                );
                updatedCount++;
                console.log(`   ✏️  Updated: ${abilityData.displayName} (${abilityData.name})`);
            } else {
                await Ability.create({
                    ...abilityData,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                insertedCount++;
                console.log(`   ➕ Inserted: ${abilityData.displayName} (${abilityData.name})`);
            }
        }

        console.log('\n✨ Abilities seeding completed successfully!');
        console.log('\n📊 Summary:');
        console.log(`   - New Abilities: ${insertedCount}`);
        console.log(`   - Updated Abilities: ${updatedCount}`);
        console.log(`   - Total Abilities: ${abilitiesData.length}`);

        // Show all abilities
        const allAbilities = await Ability.find({ isActive: true }).sort({ sortOrder: 1 });
        console.log('\n⚡ Active Abilities:');
        allAbilities.forEach(ability => {
            console.log(`   - ${ability.displayName}: ${ability.price} coins, ${ability.startingCount} starting count`);
        });

    } catch (error) {
        console.error('❌ Error seeding abilities:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed');
        process.exit(0);
    }
}

seedAbilities();