const mongoose = require('mongoose');

const gameSessionSchema = new mongoose.Schema({
  // Session identification
  sessionId: {
    type: String,
    required: true,
    unique: true,
    default: function() {
      return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
  },
  
  // User reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Game details
  level: {
    type: Number,
    required: true,
    min: 1
  },
  score: {
    type: Number,
    required: true,
    min: 0
  },
  moves: {
    type: Number,
    required: true,
    min: 0
  },
  stars: {
    type: Number,
    required: true,
    min: 0,
    max: 3
  },
  
  // Abilities used during the game
  abilitiesUsed: {
    lightning: {
      type: Number,
      default: 0,
      min: 0
    },
    bomb: {
      type: Number,
      default: 0,
      min: 0
    },
    freeze: {
      type: Number,
      default: 0,
      min: 0
    },
    fire: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  
  // Rewards
  coinsEarned: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Session metadata
  duration: {
    type: Number, // in seconds
    required: true,
    min: 0
  },
  completedAt: {
    type: Date,
    default: Date.now
  },
  
  // Game outcome
  isWin: {
    type: Boolean,
    required: true
  },
  
  // Additional stats
  bubblesDestroyed: {
    type: Number,
    default: 0,
    min: 0
  },
  chainReactions: {
    type: Number,
    default: 0,
    min: 0
  },
  perfectShots: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

// Indexes for better performance
gameSessionSchema.index({ userId: 1, completedAt: -1 });
gameSessionSchema.index({ level: 1, score: -1 });
gameSessionSchema.index({ completedAt: -1 });
gameSessionSchema.index({ sessionId: 1 });

// Static method to get user's best score for a level
gameSessionSchema.statics.getUserBestScore = async function(userId, level) {
  const result = await this.findOne({
    userId: userId,
    level: level,
    isWin: true
  }).sort({ score: -1 });
  
  return result ? result.score : 0;
};

// Static method to get user's game statistics
gameSessionSchema.statics.getUserStats = async function(userId) {
  const stats = await this.aggregate([
    {
      $match: { userId: new mongoose.Types.ObjectId(userId) }
    },
    {
      $group: {
        _id: '$userId',
        totalGames: { $sum: 1 },
        totalWins: { $sum: { $cond: ['$isWin', 1, 0] } },
        totalScore: { $sum: '$score' },
        highScore: { $max: '$score' },
        averageScore: { $avg: '$score' },
        totalPlayTime: { $sum: '$duration' },
        totalCoinsEarned: { $sum: '$coinsEarned' },
        totalBubblesDestroyed: { $sum: '$bubblesDestroyed' },
        totalChainReactions: { $sum: '$chainReactions' },
        totalPerfectShots: { $sum: '$perfectShots' },
        lightningUsed: { $sum: '$abilitiesUsed.lightning' },
        bombUsed: { $sum: '$abilitiesUsed.bomb' },
        freezeUsed: { $sum: '$abilitiesUsed.freeze' },
        fireUsed: { $sum: '$abilitiesUsed.fire' }
      }
    }
  ]);
  
  if (stats.length === 0) {
    return {
      totalGames: 0,
      totalWins: 0,
      totalScore: 0,
      highScore: 0,
      averageScore: 0,
      winRate: 0,
      totalPlayTime: 0,
      totalCoinsEarned: 0,
      totalBubblesDestroyed: 0,
      totalChainReactions: 0,
      totalPerfectShots: 0,
      abilitiesUsed: {
        lightning: 0,
        bomb: 0,
        freeze: 0,
        fire: 0
      }
    };
  }
  
  const stat = stats[0];
  stat.winRate = stat.totalGames > 0 ? (stat.totalWins / stat.totalGames * 100).toFixed(1) : 0;
  stat.abilitiesUsed = {
    lightning: stat.lightningUsed || 0,
    bomb: stat.bombUsed || 0,
    freeze: stat.freezeUsed || 0,
    fire: stat.fireUsed || 0
  };
  
  // Remove the individual ability fields
  delete stat.lightningUsed;
  delete stat.bombUsed;
  delete stat.freezeUsed;
  delete stat.fireUsed;
  
  return stat;
};

// Static method to get level leaderboard
gameSessionSchema.statics.getLevelLeaderboard = async function(level, limit = 50) {
  return this.aggregate([
    {
      $match: { 
        level: level,
        isWin: true
      }
    },
    {
      $sort: { score: -1, completedAt: 1 }
    },
    {
      $group: {
        _id: '$userId',
        bestScore: { $first: '$score' },
        bestTime: { $first: '$duration' },
        completedAt: { $first: '$completedAt' }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    {
      $unwind: '$user'
    },
    {
      $project: {
        userId: '$_id',
        displayName: '$user.displayName',
        profilePicture: '$user.profilePicture',
        score: '$bestScore',
        duration: '$bestTime',
        completedAt: '$completedAt'
      }
    },
    {
      $sort: { score: -1, duration: 1 }
    },
    {
      $limit: limit
    }
  ]);
};

// Instance method to calculate coins earned
gameSessionSchema.methods.calculateCoinsEarned = function() {
  let coins = 0;
  
  // Base coins for completing the level
  if (this.isWin) {
    coins += 10;
    
    // Bonus coins based on stars
    coins += this.stars * 5;
    
    // Bonus coins based on score
    if (this.score >= 1000) coins += 20;
    else if (this.score >= 500) coins += 10;
    else if (this.score >= 100) coins += 5;
    
    // Bonus for perfect game (no abilities used)
    const totalAbilities = Object.values(this.abilitiesUsed).reduce((sum, count) => sum + count, 0);
    if (totalAbilities === 0) {
      coins += 15;
    }
  }
  
  this.coinsEarned = coins;
  return coins;
};

module.exports = mongoose.model('GameSession', gameSessionSchema);