const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const GameSession = require('../models/GameSession');
// LevelReward model removed as part of consolidation
const RewardHistory = require('../models/RewardHistory');
const GameConfig = require('../models/GameConfig');
const auth = require('../middleware/auth');

const router = express.Router();

// ============================================================================
// VALIDATION MIDDLEWARE
// ============================================================================

const validateGameSession = [
  body('level')
    .isInt({ min: 1 })
    .withMessage('Level must be a positive integer'),
  body('score')
    .isInt({ min: 0 })
    .withMessage('Score must be a non-negative integer'),
  body('moves')
    .isInt({ min: 0 })
    .withMessage('Moves must be a non-negative integer'),
  body('stars')
    .isInt({ min: 0, max: 3 })
    .withMessage('Stars must be between 0 and 3'),
  body('duration')
    .isInt({ min: 1 })
    .withMessage('Duration must be a positive integer'),
  body('isWin')
    .isBoolean()
    .withMessage('isWin must be a boolean'),
  body('abilitiesUsed')
    .optional()
    .isObject()
    .withMessage('abilitiesUsed must be an object'),
  body('bubblesDestroyed')
    .optional()
    .isInt({ min: 0 })
    .withMessage('bubblesDestroyed must be a non-negative integer'),
  body('chainReactions')
    .optional()
    .isInt({ min: 0 })
    .withMessage('chainReactions must be a non-negative integer'),
  body('perfectShots')
    .optional()
    .isInt({ min: 0 })
    .withMessage('perfectShots must be a non-negative integer'),
  body('coinsEarned')
    .optional()
    .isInt({ min: 0 })
    .withMessage('coinsEarned must be a non-negative integer')
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// ============================================================================
// ROUTES
// ============================================================================

// @route   POST /api/game/progress
// @desc    Update game progress during gameplay (not just completion)
// @access  Private
router.post('/progress', auth, async (req, res) => {
  try {
    const {
      level,
      score,
      moves,
      stars,
      isPartial = true // Flag to indicate this is mid-game progress
    } = req.body;

    // Get user
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update progress data
    user.gameData.lastPlayedAt = new Date();

    // Only update permanent level progress and high scores if this is NOT a partial heartbeat update
    // Aborted or unfinished games should not count towards permanent progress
    // We strictly check for isPartial === false or isPartial === 'false'
    const isActuallyComplete = isPartial === false || isPartial === 'false';

    if (isActuallyComplete) {
      // Use consistent star threshold: 1=100, 2=400, 3=800
      const calculatedStars = score >= 800 ? 3 : score >= 400 ? 2 : score >= 100 ? 1 : 0;

      console.log(`📊 Permanent Progress Update: level=${level}, score=${score}, stars_body=${stars}, stars_calc=${calculatedStars}`);

      // Update level stars if this is better than previous attempt
      const currentStars = user.gameData.levelStars.get(level.toString()) || 0;
      if (calculatedStars > currentStars) {
        user.gameData.levelStars.set(level.toString(), calculatedStars);

        // Add to completed levels if not already there
        if (!user.gameData.completedLevels.includes(level)) {
          user.gameData.completedLevels.push(level);
        }
      }

      // Update high score if this is better
      const currentHighScore = Number(user.gameData.highScore) || 0;
      if (score > currentHighScore) {
        user.gameData.highScore = score;
      }

      // Check if next level should be unlocked (2+ stars required)
      if (calculatedStars >= 2 && level >= user.gameData.currentLevel) {
        console.log(`🚀 Level Up (Progress): ${user.gameData.currentLevel} -> ${level + 1}`);
        user.gameData.currentLevel = level + 1;
      }
    }

    await user.save();

    res.json({
      success: true,
      message: 'Progress updated successfully',
      updatedGameData: {
        totalScore: Number(user.gameData.totalScore) || 0,
        highScore: Number(user.gameData.highScore) || 0,
        totalCoins: Number(user.gameData.totalCoins) || 0,
        currentLevel: Number(user.gameData.currentLevel) || 1,
        completedLevels: user.gameData.completedLevels,
        levelStars: Object.fromEntries(user.gameData.levelStars),
        abilities: user.gameData.abilities
      }
    });

  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating progress'
    });
  }
});

// @route   POST /api/game/session
// @desc    Submit a completed game session
// @access  Private
router.post('/session', auth, validateGameSession, handleValidationErrors, async (req, res) => {
  try {
    const {
      level,
      score,
      moves,
      stars,
      duration,
      isWin,
      abilitiesUsed = {},
      bubblesDestroyed = 0,
      chainReactions = 0,
      perfectShots = 0
    } = req.body;

    // Get user
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log(`🎮 Processing Session: User=${user.email}, Level=${level}, Score=${score}, Stars=${stars}, isWin=${isWin}`);

    // Create game session
    const gameSession = new GameSession({
      userId: req.userId,
      level,
      score,
      moves,
      stars,
      duration,
      isWin,
      abilitiesUsed: {
        lightning: abilitiesUsed.lightning || 0,
        bomb: abilitiesUsed.bomb || 0,
        freeze: abilitiesUsed.freeze || 0,
        fire: abilitiesUsed.fire || 0
      },
      bubblesDestroyed,
      chainReactions,
      perfectShots
    });

    // Calculate coins earned
    let coinsEarned = 0;
    if (req.body.coinsEarned !== undefined && req.body.coinsEarned !== null) {
      coinsEarned = parseInt(req.body.coinsEarned) || 0;
      gameSession.coinsEarned = coinsEarned;
    } else {
      coinsEarned = await gameSession.calculateCoinsEarned();
    }

    // Save game session
    await gameSession.save();
    console.log(`✅ Session Saved: ID=${gameSession.sessionId}, Coins=${coinsEarned}`);

    // Update basic user metrics
    user.gameData.gamesPlayed = (Number(user.gameData.gamesPlayed) || 0) + 1;
    user.gameData.lastPlayedAt = new Date();

    // Only update total score and level progress if the game was won
    if (isWin) {
      user.gameData.totalScore = (Number(user.gameData.totalScore) || 0) + score;

      // Update level stars if this is better than previous attempt
      const currentStars = user.gameData.levelStars.get(level.toString()) || 0;
      if (stars > currentStars) {
        user.gameData.levelStars.set(level.toString(), stars);
      }

      // Add to completed levels if not already there and has at least 1 star
      if (stars > 0 && !user.gameData.completedLevels.includes(level)) {
        user.gameData.completedLevels.push(level);
      }

      // Update high score if this is better
      const currentHighScore = Number(user.gameData.highScore) || 0;
      if (score > currentHighScore) {
        user.gameData.highScore = score;
      }

      // Check if next level should be unlocked (2+ stars required)
      if (stars >= 2 && level >= user.gameData.currentLevel) {
        console.log(`📊 Level Up: ${user.gameData.currentLevel} -> ${level + 1}`);
        user.gameData.currentLevel = level + 1;
      } else {
        console.log(`📊 No Level Up: stars=${stars}, currentLevel=${user.gameData.currentLevel}`);
      }
    }

    // Add coins earned (which should be 0 on loss anyway based on model logic)
    user.gameData.totalCoins = (Number(user.gameData.totalCoins) || 0) + coinsEarned;

    // Deduct abilities used
    Object.keys(abilitiesUsed).forEach(ability => {
      if (['lightning', 'bomb', 'freeze', 'fire'].includes(ability)) {
        const used = abilitiesUsed[ability] || 0;
        user.gameData.abilities[ability] = Math.max(0, user.gameData.abilities[ability] - used);
      }
    });

    // Check for achievements
    const newAchievements = checkAchievements(user, gameSession);
    if (newAchievements.length > 0) {
      user.gameData.achievements.push(...newAchievements);
    }

    // Handle level rewards (one-time per level)
    let levelRewardCoins = 0;
    let levelRewardAwarded = false;

    if (isWin && stars >= 2) {
      // Check if user already received reward for this level (using RewardHistory now)
      const existingReward = await RewardHistory.findOne({
        userId: req.userId,
        level: level,
        status: { $in: ['claimed', 'withdrawn'] } // Check any status
      });

      if (!existingReward) {
        // Calculate reward based on stars
        if (stars === 3) levelRewardCoins = 15;
        else if (stars === 2) levelRewardCoins = 10;
        else levelRewardCoins = 0;

        const config = await GameConfig.getConfig();
        const scoreRange = config ? config.scoreRange || 100 : 100;
        const rewardPerRange = config ? parseFloat(config.reward.toString()) || 1 : 1;
        const rewardValue = (score / scoreRange) * rewardPerRange;

        const rewardHistory = new RewardHistory({
          userId: req.userId,
          email: user.email,
          level: level,
          reward: rewardValue,
          coins: levelRewardCoins,
          stars: stars,
          score: score,
          status: 'claimed',
          date: new Date()
        });

        await rewardHistory.save();
        user.gameData.totalCoins = (Number(user.gameData.totalCoins) || 0) + levelRewardCoins;
        levelRewardAwarded = true;
        console.log(`🎁 Reward Saved: Level=${level}, Coins=${levelRewardCoins}, Bolt=${rewardValue}`);
      } else {
        console.log(`ℹ️ Reward already claimed for Level ${level}`);
      }
    }

    await user.save();

    res.status(201).json({
      success: true,
      message: 'Game session submitted successfully',
      sessionId: gameSession.sessionId,
      coinsEarned,
      levelReward: levelRewardAwarded ? {
        awarded: true,
        coins: levelRewardCoins,
        stars: stars,
        level: level
      } : null,
      newAchievements,
      updatedGameData: {
        totalScore: Number(user.gameData.totalScore) || 0,
        highScore: Number(user.gameData.highScore) || 0,
        totalCoins: Number(user.gameData.totalCoins) || 0,
        currentLevel: Number(user.gameData.currentLevel) || 1,
        gamesPlayed: Number(user.gameData.gamesPlayed) || 0,
        completedLevels: user.gameData.completedLevels,
        levelStars: Object.fromEntries(user.gameData.levelStars),
        abilities: user.gameData.abilities
      }
    });

  } catch (error) {
    console.error('Submit game session error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error submitting game session'
    });
  }
});

// @route   GET /api/game/sessions
// @desc    Get user's game sessions
// @access  Private
router.get('/sessions', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, level } = req.query;

    const query = { userId: req.userId };
    if (level) {
      query.level = parseInt(level);
    }

    const sessions = await GameSession.find(query)
      .sort({ completedAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const totalSessions = await GameSession.countDocuments(query);

    res.json({
      success: true,
      sessions,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalSessions / parseInt(limit)),
        totalSessions,
        hasNext: parseInt(page) * parseInt(limit) < totalSessions,
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Get game sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching game sessions'
    });
  }
});

// @route   GET /api/game/level/:level/leaderboard
// @desc    Get leaderboard for a specific level
// @access  Public
router.get('/level/:level/leaderboard', async (req, res) => {
  try {
    const { level } = req.params;
    const { limit = 50 } = req.query;

    const leaderboard = await GameSession.getLevelLeaderboard(
      parseInt(level),
      parseInt(limit)
    );

    res.json({
      success: true,
      level: parseInt(level),
      leaderboard
    });

  } catch (error) {
    console.error('Get level leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching level leaderboard'
    });
  }
});

// @route   GET /api/game/level/:level/best-score
// @desc    Get user's best score for a specific level
// @access  Private
router.get('/level/:level/best-score', auth, async (req, res) => {
  try {
    const { level } = req.params;

    const bestScore = await GameSession.getUserBestScore(
      req.userId,
      parseInt(level)
    );

    res.json({
      success: true,
      level: parseInt(level),
      bestScore
    });

  } catch (error) {
    console.error('Get best score error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching best score'
    });
  }
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function checkAchievements(user, gameSession) {
  const achievements = [];
  const existingAchievements = user.gameData.achievements;

  // Perfect Game (no abilities used)
  const totalAbilities = Object.values(gameSession.abilitiesUsed).reduce((sum, count) => sum + count, 0);
  if (totalAbilities === 0 && !existingAchievements.includes('perfect_game')) {
    achievements.push('perfect_game');
  }

  // High Scorer
  if (gameSession.score >= 1000 && !existingAchievements.includes('high_scorer')) {
    achievements.push('high_scorer');
  }

  // Chain Master
  if (gameSession.chainReactions >= 5 && !existingAchievements.includes('chain_master')) {
    achievements.push('chain_master');
  }

  // Speed Demon (complete level in under 60 seconds)
  if (gameSession.duration < 60 && !existingAchievements.includes('speed_demon')) {
    achievements.push('speed_demon');
  }

  // Bubble Destroyer
  if (gameSession.bubblesDestroyed >= 100 && !existingAchievements.includes('bubble_destroyer')) {
    achievements.push('bubble_destroyer');
  }

  // Level achievements
  if (gameSession.level >= 10 && !existingAchievements.includes('level_10')) {
    achievements.push('level_10');
  }
  if (gameSession.level >= 25 && !existingAchievements.includes('level_25')) {
    achievements.push('level_25');
  }
  if (gameSession.level >= 50 && !existingAchievements.includes('level_50')) {
    achievements.push('level_50');
  }

  return achievements;
}

module.exports = router;