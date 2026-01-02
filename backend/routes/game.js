const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const GameSession = require('../models/GameSession');
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
    
    // Update level stars if this is better than previous attempt
    const currentStars = user.gameData.levelStars.get(level.toString()) || 0;
    if (stars > currentStars) {
      user.gameData.levelStars.set(level.toString(), stars);
      
      // Add to completed levels if not already there
      if (!user.gameData.completedLevels.includes(level)) {
        user.gameData.completedLevels.push(level);
      }
    }

    // Update high score if this is better
    if (score > user.gameData.highScore) {
      user.gameData.highScore = score;
    }

    // Check if next level should be unlocked (2+ stars required)
    if (stars >= 2 && level >= user.gameData.currentLevel) {
      user.gameData.currentLevel = level + 1;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Progress updated successfully',
      updatedGameData: {
        totalScore: user.gameData.totalScore,
        highScore: user.gameData.highScore,
        totalCoins: user.gameData.totalCoins,
        currentLevel: user.gameData.currentLevel,
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

    // Create game session
    const gameSession = new GameSession({
      userId: req.userId,
      level,
      score,
      moves,
      stars,
      duration,
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
    const coinsEarned = gameSession.calculateCoinsEarned();

    // Save game session
    await gameSession.save();

    // Update user game data
    user.gameData.gamesPlayed += 1;
    user.gameData.totalScore += score;
    user.gameData.lastPlayedAt = new Date();

    // Update level stars (always update, even on loss)
    const currentStars = user.gameData.levelStars.get(level.toString()) || 0;
    if (stars > currentStars) {
      user.gameData.levelStars.set(level.toString(), stars);
    }

    // Add to completed levels if not already there and has at least 1 star
    if (stars > 0 && !user.gameData.completedLevels.includes(level)) {
      user.gameData.completedLevels.push(level);
    }

    // Update high score if this is better
    if (score > user.gameData.highScore) {
      user.gameData.highScore = score;
    }

    // Check if next level should be unlocked (2+ stars required)
    if (stars >= 2 && level >= user.gameData.currentLevel) {
      user.gameData.currentLevel = level + 1;
    }

    // Add coins earned
    user.gameData.totalCoins += coinsEarned;

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

    await user.save();

    res.status(201).json({
      success: true,
      message: 'Game session submitted successfully',
      sessionId: gameSession.sessionId,
      coinsEarned,
      newAchievements,
      updatedGameData: {
        totalScore: user.gameData.totalScore,
        highScore: user.gameData.highScore,
        totalCoins: user.gameData.totalCoins,
        currentLevel: user.gameData.currentLevel,
        gamesPlayed: user.gameData.gamesPlayed,
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