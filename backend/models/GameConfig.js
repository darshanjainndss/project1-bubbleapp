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

    // Score-based rewards
    scoreRange: {
        type: Number,
        default: 100
    },
    reward: {
        type: mongoose.Schema.Types.Decimal128,
        default: 1
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
    return await this.findOne({ key: 'default' });
};

module.exports = mongoose.model('GameConfig', gameConfigSchema);
