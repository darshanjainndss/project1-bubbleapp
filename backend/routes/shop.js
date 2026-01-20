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
                        user.gameData.abilities.set(ability, 2); // Default base count
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

// Initialize default shop items
router.post('/initialize', async (req, res) => {
    try {
        const defaultItems = [
            // Coin Packs
            {
                name: 'coin_pack_100',
                displayName: '100 Coins Pack',
                description: 'Get 100 coins to buy power-ups and abilities.',
                type: 'coin_pack',
                icon: 'monetization-on',
                color: '#FFD60A',
                priceCoins: 0,
                priceMoney: 29,
                currency: '₹',
                coinReward: 100,
                sortOrder: 1
            },
            {
                name: 'coin_pack_500',
                displayName: '500 Coins Pack',
                description: 'A medium pack of 500 coins for more power.',
                type: 'coin_pack',
                icon: 'savings',
                color: '#FFD60A',
                priceCoins: 0,
                priceMoney: 99,
                currency: '₹',
                coinReward: 500,
                sortOrder: 2
            },
            {
                name: 'coin_pack_1200',
                displayName: '1200 Coins Pack',
                description: 'Best value! 1200 coins for big spenders.',
                type: 'coin_pack',
                icon: 'account-balance-wallet',
                color: '#FFD60A',
                priceCoins: 0,
                priceMoney: 199,
                currency: '₹',
                coinReward: 1200,
                sortOrder: 3
            },
            // Ability Bundles
            {
                name: 'starter_ability_pack',
                displayName: 'Starter Pack',
                description: '5x each ability to get you started.',
                type: 'bundle',
                icon: 'card-giftcard',
                color: '#4CAF50',
                priceCoins: 0,
                priceMoney: 49,
                currency: '₹',
                items: [
                    { abilityName: 'lightning', quantity: 5 },
                    { abilityName: 'bomb', quantity: 5 },
                    { abilityName: 'freeze', quantity: 5 },
                    { abilityName: 'fire', quantity: 5 }
                ],
                sortOrder: 4
            },
            {
                name: 'pro_ability_pack',
                displayName: 'Pro Ability Pack',
                description: '15x each ability for serious players.',
                type: 'bundle',
                icon: 'stars',
                color: '#2196F3',
                priceCoins: 0,
                priceMoney: 99,
                currency: '₹',
                items: [
                    { abilityName: 'lightning', quantity: 15 },
                    { abilityName: 'bomb', quantity: 15 },
                    { abilityName: 'freeze', quantity: 15 },
                    { abilityName: 'fire', quantity: 15 }
                ],
                sortOrder: 5
            },
            {
                name: 'mega_all_ability_pack',
                displayName: 'Mega Pack',
                description: '50x each ability. Never run out of power!',
                type: 'bundle',
                icon: 'diamond',
                color: '#E91E63',
                priceCoins: 0,
                priceMoney: 299,
                currency: '₹',
                items: [
                    { abilityName: 'lightning', quantity: 50 },
                    { abilityName: 'bomb', quantity: 50 },
                    { abilityName: 'freeze', quantity: 50 },
                    { abilityName: 'fire', quantity: 50 }
                ],
                sortOrder: 6
            },
            // Subscriptions
            {
                name: 'vip_monthly',
                displayName: 'Monthly VIP',
                description: '30 days of VIP benefits!',
                type: 'subscription',
                icon: 'crown',
                color: '#FFD700',
                priceCoins: 0,
                priceMoney: 199,
                currency: '₹',
                subscriptionDays: 30,
                features: ['Ad-free experience', 'Double daily rewards', 'Special VIP badge'],
                sortOrder: 7
            },
            {
                name: 'vip_yearly',
                displayName: 'Yearly VIP',
                description: '365 days of VIP benefits! Best value!',
                type: 'subscription',
                icon: 'crown',
                color: '#FFD700',
                priceCoins: 0,
                priceMoney: 1999,
                currency: '₹',
                subscriptionDays: 365,
                features: ['Ad-free experience', 'Triple daily rewards', 'Special VIP badge', 'Exclusive levels'],
                sortOrder: 8
            }
        ];

        // Clear existing items and insert defaults
        await ShopItem.deleteMany({});
        const result = await ShopItem.insertMany(defaultItems);

        res.json({
            success: true,
            message: 'Shop initialized with production-ready items',
            count: result.length
        });
    } catch (error) {
        console.error('Error initializing shop:', error);
        res.status(500).json({ success: false, message: 'Failed to initialize shop' });
    }
});

module.exports = router;
