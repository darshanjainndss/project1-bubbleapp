const express = require('express');
const AdUnit = require('../models/AdUnit');

const router = express.Router();

// ============================================================================
// AD UNIT MANAGEMENT ROUTES
// ============================================================================

// @route   GET /api/adunit
// @desc    Get all ad units with optional filtering
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { platform, adType, isActive } = req.query;

    // Build filter object
    const filter = {};
    if (platform) {
      if (!['android', 'ios'].includes(platform)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid platform. Must be "android" or "ios"'
        });
      }
      filter.platform = platform;
    }
    if (adType) {
      if (!['banner', 'rewarded'].includes(adType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid adType. Must be "banner" or "rewarded"'
        });
      }
      filter.adType = adType;
    }
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    const adUnits = await AdUnit.find(filter).sort({ platform: 1, adType: 1, priority: 1 });

    res.json({
      success: true,
      data: adUnits,
      count: adUnits.length,
      filter: filter
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

// @route   GET /api/adunit/:id
// @desc    Get specific ad unit by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const adUnit = await AdUnit.findById(id);

    if (!adUnit) {
      return res.status(404).json({
        success: false,
        message: 'Ad unit not found'
      });
    }

    res.json({
      success: true,
      data: adUnit
    });
  } catch (error) {
    console.error('Error fetching ad unit:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ad unit',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   POST /api/adunit
// @desc    Create new ad unit
// @access  Public
router.post('/', async (req, res) => {
  try {
    const {
      adId,
      adType,
      platform,
      priority = 1,
      isActive = true,
      rewardedAmount = 50
    } = req.body;

    // Validate required fields
    if (!adId || !adType || !platform) {
      return res.status(400).json({
        success: false,
        message: 'adId, adType, and platform are required'
      });
    }

    // Validate enum values
    if (!['banner', 'rewarded'].includes(adType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid adType. Must be "banner" or "rewarded"'
      });
    }

    if (!['android', 'ios'].includes(platform)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid platform. Must be "android" or "ios"'
      });
    }

    // Check if ad unit with same adId already exists
    const existingAdUnit = await AdUnit.findOne({ adId });
    if (existingAdUnit) {
      return res.status(409).json({
        success: false,
        message: `Ad unit with adId "${adId}" already exists`
      });
    }

    const newAdUnit = new AdUnit({
      adId,
      adType,
      platform,
      priority,
      isActive,
      rewardedAmount
    });

    const savedAdUnit = await newAdUnit.save();

    res.status(201).json({
      success: true,
      message: 'Ad unit created successfully',
      data: savedAdUnit
    });
  } catch (error) {
    console.error('Error creating ad unit:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create ad unit',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   PUT /api/adunit/:id
// @desc    Update ad unit by ID
// @access  Public
router.put('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const {
      adId,
      adType,
      platform,
      priority,
      isActive,
      rewardedAmount
    } = req.body;

    const adUnit = await AdUnit.findById(id);

    if (!adUnit) {
      return res.status(404).json({
        success: false,
        message: 'Ad unit not found'
      });
    }

    // Validate enum values if provided
    if (adType && !['banner', 'rewarded'].includes(adType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid adType. Must be "banner" or "rewarded"'
      });
    }

    if (platform && !['android', 'ios'].includes(platform)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid platform. Must be "android" or "ios"'
      });
    }

    // Check if new adId conflicts with existing ad unit (if adId is being changed)
    if (adId && adId !== adUnit.adId) {
      const existingAdUnit = await AdUnit.findOne({ adId });
      if (existingAdUnit) {
        return res.status(409).json({
          success: false,
          message: `Ad unit with adId "${adId}" already exists`
        });
      }
    }

    // Update fields if provided
    if (adId !== undefined) adUnit.adId = adId;
    if (adType !== undefined) adUnit.adType = adType;
    if (platform !== undefined) adUnit.platform = platform;
    if (priority !== undefined) adUnit.priority = priority;
    if (isActive !== undefined) adUnit.isActive = isActive;
    if (rewardedAmount !== undefined) adUnit.rewardedAmount = rewardedAmount;

    const updatedAdUnit = await adUnit.save();

    res.json({
      success: true,
      message: 'Ad unit updated successfully',
      data: updatedAdUnit
    });
  } catch (error) {
    console.error('Error updating ad unit:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update ad unit',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   DELETE /api/adunit/:id
// @desc    Delete ad unit by ID
// @access  Public
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const adUnit = await AdUnit.findByIdAndDelete(id);

    if (!adUnit) {
      return res.status(404).json({
        success: false,
        message: 'Ad unit not found'
      });
    }

    res.json({
      success: true,
      message: 'Ad unit deleted successfully',
      data: adUnit
    });
  } catch (error) {
    console.error('Error deleting ad unit:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete ad unit',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/adunit/best/:platform/:adType
// @desc    Get the best (highest priority) ad unit for platform and type
// @access  Public
router.get('/best/:platform/:adType', async (req, res) => {
  try {
    const { platform, adType } = req.params;

    // Validate parameters
    if (!['android', 'ios'].includes(platform)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid platform. Must be "android" or "ios"'
      });
    }

    if (!['banner', 'rewarded'].includes(adType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid adType. Must be "banner" or "rewarded"'
      });
    }

    const adUnit = await AdUnit.getAdId(platform, adType);

    if (!adUnit) {
      return res.status(404).json({
        success: false,
        message: `No active ad unit found for ${platform} ${adType}`
      });
    }

    res.json({
      success: true,
      data: adUnit,
      adId: adUnit.adId
    });
  } catch (error) {
    console.error('Error fetching best ad unit:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch best ad unit',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   POST /api/adunit/initialize
// @desc    Initialize ad units
// @access  Public
router.post('/initialize', async (req, res) => {
  try {
    const adUnitsData = req.body.adUnits || [];
    const results = [];

    for (const adUnitData of adUnitsData) {
      const existingAdUnit = await AdUnit.findOne({ adId: adUnitData.adId });
      if (existingAdUnit) {
        results.push({ adId: adUnitData.adId, action: 'skipped', message: 'Ad unit already exists' });
      } else {
        const newAdUnit = new AdUnit(adUnitData);
        const savedAdUnit = await newAdUnit.save();
        results.push({ adId: adUnitData.adId, action: 'created', data: savedAdUnit });
      }
    }

    res.json({
      success: true,
      message: 'Ad units initialization completed',
      results
    });
  } catch (error) {
    console.error('Error initializing ad units:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize ad units',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
