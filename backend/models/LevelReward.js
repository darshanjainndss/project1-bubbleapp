const mongoose = require('mongoose');

const levelRewardSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    level: {
        type: Number,
        required: true,
        min: 1
    },
    stars: {
        type: Number,
        required: true,
        min: 0,
        max: 3
    },
    coinsAwarded: {
        type: Number,
        required: true,
        default: 0
    },
    rewardClaimed: {
        type: Boolean,
        default: true
    },
    claimedAt: {
        type: Date,
        default: Date.now
    },
    score: {
        type: Number,
        default: 0
    }
});

// Compound index to ensure one reward per user per level
levelRewardSchema.index({ userId: 1, level: 1 }, { unique: true });

// Static method to calculate reward based on stars
levelRewardSchema.statics.calculateReward = function (stars) {
    if (stars === 3) return 15;
    if (stars === 2) return 10;
    return 0; // 1 star or less = no reward
};

// Static method to get user's reward history
levelRewardSchema.statics.getUserRewardHistory = async function (userId, limit = 50) {
    return this.find({ userId })
        .sort({ level: -1, claimedAt: -1 })
        .limit(limit)
        .lean();
};

// Static method to get total coins earned from level rewards
levelRewardSchema.statics.getTotalRewardCoins = async function (userId) {
    const result = await this.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        { $group: { _id: null, total: { $sum: '$coinsAwarded' } } }
    ]);
    return result.length > 0 ? result[0].total : 0;
};

module.exports = mongoose.model('LevelReward', levelRewardSchema);
