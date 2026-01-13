const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const GameSession = require('../models/GameSession');
const auth = require('../middleware/auth');

const router = express.Router();

// ============================================================================
// VALIDATION MIDDLEWARE
// ============================================================================

const validateCoinsUpdate = [
  body('amount')
    .isInt({ min: 1 })
    .withMessage('Amount must be a positive integer'),
  body('operation')
    .isIn(['add', 'subtract'])
    .withMessage('Operation must be either "add" or "subtract"')
];

const validateAbilitiesUpdate = [
  body('abilities')
    .isObject()
    .withMessage('Abilities must be an object'),
  body('abilities.lightning')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Lightning ability count must be a non-negative integer'),
  body('abilities.bomb')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Bomb ability count must be a non-negative integer'),
  body('abilities.freeze')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Freeze ability count must be a non-negative integer'),
  body('abilities.fire')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Fire ability count must be a non-negative integer')
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

// @route   GET /api/user/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: user.getPublicProfile()
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching profile'
    });
  }
});

// @route   PUT /api/user/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, [
  body('displayName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Display name must be between 2 and 50 characters'),
  body('profilePicture')
    .optional()
    .isURL()
    .withMessage('Profile picture must be a valid URL')
], handleValidationErrors, async (req, res) => {
  try {
    const { displayName, profilePicture } = req.body;

    const user = req.user;
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update fields if provided
    if (displayName) user.displayName = displayName;
    if (profilePicture !== undefined) user.profilePicture = profilePicture;

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: user.getPublicProfile()
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating profile'
    });
  }
});

// @route   GET /api/user/game-data
// @desc    Get user game data
// @access  Private
router.get('/game-data', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Initialize abilities if they don't exist
    if (!user.gameData.abilities || user.gameData.abilities.size === 0) {
      await user.initializeUserAbilities();
      await user.save();
    }

    // Get user's rank
    const rank = await User.getUserRank(user.email);

    const gameData = user.getGameData();
    gameData.rank = rank;

    // Sanitize any potential NaN values from historical corrupted state
    gameData.totalScore = Number(gameData.totalScore) || 0;
    gameData.highScore = Number(gameData.highScore) || 0;
    gameData.totalCoins = Number(gameData.totalCoins) || 0;
    gameData.gamesPlayed = Number(gameData.gamesPlayed) || 0;

    res.json({
      success: true,
      gameData
    });

  } catch (error) {
    console.error('Get game data error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching game data'
    });
  }
});

// @route   PUT /api/user/game-data
// @desc    Update user game data
// @access  Private
router.put('/game-data', auth, async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const allowedUpdates = [
      'totalScore', 'highScore', 'currentLevel', 'gamesPlayed',
      'achievements', 'lastPlayedAt'
    ];

    // Update only allowed fields
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        user.gameData[key] = req.body[key];
      }
    });

    await user.save();

    res.json({
      success: true,
      message: 'Game data updated successfully',
      gameData: user.getGameData()
    });

  } catch (error) {
    console.error('Update game data error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating game data'
    });
  }
});

router.put('/coins', auth, validateCoinsUpdate, handleValidationErrors, async (req, res) => {
  try {
    const { amount, operation, isAdReward } = req.body;

    const user = req.user;
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Server-side enforcement of ad reward amount from database
    let actualAmount = amount;
    if (isAdReward) {
      const AdUnit = require('../models/AdUnit');
      const rewardedAds = await AdUnit.find({
        platform: 'android', // You can make this dynamic based on user's platform
        adType: 'rewarded',
        isActive: true
      }).sort({ priority: 1 }).limit(1);

      const allowedReward = rewardedAds.length > 0 ? (rewardedAds[0].rewardedAmount || 50) : 50;

      if (amount !== allowedReward) {
        console.warn(`⚠️ User ${req.userId} attempted to claim ${amount} coins for an ad, but allowed is ${allowedReward}. Enforcing allowed.`);
        actualAmount = allowedReward;
      }
    }

    const currentCoins = user.gameData.totalCoins;

    if (operation === 'add') {
      user.gameData.totalCoins += actualAmount;
      if (isAdReward) {
        user.gameData.totalAdEarnings = (user.gameData.totalAdEarnings || 0) + actualAmount;
        if (!user.gameData.rewardedAdHistory) user.gameData.rewardedAdHistory = [];
        user.gameData.rewardedAdHistory.push({ amount: actualAmount, watchedAt: new Date() });
      }
    } else if (operation === 'subtract') {
      if (currentCoins < actualAmount) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient coins'
        });
      }
      user.gameData.totalCoins -= actualAmount;
    }

    await user.save();

    res.json({
      success: true,
      message: `Coins ${operation}ed successfully`,
      newBalance: user.gameData.totalCoins,
      previousBalance: currentCoins
    });

  } catch (error) {
    console.error('Update coins error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating coins'
    });
  }
});

// @route   PUT /api/user/abilities
// @desc    Update user abilities
// @access  Private
router.put('/abilities', auth, validateAbilitiesUpdate, handleValidationErrors, async (req, res) => {
  try {
    const { abilities } = req.body;

    const user = req.user;
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update abilities
    const ShopItem = require('../models/ShopItem');
    const activeAbilities = await ShopItem.find({ type: 'ability', isActive: true }).select('name');
    const activeAbilityNames = activeAbilities.map(a => a.name);

    Object.keys(abilities).forEach(ability => {
      if (activeAbilityNames.includes(ability)) {
        user.gameData.abilities.set(ability, abilities[ability]);
      }
    });

    await user.save();

    res.json({
      success: true,
      message: 'Abilities updated successfully',
      abilities: user.gameData.abilities
    });

  } catch (error) {
    console.error('Update abilities error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating abilities'
    });
  }
});

// @route   POST /api/user/purchase-abilities
// @desc    Purchase abilities with coins
// @access  Private
router.post('/purchase-abilities', auth, [
  body('ability')
    .isIn(['lightning', 'bomb', 'freeze', 'fire'])
    .withMessage('Invalid ability type'),
  body('quantity')
    .isInt({ min: 1, max: 10 })
    .withMessage('Quantity must be between 1 and 10')
], handleValidationErrors, async (req, res) => {
  try {
    const { ability, quantity } = req.body;

    const user = req.user;
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Initialize abilities if they don't exist
    if (!user.gameData.abilities || user.gameData.abilities.size === 0) {
      await user.initializeUserAbilities();
    }

    const ShopItem = require('../models/ShopItem');
    const abilityDoc = await ShopItem.findOne({ name: ability, type: 'ability', isActive: true });

    if (!abilityDoc) {
      return res.status(404).json({
        success: false,
        message: 'Ability not found or inactive'
      });
    }

    const totalCost = abilityDoc.priceCoins * quantity;

    // Check if user has enough coins
    if (user.gameData.totalCoins < totalCost) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient coins',
        required: totalCost,
        available: user.gameData.totalCoins
      });
    }

    // Deduct coins and add abilities
    user.gameData.totalCoins -= totalCost;
    user.addAbilities(ability, quantity);

    await user.save();

    const newAbilityCount = user.getAbilityCount(ability);

    res.json({
      success: true,
      message: `Purchased ${quantity} ${ability} ability(ies)`,
      coinsSpent: totalCost,
      newCoinBalance: user.gameData.totalCoins,
      newAbilityCount: newAbilityCount
    });

  } catch (error) {
    console.error('Purchase abilities error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error purchasing abilities'
    });
  }
});

// @route   GET /api/user/rank
// @desc    Get user's current rank
// @access  Private
router.get('/rank', auth, async (req, res) => {
  try {
    const rank = await User.getUserRank(req.userEmail);

    if (rank === null) {
      return res.status(404).json({
        success: false,
        message: 'User rank not found'
      });
    }

    res.json({
      success: true,
      rank
    });

  } catch (error) {
    console.error('Get user rank error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching user rank'
    });
  }
});

// @route   GET /api/user/stats
// @desc    Get detailed user statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const stats = await GameSession.getUserStats(req.userEmail);

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching user statistics'
    });
  }
});

// @route   GET /api/user/debug-abilities
// @desc    Debug endpoint to check user abilities
// @access  Private
router.get('/debug-abilities', auth, async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Convert Map to object for easier debugging
    const abilitiesObj = {};
    if (user.gameData.abilities) {
      user.gameData.abilities.forEach((value, key) => {
        abilitiesObj[key] = value;
      });
    }

    res.json({
      success: true,
      data: {
        userId: user._id,
        email: user.email,
        totalCoins: user.gameData.totalCoins,
        abilities: abilitiesObj,
        abilitiesMapSize: user.gameData.abilities ? user.gameData.abilities.size : 0,
        currentLevel: user.gameData.currentLevel
      }
    });

  } catch (error) {
    console.error('Debug abilities error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting debug abilities'
    });
  }
});

module.exports = router;