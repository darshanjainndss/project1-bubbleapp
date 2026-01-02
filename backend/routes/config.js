const express = require('express');
const Ability = require('../models/Ability');
const AdConfig = require('../models/AdConfig');

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
    const { platform = 'android', dev } = req.query;
    
    // Validate platform
    if (!['android', 'ios'].includes(platform)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid platform. Must be "android" or "ios"'
      });
    }
    
    const isDev = dev === 'true' || dev === '1';
    
    const adConfig = await AdConfig.getConfigForPlatform(platform, isDev);
    
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
    const { platform = 'android', dev } = req.query;
    
    // Validate platform
    if (!['android', 'ios'].includes(platform)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid platform. Must be "android" or "ios"'
      });
    }
    
    const isDev = dev === 'true' || dev === '1';
    
    // Fetch abilities and ad config in parallel
    const [abilities, adConfig] = await Promise.all([
      Ability.getActiveAbilities(),
      AdConfig.getConfigForPlatform(platform, isDev)
    ]);
    
    const abilitiesData = abilities.map(ability => ability.toPublic());
    
    res.json({
      success: true,
      config: {
        abilities: abilitiesData,
        ads: adConfig,
        platform,
        isDevelopment: isDev
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

module.exports = router;