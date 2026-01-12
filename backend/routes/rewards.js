const express = require('express');
const RewardHistory = require('../models/RewardHistory');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/rewards/history
// @desc    Get user's reward history
// @access  Private
router.get('/history', auth, async (req, res) => {
    try {
        const { limit = 50 } = req.query;

        const rewards = await RewardHistory.find({ userId: req.userId })
            .sort({ level: -1, date: -1 })
            .limit(parseInt(limit))
            .lean();

        // Calculate total coins from rewards
        const totalCoinsResult = await RewardHistory.aggregate([
            { $match: { userId: new require('mongoose').Types.ObjectId(req.userId) } },
            { $group: { _id: null, total: { $sum: '$coins' } } }
        ]);
        const totalCoins = totalCoinsResult.length > 0 ? totalCoinsResult[0].total : 0;

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

        const reward = await RewardHistory.findOne({
            userId: req.userId,
            level: parseInt(level),
            status: { $in: ['claimed', 'withdrawn'] }
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
        const rewards = await RewardHistory.find({ userId: req.userId });

        const stats = {
            totalRewards: rewards.length,
            totalCoins: rewards.reduce((sum, r) => sum + r.coins, 0),
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
