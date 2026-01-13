const mongoose = require('mongoose');

const rewardHistorySchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        index: true
    },
    level: {
        type: Number,
        required: true
    },
    reward: { // Renamed from scoreEarning
        type: Number,
        required: true,
        default: 0
    },
    coins: {
        type: Number,
        required: true,
        default: 0
    },
    stars: { // Merged from LevelReward
        type: Number,
        default: 0
    },
    score: { // Merged from LevelReward
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['claimed', 'withdrawn'],
        default: 'claimed'
    },
    date: {
        type: Date,
        default: Date.now
    },
    createdDate: {
        type: Date,
        default: Date.now
    },
    withdrawnDate: {
        type: Date
    },
    token: {
        type: String,
        default: 'SHIB'
    }
});

// Index for faster queries using email
rewardHistorySchema.index({ email: 1, status: 1 });

module.exports = mongoose.model('RewardHistory', rewardHistorySchema);
