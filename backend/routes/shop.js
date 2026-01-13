const express = require('express');
const ShopItem = require('../models/ShopItem');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all active shop items
router.get('/', async (req, res) => {
    try {
        const items = await ShopItem.find({ isActive: true }).sort({ sortOrder: 1 });
        res.json({
            success: true,
            data: items
        });
    } catch (error) {
        console.error('Error fetching shop items:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch shop items' });
    }
});

// Create new shop item
router.post('/', async (req, res) => {
    try {
        const itemData = req.body;

        // Basic validation
        if (!itemData.name || !itemData.type) {
            return res.status(400).json({ success: false, message: 'Name and type are required' });
        }

        const newItem = new ShopItem(itemData);
        await newItem.save();

        res.status(201).json({
            success: true,
            message: 'Shop item created',
            data: newItem
        });
    } catch (error) {
        console.error('Error creating shop item:', error);
        res.status(500).json({ success: false, message: 'Failed to create shop item', error: error.message });
    }
});

// Update shop item
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const item = await ShopItem.findByIdAndUpdate(id, updates, { new: true });

        if (!item) {
            return res.status(404).json({ success: false, message: 'Shop item not found' });
        }

        res.json({
            success: true,
            message: 'Shop item updated',
            data: item
        });
    } catch (error) {
        console.error('Error updating shop item:', error);
        res.status(500).json({ success: false, message: 'Failed to update shop item', error: error.message });
    }
});

// Delete shop item
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const item = await ShopItem.findByIdAndDelete(id);

        if (!item) {
            return res.status(404).json({ success: false, message: 'Shop item not found' });
        }

        res.json({
            success: true,
            message: 'Shop item deleted',
            data: item
        });
    } catch (error) {
        console.error('Error deleting shop item:', error);
        res.status(500).json({ success: false, message: 'Failed to delete shop item', error: error.message });
    }
});

// Purchase route
router.post('/purchase', auth, async (req, res) => {
    try {
        const { itemId, paymentMethod } = req.body; // paymentMethod: 'coins' | 'money'

        const item = await ShopItem.findById(itemId);
        if (!item) {
            return res.status(404).json({ success: false, message: 'Item not found' });
        }

        const user = req.user;
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (paymentMethod === 'coins') {
            if (item.priceCoins <= 0) {
                return res.status(400).json({ success: false, message: 'Item cannot be purchased with coins' });
            }
            if (user.gameData.totalCoins < item.priceCoins) {
                return res.status(400).json({ success: false, message: 'Insufficient coins' });
            }
            user.gameData.totalCoins -= item.priceCoins;
        } else if (paymentMethod === 'money') {
            if (item.priceMoney <= 0) {
                return res.status(400).json({ success: false, message: 'Item cannot be purchased with money' });
            }
            // In a real app, verify payment receipt here
            console.log(`Processing real money purchase for ${user.email}: ${item.displayName}`);
        } else {
            return res.status(400).json({ success: false, message: 'Invalid payment method' });
        }

        // Apply item rewards
        if (item.type === 'ability' || item.type === 'bundle') {
            // Handle ability rewards
            if (item.items && item.items.length > 0) {
                console.log('🛒 Adding abilities from purchase:', item.items);

                // Initialize abilities if they don't exist
                if (!user.gameData.abilities || user.gameData.abilities.size === 0) {
                    console.log('🛒 Initializing user abilities');
                    user.gameData.abilities = new Map();
                    // Set default starting counts for all abilities
                    const defaultAbilities = ['lightning', 'bomb', 'freeze', 'fire'];
                    defaultAbilities.forEach(ability => {
                        user.gameData.abilities.set(ability, 2); // Default starting count
                    });
                }

                item.items.forEach(bundleItem => {
                    const currentCount = user.gameData.abilities.get(bundleItem.abilityName) || 2;
                    const newCount = currentCount + bundleItem.quantity;
                    user.gameData.abilities.set(bundleItem.abilityName, newCount);
                    console.log(`🛒 ${bundleItem.abilityName}: ${currentCount} + ${bundleItem.quantity} = ${newCount}`);
                });
            }
        } else if (item.type === 'coin_pack') {
            // Handle coin pack rewards
            if (item.coinReward && item.coinReward > 0) {
                user.gameData.totalCoins += item.coinReward;
                console.log('🛒 Added coin reward:', item.coinReward);
            }
        } else if (item.type === 'subscription') {
            // Handle subscription logic (e.g. set expiry date)
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + item.subscriptionDays);

            // We might need to add subscription fields to User model if they don't exist
            user.subscription = {
                active: true,
                type: item.name,
                expiresAt: expiryDate,
                features: item.features
            };
        }

        await user.save();

        // Convert Map to plain object for JSON response
        const abilitiesObj = {};
        if (user.gameData.abilities) {
            user.gameData.abilities.forEach((value, key) => {
                abilitiesObj[key] = value;
            });
        }

        console.log('🛒 Purchase successful, returning abilities:', abilitiesObj);

        res.json({
            success: true,
            message: 'Purchase successful',
            newCoinBalance: user.gameData.totalCoins,
            abilities: abilitiesObj,
            subscription: user.subscription
        });

    } catch (error) {
        console.error('Purchase error:', error);
        res.status(500).json({ success: false, message: 'Purchase failed' });
    }
});

module.exports = router;
