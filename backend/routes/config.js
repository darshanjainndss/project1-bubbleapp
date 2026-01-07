const express = require('express');
const Ability = require('../models/Ability');
const AdConfig = require('../models/AdConfig');
const AdUnit = require('../models/AdUnit');
const GameConfig = require('../models/GameConfig');

const router = express.Router();

// ============================================================================
// ROUTES
// ============================================================================

// @route   GET /api/config/abilities
// @desc    Get all active abilities configuration
// @access  Public
router.get('/abilities', async (req, res) => {
  try {
    const abilities = await Ability.getActiveAbilities();

    const abilitiesData = abilities.map(ability => ability.toPublic());

    res.json({
      success: true,
      abilities: abilitiesData
    });
  } catch (error) {
    console.error('Error fetching abilities config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch abilities configuration',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/config/abilities/:name
// @desc    Get specific ability configuration
// @access  Public
router.get('/abilities/:name', async (req, res) => {
  try {
    const { name } = req.params;

    const ability = await Ability.getAbilityByName(name);

    if (!ability) {
      return res.status(404).json({
        success: false,
        message: 'Ability not found'
      });
    }

    res.json({
      success: true,
      ability: ability.toPublic()
    });
  } catch (error) {
    console.error('Error fetching ability config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ability configuration',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/config/ads
// @desc    Get ad configuration for platform
// @access  Public
router.get('/ads', async (req, res) => {
  try {
    const { platform = 'android' } = req.query;

    // Validate platform
    if (!['android', 'ios'].includes(platform)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid platform. Must be "android" or "ios"'
      });
    }

    const adConfig = await AdConfig.getConfigForPlatform(platform);

    if (!adConfig) {
      return res.status(404).json({
        success: false,
        message: `Ad configuration not found for platform: ${platform}`
      });
    }

    res.json({
      success: true,
      adConfig
    });
  } catch (error) {
    console.error('Error fetching ad config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ad configuration',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/config/game
// @desc    Get complete game configuration (abilities + ads)
// @access  Public
router.get('/game', async (req, res) => {
  try {
    const { platform = 'android' } = req.query;

    // Validate platform
    if (!['android', 'ios'].includes(platform)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid platform. Must be "android" or "ios"'
      });
    }

    // Fetch abilities and ad config in parallel
    const [abilities, adConfig, rewardedAds, gameSettings] = await Promise.all([
      Ability.getActiveAbilities(),
      AdConfig.getConfigForPlatform(platform),
      AdUnit.find({ platform, adType: 'rewarded', isActive: true }).sort({ priority: 1 }),
      GameConfig.getConfig()
    ]);

    const abilitiesData = abilities.map(ability => ability.toPublic());

    // Get reward amount from first active rewarded ad unit, fallback to 50
    const rewardAmount = rewardedAds.length > 0 ? (rewardedAds[0].rewardedAmount || 50) : 50;

    res.json({
      success: true,
      config: {
        abilities: abilitiesData,
        ads: adConfig,
        gameSettings: gameSettings ? gameSettings.winningRewards : null,
        platform,
        rewardAmount
      }
    });
  } catch (error) {
    console.error('Error fetching game config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch game configuration',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/config/ad-units
// @desc    Get all active ad units for platform
// @access  Public
router.get('/ad-units', async (req, res) => {
  try {
    const { platform = 'android' } = req.query;

    if (!['android', 'ios'].includes(platform)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid platform. Must be "android" or "ios"'
      });
    }

    const bannerAd = await AdUnit.findOne({ platform, adType: 'banner', isActive: true }).sort({ priority: 1 });
    const rewardedAds = await AdUnit.find({ platform, adType: 'rewarded', isActive: true }).sort({ priority: 1 });

    res.json({
      success: true,
      ads: {
        banner: bannerAd ? bannerAd.adId : null,
        rewarded: rewardedAds.length > 0 ? rewardedAds[0].adId : null,
        rewardedList: rewardedAds.map(ad => ad.adId),
        rewardedAmount: rewardedAds.length > 0 ? (rewardedAds[0].rewardedAmount || 50) : 50
      },
      fullConfig: {
        banner: bannerAd,
        rewarded: rewardedAds.length > 0 ? rewardedAds[0] : null,
        rewardedList: rewardedAds
      }
    });
  } catch (error) {
    console.error('Error fetching ad units:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ad units',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
