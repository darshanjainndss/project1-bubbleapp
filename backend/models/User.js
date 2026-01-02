const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic user information
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: function() {
      return !this.isGoogleLogin && !this.isAnonymous;
    },
    minlength: 6
  },
  displayName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  profilePicture: {
    type: String,
    default: null
  },
  
  // Authentication info
  firebaseId: {
    type: String,
    sparse: true,
    unique: true
  },
  isGoogleLogin: {
    type: Boolean,
    default: false
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  
  // Game statistics
  gameData: {
    totalScore: {
      type: Number,
      default: 0
    },
    highScore: {
      type: Number,
      default: 0
    },
    totalCoins: {
      type: Number,
      default: 100 // Starting coins
    },
    currentLevel: {
      type: Number,
      default: 1
    },
    gamesPlayed: {
      type: Number,
      default: 0
    },
    abilities: {
      type: Map,
      of: Number,
      default: function() {
        // Default abilities will be set by the initializeUserAbilities method
        return new Map();
      }
    },
    achievements: [{
      type: String
    }],
    completedLevels: [{
      type: Number
    }],
    levelStars: {
      type: Map,
      of: Number,
      default: new Map()
    },
    lastPlayedAt: {
      type: Date,
      default: Date.now
    }
  },
  
  // Account timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLoginAt: {
    type: Date,
    default: Date.now
  },
  
  // Account status
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for better performance
userSchema.index({ email: 1 });
userSchema.index({ firebaseId: 1 });
userSchema.index({ 'gameData.highScore': -1 });
userSchema.index({ 'gameData.totalScore': -1 });
userSchema.index({ createdAt: -1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  // Don't hash password for Google login users or anonymous users
  if (this.isGoogleLogin || this.isAnonymous) return next();
  
  try {
    // Hash password with cost of 12
    const hashedPassword = await bcrypt.hash(this.password, 12);
    this.password = hashedPassword;
    next();
  } catch (error) {
    next(error);
  }
});

// Initialize abilities for new users
userSchema.pre('save', async function(next) {
  // Only initialize abilities for new users
  if (!this.isNew) return next();
  
  try {
    // Initialize abilities if they don't exist
    if (!this.gameData.abilities || this.gameData.abilities.size === 0) {
      await this.initializeUserAbilities();
    }
    next();
  } catch (error) {
    console.error('Error initializing abilities for new user:', error);
    next(error);
  }
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (this.isGoogleLogin || this.isAnonymous) {
    throw new Error('This user type does not have passwords');
  }
  return bcrypt.compare(candidatePassword, this.password);
};

// Instance method to update last login
userSchema.methods.updateLastLogin = function() {
  this.lastLoginAt = new Date();
  return this.save();
};

// Instance method to get public profile
userSchema.methods.getPublicProfile = function() {
  return {
    id: this._id,
    email: this.email,
    displayName: this.displayName,
    profilePicture: this.profilePicture,
    isGoogleLogin: this.isGoogleLogin,
    createdAt: this.createdAt,
    lastLoginAt: this.lastLoginAt
  };
};

// Instance method to get game data
userSchema.methods.getGameData = function() {
  const gameData = this.gameData.toObject();
  
  // Convert levelStars Map to plain object
  if (gameData.levelStars instanceof Map) {
    gameData.levelStars = Object.fromEntries(gameData.levelStars);
  } else if (!gameData.levelStars) {
    gameData.levelStars = {};
  }
  
  // Convert abilities Map to plain object
  if (gameData.abilities instanceof Map) {
    gameData.abilities = Object.fromEntries(gameData.abilities);
  } else if (!gameData.abilities) {
    gameData.abilities = {};
  }
  
  return {
    userId: this._id,
    ...gameData,
    rank: null // Will be calculated separately
  };
};

// Instance method to initialize user abilities from Ability model
userSchema.methods.initializeUserAbilities = async function() {
  const Ability = require('./Ability');
  
  try {
    const abilities = await Ability.getActiveAbilities();
    
    // Initialize abilities map if it doesn't exist
    if (!this.gameData.abilities) {
      this.gameData.abilities = new Map();
    }
    
    // Set starting counts for each ability
    abilities.forEach(ability => {
      if (!this.gameData.abilities.has(ability.name)) {
        this.gameData.abilities.set(ability.name, ability.startingCount);
      }
    });
    
    // Don't save here - let the calling code handle the save
    return this;
  } catch (error) {
    console.error('Error initializing user abilities:', error);
    throw error;
  }
};

// Instance method to get ability count
userSchema.methods.getAbilityCount = function(abilityName) {
  if (!this.gameData.abilities || !this.gameData.abilities.has(abilityName)) {
    return 0;
  }
  return this.gameData.abilities.get(abilityName);
};

// Instance method to update ability count
userSchema.methods.updateAbilityCount = function(abilityName, count) {
  if (!this.gameData.abilities) {
    this.gameData.abilities = new Map();
  }
  
  this.gameData.abilities.set(abilityName, Math.max(0, count));
  return this;
};

// Instance method to use ability (decrement count)
userSchema.methods.useAbility = function(abilityName, count = 1) {
  const currentCount = this.getAbilityCount(abilityName);
  if (currentCount < count) {
    throw new Error(`Insufficient ${abilityName} abilities. Current: ${currentCount}, Required: ${count}`);
  }
  
  this.updateAbilityCount(abilityName, currentCount - count);
  return this;
};

// Instance method to add abilities
userSchema.methods.addAbilities = function(abilityName, count) {
  const currentCount = this.getAbilityCount(abilityName);
  this.updateAbilityCount(abilityName, currentCount + count);
  return this;
};

// Static method to get leaderboard
userSchema.statics.getLeaderboard = async function(limit = 100) {
  return this.aggregate([
    {
      $match: { isActive: true }
    },
    {
      $sort: { 'gameData.highScore': -1, 'gameData.totalScore': -1 }
    },
    {
      $limit: limit
    },
    {
      $project: {
        displayName: 1,
        profilePicture: 1,
        highScore: '$gameData.highScore',
        totalScore: '$gameData.totalScore',
        gamesPlayed: '$gameData.gamesPlayed'
      }
    },
    {
      $addFields: {
        rank: { $add: [{ $indexOfArray: [{ $range: [0, limit] }, '$_id'] }, 1] }
      }
    }
  ]);
};

// Static method to get user rank
userSchema.statics.getUserRank = async function(userId) {
  const pipeline = [
    {
      $match: { isActive: true }
    },
    {
      $sort: { 'gameData.highScore': -1, 'gameData.totalScore': -1 }
    },
    {
      $group: {
        _id: null,
        users: { $push: '$_id' }
      }
    },
    {
      $unwind: {
        path: '$users',
        includeArrayIndex: 'rank'
      }
    },
    {
      $match: { users: new mongoose.Types.ObjectId(userId) }
    },
    {
      $project: {
        rank: { $add: ['$rank', 1] }
      }
    }
  ];
  
  const result = await this.aggregate(pipeline);
  return result.length > 0 ? result[0].rank : null;
};

// Virtual for games played
userSchema.virtual('gameData.totalGames').get(function() {
  return this.gameData.gamesPlayed || 0;
});

module.exports = mongoose.model('User', userSchema);