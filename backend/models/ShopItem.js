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

    // Ability-specific metadata (for type='ability')
    abilityMetadata: {
        effect: {
            type: String,
            enum: ['destroyRow', 'destroyNeighbors', 'freezeColumn', 'burnObstacles']
        },
        pointsPerBubble: {
            type: Number,
            min: 1
        },
        startingCount: {
            type: Number,
            default: 2,
            min: 0
        }
    },

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

// Static methods for ability queries
shopItemSchema.statics.getActiveAbilities = function () {
    return this.find({ type: 'ability', isActive: true }).sort({ sortOrder: 1, name: 1 });
};

shopItemSchema.statics.getAbilityByName = function (name) {
    return this.findOne({ name, type: 'ability', isActive: true });
};

shopItemSchema.statics.getAbilityPrice = async function (abilityName) {
    const ability = await this.findOne({ name: abilityName, type: 'ability', isActive: true });
    return ability ? ability.priceCoins : 0;
};

module.exports = mongoose.model('ShopItem', shopItemSchema);
