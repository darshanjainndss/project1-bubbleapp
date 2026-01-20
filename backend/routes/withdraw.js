const express = require('express');
const router = express.Router();
const { ethers } = require('ethers');
const auth = require('../middleware/auth');
const RewardHistory = require('../models/RewardHistory');
const WithdrawHistory = require('../models/WithdrawHistory');
const User = require('../models/User');

// @route   POST /api/withdraw/request
// @desc    Process a withdrawal request
// @access  Private
router.post('/request', auth, async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // 1. Find all claimed rewards for this user email (LINKING BY EMAIL)
        const claimedRewards = await RewardHistory.find({
            email: user.email,
            status: 'claimed'
        });

        if (claimedRewards.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No claimed rewards available for withdrawal'
            });
        }

        // 2. Calculate total score earnings
        const totalScoreEarning = claimedRewards.reduce(
            (sum, r) => sum + (r.reward || r.scoreEarning || 0),
            0
        );

        // 3. Wallet address validation
        const { walletAddress } = req.body;

        if (!walletAddress) {
            return res.status(400).json({
                success: false,
                message: 'Wallet address is required'
            });
        }

        // Using ethers.isAddress as requested
        const isValidWallet = ethers.isAddress(walletAddress);

        if (!isValidWallet) {
            return res.status(400).json({
                success: false,
                message: 'Invalid Ethereum wallet address'
            });
        }

        // 4. Create WithdrawHistory entry (LINKING BY EMAIL)
        const withdrawRequest = new WithdrawHistory({
            email: user.email,
            reward: totalScoreEarning,
            status: 'pending',
            walletAddress,
            token: 'SHIB',
            date: new Date(),
            createdDate: new Date()
        });

        await withdrawRequest.save();

        // 5. Update RewardHistory status using IDs found earlier
        await RewardHistory.updateMany(
            { _id: { $in: claimedRewards.map(r => r._id) } },
            {
                status: 'withdrawn',
                withdrawnDate: new Date()
            }
        );

        res.json({
            success: true,
            message: 'Withdrawal request submitted successfully',
            amount: totalScoreEarning,
            requestId: withdrawRequest._id
        });

    } catch (error) {
        console.error('Withdraw request error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during withdrawal'
        });
    }
});

// @route   GET /api/withdraw/reward-history
// @desc    Get user's reward history using email
// @access  Private
router.get('/reward-history', auth, async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const history = await RewardHistory.find({ email: user.email })
            .sort({ date: -1 });

        res.json({
            success: true,
            history
        });
    } catch (error) {
        console.error('Fetch reward history error:', error);
        res.status(500).json({ success: false, message: 'Server error fetching reward history' });
    }
});

// @route   GET /api/withdraw/withdraw-history
// @desc    Get user's withdrawal history using email
// @access  Private
router.get('/withdraw-history', auth, async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const history = await WithdrawHistory.find({ email: user.email })
            .sort({ date: -1 });

        res.json({
            success: true,
            history
        });
    } catch (error) {
        console.error('Fetch withdraw history error:', error);
        res.status(500).json({ success: false, message: 'Server error fetching withdraw history' });
    }
});

module.exports = router;
