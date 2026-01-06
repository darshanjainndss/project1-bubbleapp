const express = require('express');
const Ability = require('../models/Ability');

const router = express.Router();

// ============================================================================
// ABILITY MANAGEMENT ROUTES
// ============================================================================

// @route   GET /api/ability
// @desc    Get all abilities with optional filtering
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { isActive } = req.query;
    
    // Build filter object
    const filter = {};
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    const abilities = await Ability.find(filter).sort({ sortOrder: 1, name: 1 });
    
    res.json({
      success: true,
      data: abilities,
      count: abilities.length,
      filter: filter
    });
  } catch (error) {
    console.error('Error fetching abilities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch abilities',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/ability/:id
// @desc    Get specific ability by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const ability = await Ability.findById(id);
    
    if (!ability) {
      return res.status(404).json({
        success: false,
        message: 'Ability not found'
      });
    }

    res.json({
      success: true,
      data: ability
    });
  } catch (error) {
    console.error('Error fetching ability:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ability',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/ability/name/:name
// @desc    Get specific ability by name
// @access  Public
router.get('/name/:name', async (req, res) => {
  try {
    const { name } = req.params;
    
    const ability = await Ability.findOne({ name });
    
    if (!ability) {
      return res.status(404).json({
        success: false,
        message: 'Ability not found'
      });
    }

    res.json({
      success: true,
      data: ability
    });
  } catch (error) {
    console.error('Error fetching ability by name:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ability',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   POST /api/ability
// @desc    Create new ability
// @access  Public
router.post('/', async (req, res) => {
  try {
    const {
      name,
      displayName,
      description,
      icon,
      effect,
      pointsPerBubble = 10,
      price = 50,
      startingCount = 2,
      sortOrder = 1,
      isActive = true
    } = req.body;

    // Validate required fields
    if (!name || !displayName || !description || !icon || !effect) {
      return res.status(400).json({
        success: false,
        message: 'name, displayName, description, icon, and effect are required'
      });
    }

    // Validate enum values
    const validEffects = ['destroyRow', 'destroyNeighbors', 'freezeColumn', 'burnObstacles'];
    if (!validEffects.includes(effect)) {
      return res.status(400).json({
        success: false,
        message: `Invalid effect. Must be one of: ${validEffects.join(', ')}`
      });
    }

    // Check if ability with same name already exists
    const existingAbility = await Ability.findOne({ name });
    if (existingAbility) {
      return res.status(409).json({
        success: false,
        message: `Ability with name "${name}" already exists`
      });
    }

    const newAbility = new Ability({
      name,
      displayName,
      description,
      icon,
      effect,
      pointsPerBubble,
      price,
      startingCount,
      sortOrder,
      isActive
    });

    const savedAbility = await newAbility.save();

    res.status(201).json({
      success: true,
      message: 'Ability created successfully',
      data: savedAbility
    });
  } catch (error) {
    console.error('Error creating ability:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create ability',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   PUT /api/ability/:id
// @desc    Update ability by ID
// @access  Public
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      displayName,
      description,
      icon,
      effect,
      pointsPerBubble,
      price,
      startingCount,
      sortOrder,
      isActive
    } = req.body;

    const ability = await Ability.findById(id);
    
    if (!ability) {
      return res.status(404).json({
        success: false,
        message: 'Ability not found'
      });
    }

    // Validate effect if provided
    if (effect) {
      const validEffects = ['destroyRow', 'destroyNeighbors', 'freezeColumn', 'burnObstacles'];
      if (!validEffects.includes(effect)) {
        return res.status(400).json({
          success: false,
          message: `Invalid effect. Must be one of: ${validEffects.join(', ')}`
        });
      }
    }

    // Check if new name conflicts with existing ability (if name is being changed)
    if (name && name !== ability.name) {
      const existingAbility = await Ability.findOne({ name });
      if (existingAbility) {
        return res.status(409).json({
          success: false,
          message: `Ability with name "${name}" already exists`
        });
      }
    }

    // Update fields if provided
    if (name !== undefined) ability.name = name;
    if (displayName !== undefined) ability.displayName = displayName;
    if (description !== undefined) ability.description = description;
    if (icon !== undefined) ability.icon = icon;
    if (effect !== undefined) ability.effect = effect;
    if (pointsPerBubble !== undefined) ability.pointsPerBubble = pointsPerBubble;
    if (price !== undefined) ability.price = price;
    if (startingCount !== undefined) ability.startingCount = startingCount;
    if (sortOrder !== undefined) ability.sortOrder = sortOrder;
    if (isActive !== undefined) ability.isActive = isActive;

    const updatedAbility = await ability.save();

    res.json({
      success: true,
      message: 'Ability updated successfully',
      data: updatedAbility
    });
  } catch (error) {
    console.error('Error updating ability:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update ability',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   DELETE /api/ability/:id
// @desc    Delete ability by ID
// @access  Public
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const ability = await Ability.findByIdAndDelete(id);
    
    if (!ability) {
      return res.status(404).json({
        success: false,
        message: 'Ability not found'
      });
    }

    res.json({
      success: true,
      message: 'Ability deleted successfully',
      data: ability
    });
  } catch (error) {
    console.error('Error deleting ability:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete ability',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});
// @route   POST /api/ability/initialize
// @desc    Initialize abilities with default data (replaces seeding)
// @access  Public
router.post('/initialize', async (req, res) => {
  try {
    const defaultAbilities = [
      {
        name: 'lightning',
        displayName: 'Lightning',
        description: 'Destroys an entire row of bubbles',
        icon: 'flash',
        effect: 'destroyRow',
        pointsPerBubble: 10,
        price: 58,
        startingCount: 2,
        sortOrder: 1,
        isActive: true
      },
      {
        name: 'bomb',
        displayName: 'Bomb',
        description: 'Destroys 6 neighboring bubbles',
        icon: 'bomb',
        effect: 'destroyNeighbors',
        pointsPerBubble: 15,
        price: 75,
        startingCount: 2,
        sortOrder: 2,
        isActive: true
      },
      {
        name: 'freeze',
        displayName: 'Freeze',
        description: 'Freezes a column for easier targeting',
        icon: 'snowflake',
        effect: 'freezeColumn',
        pointsPerBubble: 5,
        price: 30,
        startingCount: 2,
        sortOrder: 3,
        isActive: true
      },
      {
        name: 'fire',
        displayName: 'Fire',
        description: 'Burns through obstacles and metal bubbles',
        icon: 'fire',
        effect: 'burnObstacles',
        pointsPerBubble: 20,
        price: 40,
        startingCount: 2,
        sortOrder: 4,
        isActive: true
      }
    ];

    const results = [];
    
    for (const abilityData of defaultAbilities) {
      // Check if ability already exists
      const existingAbility = await Ability.findOne({ name: abilityData.name });
      
      if (existingAbility) {
        results.push({
          name: abilityData.name,
          action: 'skipped',
          message: 'Ability already exists'
        });
      } else {
        const newAbility = new Ability(abilityData);
        const savedAbility = await newAbility.save();
        results.push({
          name: abilityData.name,
          action: 'created',
          data: savedAbility
        });
      }
    }

    res.json({
      success: true,
      message: 'Abilities initialization completed',
      results
    });
  } catch (error) {
    console.error('Error initializing abilities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize abilities',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   POST /api/ability/reset
// @desc    Reset all abilities to default values
// @access  Public
router.post('/reset', async (req, res) => {
  try {
    // Clear existing abilities
    await Ability.deleteMany({});

    const defaultAbilities = [
      {
        name: 'lightning',
        displayName: 'Lightning',
        description: 'Destroys an entire row of bubbles',
        icon: 'flash',
        effect: 'destroyRow',
        pointsPerBubble: 10,
        price: 58,
        startingCount: 2,
        sortOrder: 1,
        isActive: true
      },
      {
        name: 'bomb',
        displayName: 'Bomb',
        description: 'Destroys 6 neighboring bubbles',
        icon: 'bomb',
        effect: 'destroyNeighbors',
        pointsPerBubble: 15,
        price: 75,
        startingCount: 2,
        sortOrder: 2,
        isActive: true
      },
      {
        name: 'freeze',
        displayName: 'Freeze',
        description: 'Freezes a column for easier targeting',
        icon: 'snowflake',
        effect: 'freezeColumn',
        pointsPerBubble: 5,
        price: 30,
        startingCount: 2,
        sortOrder: 3,
        isActive: true
      },
      {
        name: 'fire',
        displayName: 'Fire',
        description: 'Burns through obstacles and metal bubbles',
        icon: 'fire',
        effect: 'burnObstacles',
        pointsPerBubble: 20,
        price: 40,
        startingCount: 2,
        sortOrder: 4,
        isActive: true
      }
    ];

    const createdAbilities = await Ability.insertMany(defaultAbilities);

    res.json({
      success: true,
      message: 'Abilities reset successfully',
      data: createdAbilities,
      count: createdAbilities.length
    });
  } catch (error) {
    console.error('Error resetting abilities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset abilities',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;