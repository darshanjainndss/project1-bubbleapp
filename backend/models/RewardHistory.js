const mongoose = require('mongoose');

const rewardHistorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    email: {
        type: String,
        required: true
    },
    level: {
        type: Number,
        required: true
    },
    scoreEarning: { // This seems to be the calculated reward value from score
        type: Number,
        required: true,
        default: 0
    },
    coins: {
        type: Number,
        required: true,
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
    }
});

// Index for faster queries
rewardHistorySchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('RewardHistory', rewardHistorySchema);
