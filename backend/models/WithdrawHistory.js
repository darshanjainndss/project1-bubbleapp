const mongoose = require('mongoose');

const withdrawHistorySchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        index: true
    },
    userId: { // Kept for reference but not primary link
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    reward: { // Renamed from scoreEarning
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'rejected'],
        default: 'pending'
    },
    date: {
        type: Date,
        default: Date.now
    },
    createdDate: {
        type: Date,
        default: Date.now
    },
    token: {
        type: String,
        default: 'SHIB'
    },
    walletAddress: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('WithdrawHistory', withdrawHistorySchema);
