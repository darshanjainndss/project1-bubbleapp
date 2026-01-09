const mongoose = require('mongoose');

const adUnitSchema = new mongoose.Schema({
    adId: {
        type: String,
        required: true
    },
    adType: {
        type: String,
        required: true,
        enum: ['banner', 'rewarded']
    },
    platform: {
        type: String,
        required: true,
        enum: ['android', 'ios']
    },
    priority: {
        type: Number,
        required: true,
        default: 1
    },
    isActive: {
        type: Boolean,
        required: true,
        default: true
    },
    rewardedAmount: {
        type: Number,
        default: 50
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt field before saving
adUnitSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// Static method to get the best ad unit for a platform and type
adUnitSchema.statics.getAdId = function (platform, adType) {
    return this.findOne({
        platform,
        adType,
        isActive: true
    }).sort({ priority: 1 }); // Lowest number = highest priority
};

module.exports = mongoose.model('AdUnit', adUnitSchema);
