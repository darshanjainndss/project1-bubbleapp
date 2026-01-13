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
            // 10x Ability Packs
            {
                name: 'combo_lightning_10',
                displayName: 'Lightning Pack (10x)',
                description: 'Strike down your obstacles with 10 Lightning strikes!',
                type: 'bundle',
                icon: 'flash',
                color: '#FFD700',
                priceCoins: 500,
                priceMoney: 99,
                currency: 'INR',
                items: [{ abilityName: 'lightning', quantity: 10 }],
                sortOrder: 1
            },
            {
                name: 'combo_bomb_10',
                displayName: 'Bomb Pack (10x)',
                description: 'Explosive power! Set off 10 massive blasts!',
                type: 'bundle',
                icon: 'bomb',
                color: '#FF4444',
                priceCoins: 650,
                priceMoney: 129,
                currency: 'INR',
                items: [{ abilityName: 'bomb', quantity: 10 }],
                sortOrder: 2
            },
            {
                name: 'combo_freeze_10',
                displayName: 'Freeze Pack (10x)',
                description: 'Cool things down with 10 Freeze abilities!',
                type: 'bundle',
                icon: 'snowflake',
                color: '#00BFFF',
                priceCoins: 250,
                priceMoney: 49,
                currency: 'INR',
                items: [{ abilityName: 'freeze', quantity: 10 }],
                sortOrder: 3
            },
            {
                name: 'combo_fire_10',
                displayName: 'Fire Pack (10x)',
                description: 'Burn it all! Get 10 intense Fire abilities!',
                type: 'bundle',
                icon: 'fire',
                color: '#FF6600',
                priceCoins: 350,
                priceMoney: 79,
                currency: 'INR',
                items: [{ abilityName: 'fire', quantity: 10 }],
                sortOrder: 4
            },
            // All-In-One Pack
            {
                name: 'combo_all_abilities_10',
                displayName: 'Mega All-Ability Pack',
                description: 'The Ultimate Choice! 10 of EVERYTHING!',
                type: 'bundle',
                icon: 'diamond',
                color: '#FF00FF',
                priceCoins: 1500,
                priceMoney: 299,
                currency: 'INR',
                items: [
                    { abilityName: 'lightning', quantity: 10 },
                    { abilityName: 'bomb', quantity: 10 },
                    { abilityName: 'freeze', quantity: 10 },
                    { abilityName: 'fire', quantity: 10 }
                ],
                sortOrder: 5
            },
            // Ad-Free Subscriptions
            {
                name: 'sub_1_week',
                displayName: 'Weekly Ad-Free',
                description: 'Gaming without interruptions! 1 week of NO ADS.',
                type: 'subscription',
                icon: 'calendar-outline',
                color: '#00FF88',
                priceCoins: 0,
                priceMoney: 99,
                currency: 'INR',
                subscriptionDays: 7,
                features: ['No Ads'],
                sortOrder: 10
            },
            {
                name: 'sub_1_month',
                displayName: 'Monthly Ad-Free',
                description: 'The Best Value! A full month of NO ADS gaming.',
                type: 'subscription',
                icon: 'crown',
                color: '#FFD700',
                priceCoins: 0,
                priceMoney: 299,
                currency: 'INR',
                subscriptionDays: 30,
                features: ['No Ads', 'Daily Bonus'],
                sortOrder: 11
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
