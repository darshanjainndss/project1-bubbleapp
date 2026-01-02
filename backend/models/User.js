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
      return !this.isGoogleLogin;
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
    gamesWon: {
      type: Number,
      default: 0
    },
    abilities: {
      lightning: {
        type: Number,
        default: 2 // Starting abilities
      },
      bomb: {
        type: Number,
        default: 2
      },
      freeze: {
        type: Number,
        default: 2
      },
      fire: {
        type: Number,
        default: 2
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
  
  // Don't hash password for Google login users
  if (this.isGoogleLogin) return next();
  
  try {
    // Hash password with cost of 12
    const hashedPassword = await bcrypt.hash(this.password, 12);
    this.password = hashedPassword;
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (this.isGoogleLogin) {
    throw new Error('Google login users do not have passwords');
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
  
  return {
    userId: this._id,
    ...gameData,
    rank: null // Will be calculated separately
  };
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
        gamesWon: '$gameData.gamesWon',
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

// Virtual for win rate
userSchema.virtual('gameData.winRate').get(function() {
  if (this.gameData.gamesPlayed === 0) return 0;
  return (this.gameData.gamesWon / this.gameData.gamesPlayed * 100).toFixed(1);
});

module.exports = mongoose.model('User', userSchema);