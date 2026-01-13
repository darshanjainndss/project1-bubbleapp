const mongoose = require('mongoose');

const gameConfigSchema = new mongoose.Schema({
    // Singleton identifier
    key: {
        type: String,
        required: true,
        default: 'default',
        unique: true
    },

    // Simple coin reward per level completion
    coinsPerLevel: {
        type: Number,
        default: 10,
        required: true
    },

    // Star thresholds for scoring
    starThresholds: {
        one: { type: Number, default: 100, required: true },
        two: { type: Number, default: 400, required: true },
        three: { type: Number, default: 800, required: true }
    },

    // Withdrawal reward calculation
    scoreRange: {
        type: Number,
        default: 100,
        required: true
    },
    rewardPerRange: {
        type: mongoose.Schema.Types.Decimal128,
        default: 1,
        required: true
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
