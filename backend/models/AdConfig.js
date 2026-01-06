const mongoose = require('mongoose');

const adConfigSchema = new mongoose.Schema({
  // Configuration identification
  platform: {
    type: String,
    required: true,
    enum: ['android', 'ios'],
    unique: true
  },
  
  // AdMob configuration
  appId: {
    type: String,
    required: true
  },
  
  // Ad configuration
  maxAdContentRating: {
    type: String,
    default: 'G',
    enum: ['G', 'PG', 'T', 'MA']
  },
  
  tagForUnderAgeOfConsent: {
    type: Boolean,
    default: false
  },
  
  tagForChildDirectedTreatment: {
    type: Boolean,
    default: false
  },
  
  // Metadata
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Timestamps
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
adConfigSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Instance methods
adConfigSchema.methods.toPublic = function() {
  // Get reward amount from environment variable (single source of truth)
  const rewardAmount = Number(process.env.REWARDED_AD_COINS || 50);
  
  return {
    platform: this.platform,
    appId: this.appId,
    maxAdContentRating: this.maxAdContentRating,
    tagForUnderAgeOfConsent: this.tagForUnderAgeOfConsent,
    tagForChildDirectedTreatment: this.tagForChildDirectedTreatment,
    rewardConfig: {
      coinsPerAd: rewardAmount,
      abilitiesPerAd: 1
    }
  };
};

// Static methods
adConfigSchema.statics.getConfigForPlatform = function(platform) {
  return this.findOne({ platform, isActive: true }).then(config => {
    return config ? config.toPublic() : null;
  });
};

module.exports = mongoose.model('AdConfig', adConfigSchema);