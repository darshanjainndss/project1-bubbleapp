const express = require('express');
const AdConfig = require('../models/AdConfig');

const router = express.Router();

// ============================================================================
// AD CONFIG MANAGEMENT ROUTES
// ============================================================================

// @route   GET /api/adconfig
// @desc    Get all ad configurations
// @access  Public
router.get('/', async (req, res) => {
  try {
    const configs = await AdConfig.find({}).sort({ platform: 1 });
    
    res.json({
      success: true,
      data: configs,
      count: configs.length
    });
  } catch (error) {
    console.error('Error fetching ad configs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ad configurations',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/adconfig/:platform
// @desc    Get ad configuration for specific platform
// @access  Public
router.get('/:platform', async (req, res) => {
  try {
    const { platform } = req.params;
    
    // Validate platform
    if (!['android', 'ios'].includes(platform)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid platform. Must be "android" or "ios"'
      });
    }

    const config = await AdConfig.findOne({ platform });
    
    if (!config) {
      return res.status(404).json({
        success: false,
        message: `Ad configuration not found for platform: ${platform}`
      });
    }

    res.json({
      success: true,
      data: config
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

// @route   POST /api/adconfig
// @desc    Create new ad configuration
// @access  Public
router.post('/', async (req, res) => {
  try {
    const {
      platform,
      appId,
      maxAdContentRating = 'G',
      tagForUnderAgeOfConsent = false,
      tagForChildDirectedTreatment = false,
      isActive = true
    } = req.body;

    // Validate required fields
    if (!platform || !appId) {
      return res.status(400).json({
        success: false,
        message: 'Platform and appId are required'
      });
    }

    // Validate platform
    if (!['android', 'ios'].includes(platform)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid platform. Must be "android" or "ios"'
      });
    }

    // Check if config already exists for platform
    const existingConfig = await AdConfig.findOne({ platform });
    if (existingConfig) {
      return res.status(409).json({
        success: false,
        message: `Ad configuration already exists for platform: ${platform}`
      });
    }

    const newConfig = new AdConfig({
      platform,
      appId,
      maxAdContentRating,
      tagForUnderAgeOfConsent,
      tagForChildDirectedTreatment,
      isActive
    });

    const savedConfig = await newConfig.save();

    res.status(201).json({
      success: true,
      message: 'Ad configuration created successfully',
      data: savedConfig
    });
  } catch (error) {
    console.error('Error creating ad config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create ad configuration',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});
// @route   PUT /api/adconfig/:platform
// @desc    Update ad configuration for specific platform
// @access  Public
router.put('/:platform', async (req, res) => {
  try {
    const { platform } = req.params;
    const {
      appId,
      maxAdContentRating,
      tagForUnderAgeOfConsent,
      tagForChildDirectedTreatment,
      isActive
    } = req.body;

    // Validate platform
    if (!['android', 'ios'].includes(platform)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid platform. Must be "android" or "ios"'
      });
    }

    const config = await AdConfig.findOne({ platform });
    
    if (!config) {
      return res.status(404).json({
        success: false,
        message: `Ad configuration not found for platform: ${platform}`
      });
    }

    // Update fields if provided
    if (appId !== undefined) config.appId = appId;
    if (maxAdContentRating !== undefined) config.maxAdContentRating = maxAdContentRating;
    if (tagForUnderAgeOfConsent !== undefined) config.tagForUnderAgeOfConsent = tagForUnderAgeOfConsent;
    if (tagForChildDirectedTreatment !== undefined) config.tagForChildDirectedTreatment = tagForChildDirectedTreatment;
    if (isActive !== undefined) config.isActive = isActive;

    const updatedConfig = await config.save();

    res.json({
      success: true,
      message: 'Ad configuration updated successfully',
      data: updatedConfig
    });
  } catch (error) {
    console.error('Error updating ad config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update ad configuration',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   DELETE /api/adconfig/:platform
// @desc    Delete ad configuration for specific platform
// @access  Public
router.delete('/:platform', async (req, res) => {
  try {
    const { platform } = req.params;

    // Validate platform
    if (!['android', 'ios'].includes(platform)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid platform. Must be "android" or "ios"'
      });
    }

    const config = await AdConfig.findOneAndDelete({ platform });
    
    if (!config) {
      return res.status(404).json({
        success: false,
        message: `Ad configuration not found for platform: ${platform}`
      });
    }

    res.json({
      success: true,
      message: 'Ad configuration deleted successfully',
      data: config
    });
  } catch (error) {
    console.error('Error deleting ad config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete ad configuration',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   POST /api/adconfig/initialize
// @desc    Initialize ad configurations with default data (replaces seeding)
// @access  Public
router.post('/initialize', async (req, res) => {
  try {
    const defaultConfigs = [
      {
        platform: 'android',
        appId: 'ca-app-pub-3940256099942544~3347511713', // Test App ID
        maxAdContentRating: 'G',
        tagForUnderAgeOfConsent: false,
        tagForChildDirectedTreatment: false,
        isActive: true
      },
      {
        platform: 'ios',
        appId: 'ca-app-pub-3940256099942544~1458002511', // Test App ID
        maxAdContentRating: 'G',
        tagForUnderAgeOfConsent: false,
        tagForChildDirectedTreatment: false,
        isActive: true
      }
    ];

    const results = [];
    
    for (const configData of defaultConfigs) {
      // Check if config already exists
      const existingConfig = await AdConfig.findOne({ platform: configData.platform });
      
      if (existingConfig) {
        results.push({
          platform: configData.platform,
          action: 'skipped',
          message: 'Configuration already exists'
        });
      } else {
        const newConfig = new AdConfig(configData);
        const savedConfig = await newConfig.save();
        results.push({
          platform: configData.platform,
          action: 'created',
          data: savedConfig
        });
      }
    }

    res.json({
      success: true,
      message: 'Ad configurations initialization completed',
      results
    });
  } catch (error) {
    console.error('Error initializing ad configs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize ad configurations',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   POST /api/adconfig/reset
// @desc    Reset all ad configurations to default values
// @access  Public
router.post('/reset', async (req, res) => {
  try {
    // Clear existing configs
    await AdConfig.deleteMany({});

    const defaultConfigs = [
      {
        platform: 'android',
        appId: 'ca-app-pub-3940256099942544~3347511713', // Test App ID
        maxAdContentRating: 'G',
        tagForUnderAgeOfConsent: false,
        tagForChildDirectedTreatment: false,
        isActive: true
      },
      {
        platform: 'ios',
        appId: 'ca-app-pub-3940256099942544~1458002511', // Test App ID
        maxAdContentRating: 'G',
        tagForUnderAgeOfConsent: false,
        tagForChildDirectedTreatment: false,
        isActive: true
      }
    ];

    const createdConfigs = await AdConfig.insertMany(defaultConfigs);

    res.json({
      success: true,
      message: 'Ad configurations reset successfully',
      data: createdConfigs,
      count: createdConfigs.length
    });
  } catch (error) {
    console.error('Error resetting ad configs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset ad configurations',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;