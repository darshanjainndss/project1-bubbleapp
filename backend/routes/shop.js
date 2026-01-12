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

// Initialize shop items (Seeding)
router.post('/initialize', async (req, res) => {
    try {
        const defaultItems = [
            // Combos
            {
                name: 'combo_lightning_10',
                displayName: 'Lightning Pack (10x)',
                description: 'Get 10 Lightning abilities to blast through levels!',
                type: 'bundle',
                icon: 'flash-on',
                color: '#FFD600',
                priceCoins: 200,
                priceMoney: 100,
                currency: 'INR',
                items: [{ abilityName: 'lightning', quantity: 10 }],
                sortOrder: 1
            },
            {
                name: 'combo_bomb_10',
                displayName: 'Bomb Pack (10x)',
                description: 'Get 10 Bomb abilities for massive destruction!',
                type: 'bundle',
                icon: 'dangerous',
                color: '#FF4444',
                priceCoins: 300,
                priceMoney: 150,
                currency: 'INR',
                items: [{ abilityName: 'bomb', quantity: 10 }],
                sortOrder: 2
            },
            {
                name: 'combo_all_abilities',
                displayName: 'Ultimate Combo',
                description: '5 of each ability: Lightning, Bomb, Freeze, and Fire!',
                type: 'bundle',
                icon: 'layers',
                color: '#FF00FF',
                priceCoins: 500,
                priceMoney: 250,
                currency: 'INR',
                items: [
                    { abilityName: 'lightning', quantity: 5 },
                    { abilityName: 'bomb', quantity: 5 },
                    { abilityName: 'freeze', quantity: 5 },
                    { abilityName: 'fire', quantity: 5 }
                ],
                sortOrder: 3
            },
            {
                name: 'combo_starter_pack',
                displayName: 'Starter Pack',
                description: '3 Lightning + 3 Freeze abilities for beginners!',
                type: 'bundle',
                icon: 'card-giftcard',
                color: '#00FFFF',
                priceCoins: 150,
                priceMoney: 75,
                currency: 'INR',
                items: [
                    { abilityName: 'lightning', quantity: 3 },
                    { abilityName: 'freeze', quantity: 3 }
                ],
                sortOrder: 4
            },
            // Subscriptions
            {
                name: 'sub_1_week',
                displayName: 'Pro Week',
                description: 'Enjoy 1 week of maintenance-free gaming with NO ADS!',
                type: 'subscription',
                icon: 'calendar-today',
                color: '#00FF88',
                priceCoins: 0,
                priceMoney: 150,
                currency: 'INR',
                subscriptionDays: 7,
                features: ['No Ads'],
                sortOrder: 10
            },
            {
                name: 'sub_1_month',
                displayName: 'Elite Month',
                description: 'Ultimate 1 month subscription with NO ADS and daily bonus!',
                type: 'subscription',
                icon: 'stars',
                color: '#FFD700',
                priceCoins: 0,
                priceMoney: 499,
                currency: 'INR',
                subscriptionDays: 30,
                features: ['No Ads', 'Daily Bonus', '2x Coin Rewards'],
                sortOrder: 11
            },
            // Individual Abilities
            {
                name: 'ability_lightning',
                displayName: 'Lightning',
                description: 'Destroys an entire row',
                type: 'ability',
                icon: 'flash-on',
                color: '#00E0FF',
                priceCoins: 58,
                priceMoney: 0,
                currency: 'INR',
                items: [{ abilityName: 'lightning', quantity: 1 }],
                sortOrder: 20
            },
            {
                name: 'ability_bomb',
                displayName: 'Bomb',
                description: 'Destroys neighboring bubbles',
                type: 'ability',
                icon: 'dangerous',
                color: '#FF4444',
                priceCoins: 75,
                priceMoney: 0,
                currency: 'INR',
                items: [{ abilityName: 'bomb', quantity: 1 }],
                sortOrder: 21
            },
            {
                name: 'ability_freeze',
                displayName: 'Freeze',
                description: 'Freezes a column for easier targeting',
                type: 'ability',
                icon: 'ac-unit',
                color: '#00FFFF',
                priceCoins: 30,
                priceMoney: 0,
                currency: 'INR',
                items: [{ abilityName: 'freeze', quantity: 1 }],
                sortOrder: 22
            },
            {
                name: 'ability_fire',
                displayName: 'Fire',
                description: 'Burns through obstacles and metal bubbles',
                type: 'ability',
                icon: 'local-fire-department',
                color: '#FF6600',
                priceCoins: 40,
                priceMoney: 0,
                currency: 'INR',
                items: [{ abilityName: 'fire', quantity: 1 }],
                sortOrder: 23
            }
        ];

        for (const itemData of defaultItems) {
            await ShopItem.findOneAndUpdate(
                { name: itemData.name },
                itemData,
                { upsert: true, new: true }
            );
        }

        res.json({ success: true, message: 'Shop items initialized' });
    } catch (error) {
        console.error('Error initializing shop items:', error);
        res.status(500).json({ success: false, message: 'Initialization failed' });
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

        const user = await User.findById(req.userId);
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
            
            // Handle coin rewards (for coin packs)
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
