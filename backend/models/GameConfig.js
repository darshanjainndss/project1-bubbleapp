const mongoose = require('mongoose');

const gameConfigSchema = new mongoose.Schema({
    // Singleton identifier
    key: {
        type: String,
        required: true,
        default: 'default',
        unique: true
    },

    // Winning Rewards Configuration
    winningRewards: {
        baseCoins: {
            type: Number,
            default: 10
        },
        coinsPerLevelMultiplier: {
            type: Number,
            default: 2.5
        },
        starBonusBase: {
            type: Number,
            default: 5
        },
        starBonusLevelMultiplier: {
            type: Number,
            default: 0.5
        },
        completionBonusMultiplier: {
            type: Number,
            default: 1.2
        }
    },

    // Metadata
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt field before saving
gameConfigSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// Static methods
gameConfigSchema.statics.getConfig = async function () {
    let config = await this.findOne({ key: 'default' });

    if (!config) {
        // Create default config if it doesn't exist
        config = await this.create({
            key: 'default',
            winningRewards: {
                baseCoins: 10,
                coinsPerLevelMultiplier: 2.5,
                starBonusBase: 5,
                starBonusLevelMultiplier: 0.5,
                completionBonusMultiplier: 1.2
            }
        });
        console.log('🌱 Application: Auto-seeded default GameConfig');
    }

    return config;
};

module.exports = mongoose.model('GameConfig', gameConfigSchema);
