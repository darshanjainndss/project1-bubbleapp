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
  
  // Ad unit IDs
  bannerAdUnitId: {
    production: {
      type: String,
      required: true
    },
    test: {
      type: String,
      required: true
    }
  },
  
  rewardedAdUnitId: {
    production: {
      type: String,
      required: true
    },
    test: {
      type: String,
      required: true
    }
  },
  
  interstitialAdUnitId: {
    production: {
      type: String,
      required: false
    },
    test: {
      type: String,
      required: false
    }
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
  
  // Reward configuration for rewarded ads
  rewardConfig: {
    coinsPerAd: {
      type: Number,
      default: 25,
      min: 1
    },
    abilitiesPerAd: {
      type: Number,
      default: 1,
      min: 0
    }
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
adConfigSchema.methods.toPublic = function(isDev = false) {
  return {
    platform: this.platform,
    appId: this.appId,
    bannerAdUnitId: isDev ? this.bannerAdUnitId.test : this.bannerAdUnitId.production,
    rewardedAdUnitId: isDev ? this.rewardedAdUnitId.test : this.rewardedAdUnitId.production,
    interstitialAdUnitId: isDev 
      ? this.interstitialAdUnitId?.test 
      : this.interstitialAdUnitId?.production,
    maxAdContentRating: this.maxAdContentRating,
    tagForUnderAgeOfConsent: this.tagForUnderAgeOfConsent,
    tagForChildDirectedTreatment: this.tagForChildDirectedTreatment,
    rewardConfig: this.rewardConfig
  };
};

// Static methods
adConfigSchema.statics.getConfigForPlatform = function(platform, isDev = false) {
  return this.findOne({ platform, isActive: true }).then(config => {
    return config ? config.toPublic(isDev) : null;
  });
};

module.exports = mongoose.model('AdConfig', adConfigSchema);