const express = require('express');
const LevelReward = require('../models/LevelReward');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/rewards/history
// @desc    Get user's reward history
// @access  Private
router.get('/history', auth, async (req, res) => {
    try {
        const { limit = 50 } = req.query;

        const rewards = await LevelReward.getUserRewardHistory(
            req.userId,
            parseInt(limit)
        );

        const totalCoins = await LevelReward.getTotalRewardCoins(req.userId);

        res.json({
            success: true,
            rewards,
            totalCoins,
            count: rewards.length
        });

    } catch (error) {
        console.error('Get reward history error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching reward history'
        });
    }
});

// @route   GET /api/rewards/level/:level
// @desc    Check if reward for specific level has been claimed
// @access  Private
router.get('/level/:level', auth, async (req, res) => {
    try {
        const { level } = req.params;

        const reward = await LevelReward.findOne({
            userId: req.userId,
            level: parseInt(level)
        });

        res.json({
            success: true,
            level: parseInt(level),
            claimed: !!reward,
            reward: reward || null
        });

    } catch (error) {
        console.error('Check level reward error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error checking level reward'
        });
    }
});

// @route   GET /api/rewards/stats
// @desc    Get reward statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
    try {
        const rewards = await LevelReward.find({ userId: req.userId });

        const stats = {
            totalRewards: rewards.length,
            totalCoins: rewards.reduce((sum, r) => sum + r.coinsAwarded, 0),
            twoStarRewards: rewards.filter(r => r.stars === 2).length,
            threeStarRewards: rewards.filter(r => r.stars === 3).length,
            highestLevel: rewards.length > 0 ? Math.max(...rewards.map(r => r.level)) : 0
        };

        res.json({
            success: true,
            stats
        });

    } catch (error) {
        console.error('Get reward stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching reward stats'
        });
    }
});

module.exports = router;
