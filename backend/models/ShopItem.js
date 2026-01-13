const mongoose = require('mongoose');

const shopItemSchema = new mongoose.Schema({
    // Identification
    name: {
        type: String,
        required: true,
        unique: true
    },
    displayName: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },

    // Customization
    type: {
        type: String,
        required: true,
        enum: ['ability', 'bundle', 'subscription', 'coin_pack']
    },
    icon: {
        type: String,
        required: true
    },
    color: {
        type: String,
        default: '#00E0FF'
    },

    // Pricing
    priceCoins: {
        type: Number,
        default: 0
    },
    priceMoney: {
        type: Number,
        default: 0
    },
    currency: {
        type: String,
        default: 'INR'
    },

    // Content (for bundles and abilities)
    items: [
        {
            abilityName: {
                type: String,
                enum: ['lightning', 'bomb', 'freeze', 'fire']
            },
            quantity: {
                type: Number,
                default: 1
            }
        }
    ],

    // Coin rewards (for coin packs)
    coinReward: {
        type: Number,
        default: 0
    },

    // Subscription specific
    subscriptionDays: {
        type: Number,
        default: 0
    },
    features: [String], // e.g. ["No Ads", "Daily Bonus"]

    // Metadata
    isActive: {
        type: Boolean,
        default: true
    },
    sortOrder: {
        type: Number,
        default: 0
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

shopItemSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('ShopItem', shopItemSchema);
