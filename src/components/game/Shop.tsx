import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Animated,
    Dimensions,
} from 'react-native';
import MaterialIcon from '../common/MaterialIcon';
import RewardedAdButton from '../common/RewardedAdButton';
import ToastNotification, { ToastRef } from '../common/ToastNotification';
import { GAME_ICONS, ICON_COLORS, ICON_SIZES } from '../../config/icons';
import BackendService, { type ShopItem } from '../../services/BackendService';

const { height } = Dimensions.get('window');

interface ShopProps {
    visible: boolean;
    onClose: () => void;
    coins: number;
    onCoinsUpdate: (newCoins: number) => void;
    abilityInventory: Record<string, number>;
    onInventoryUpdate: (newInventory: Record<string, number>) => void;
    abilityStartingCounts: Record<string, number>;
    onWatchAd: (amount: number) => void;
    adRewardAmount: number;
}

const ABILITY_ICON_MAP: Record<string, { name: string; family: string; color: string }> = {
    lightning: { name: 'flash', family: 'material', color: '#FFD700' },
    bomb: { name: 'bomb', family: 'material-community', color: '#FF4444' },
    freeze: { name: 'snowflake', family: 'material-community', color: '#00BFFF' },
    fire: { name: 'fire', family: 'material-community', color: '#FF6600' },
};

const SHOP_ICON_MAP: Record<string, { name: string; family: string }> = {
    'flash': { name: 'flash', family: 'material' },
    'bomb': { name: 'bomb', family: 'material-community' },
    'snowflake': { name: 'snowflake', family: 'material-community' },
    'fire': { name: 'fire', family: 'material-community' },
    'star': { name: 'star', family: 'material' },
    'gift': { name: 'gift', family: 'material-community' },
    'diamond': { name: 'diamond', family: 'material-community' },
    'calendar-outline': { name: 'calendar-today', family: 'material' },
    'crown': { name: 'crown', family: 'material-community' },
    'trophy': { name: 'trophy', family: 'material' },
    'monetization-on': { name: 'monetization-on', family: 'material' },
    'account-balance-wallet': { name: 'account-balance-wallet', family: 'material' },
    'savings': { name: 'savings', family: 'material' },
};

const Shop: React.FC<ShopProps> = ({
    visible,
    onClose,
    coins,
    onCoinsUpdate,
    abilityInventory,
    onInventoryUpdate,
    abilityStartingCounts,
    onWatchAd,
    adRewardAmount,
}) => {
    const [shopItems, setShopItems] = useState<ShopItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState<string | null>(null);
    const toastRef = useRef<ToastRef>(null);
    const slideAnim = useRef(new Animated.Value(0)).current;

    const [successItem, setSuccessItem] = useState<ShopItem | null>(null);
    const [selectedForPurchase, setSelectedForPurchase] = useState<ShopItem | null>(null);
    const [showAddCoins, setShowAddCoins] = useState(false);

    useEffect(() => {
        if (visible) {
            loadShopItems();
            Animated.spring(slideAnim, {
                toValue: 1,
                useNativeDriver: true,
                tension: 50,
                friction: 8,
            }).start();
        } else {
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start();
        }
    }, [visible]);

    const loadShopItems = async () => {
        try {
            setLoading(true);
            const result = await BackendService.getShopItems();
            console.log('🛒 Shop loaded items:', result);

            if (!result.success || !result.items) {
                throw new Error(result.error || 'Failed to load shop items');
            }

            setShopItems(result.items);
        } catch (error) {
            console.error('Failed to load shop items:', error);
            toastRef.current?.show('Failed to load shop. Please check your connection.', 'error');
            // Delay closing so the user can see the error toast
            setTimeout(() => onClose(), 2000);
        } finally {
            setLoading(false);
        }
    };

    const purchaseItem = async (item: ShopItem, paymentMethod: 'coins' | 'money') => {
        if (paymentMethod === 'coins' && coins < item.priceCoins) {
            toastRef.current?.show(`Need ${item.priceCoins} coins, you have ${coins}`, 'error');
            return;
        }

        if (paymentMethod === 'money') {
            toastRef.current?.show('Real money purchases coming soon!', 'info');
            return;
        }

        setPurchasing(item._id);
        try {
            const result = await BackendService.purchaseShopItem(item._id, paymentMethod);

            if (result.success) {
                // Update coins
                if (result.newCoinBalance !== undefined) {
                    onCoinsUpdate(result.newCoinBalance);
                }

                // Update abilities - backend returns TOTAL abilities, we need to calculate purchased
                if (result.abilities) {
                    console.log('🛒 Purchase result abilities:', result.abilities);

                    // Calculate purchased abilities (total - base counts)
                    const newInventory: Record<string, number> = {};
                    Object.entries(result.abilities).forEach(([abilityName, totalCount]) => {
                        const baseCount = abilityStartingCounts[abilityName] || 2;
                        const purchasedCount = Math.max(0, (totalCount as number) - baseCount);
                        newInventory[abilityName] = purchasedCount;
                        console.log(`🛒 ${abilityName}: total=${totalCount}, base=${baseCount}, purchased=${purchasedCount}`);
                    });

                    console.log('🛒 New inventory:', newInventory);
                    onInventoryUpdate(newInventory);

                    // Also save to backend to ensure persistence
                    try {
                        await BackendService.updateAbilities(result.abilities);
                        console.log('✅ Abilities saved to backend');
                    } catch (saveError) {
                        console.error('❌ Failed to save abilities to backend:', saveError);
                    }
                }

                // Show Success Modal
                setSuccessItem(item);
            } else {
                toastRef.current?.show(result.error || 'Purchase failed', 'error');
            }
        } catch (error) {
            console.error('Purchase error:', error);
            toastRef.current?.show('Purchase failed', 'error');
        } finally {
            setPurchasing(null);
        }
    };

    const onPurchasePress = (item: ShopItem) => {
        setSelectedForPurchase(item);
    };

    const executePurchase = async (item: ShopItem, method: 'coins' | 'money') => {
        setSelectedForPurchase(null);
        await purchaseItem(item, method);
    };

    const getTypeBadgeColor = (type: string) => {
        switch (type) {
            case 'ability': return '#45B7D1';
            case 'bundle': return '#FF6B35';
            case 'subscription': return '#4ECDC4';
            default: return '#6C757D';
        }
    };

    const getTypeBadgeText = (type: string) => {
        switch (type) {
            case 'bundle': return 'PACK';
            case 'subscription': return 'VIP';
            case 'ability': return 'POWER';
            default: return type.toUpperCase();
        }
    };

    const getIconData = (item: ShopItem) => {
        // First check if it's an ability item
        if (item.type === 'ability' && item.items && item.items[0]) {
            const abilityName = item.items[0].abilityName;
            return ABILITY_ICON_MAP[abilityName] || { name: 'star', family: 'material', color: item.color };
        }

        // Then check shop icon mapping
        const shopIcon = SHOP_ICON_MAP[item.icon];
        if (shopIcon) {
            return { ...shopIcon, color: item.color };
        }

        // Fallback to item icon or default
        return { name: item.icon || 'star', family: 'material', color: item.color };
    };

    const renderInventorySection = () => {
        const totalAbilities = Object.keys(abilityInventory).length;
        if (totalAbilities === 0) return null;

        return (
            <View style={styles.inventorySection}>
                <View style={styles.sectionHeader}>
                    <MaterialIcon name="inventory" family="material" size={20} color="#00E0FF" />
                    <Text style={styles.sectionTitle}>YOUR INVENTORY</Text>
                    <View style={styles.sectionLine} />
                </View>

                <View style={styles.inventoryGrid}>
                    {Object.entries(abilityInventory).map(([abilityName, count]) => {
                        const iconData = ABILITY_ICON_MAP[abilityName];
                        if (!iconData || count <= 0) return null;

                        return (
                            <View key={abilityName} style={styles.inventoryItem}>
                                <View style={[styles.inventoryIcon, { borderColor: iconData.color, backgroundColor: `${iconData.color}15` }]}>
                                    <MaterialIcon
                                        name={iconData.name}
                                        family={iconData.family as any}
                                        size={24}
                                        color={iconData.color}
                                    />
                                </View>
                                <Text style={styles.inventoryName}>{abilityName.charAt(0).toUpperCase() + abilityName.slice(1)}</Text>
                                <View style={styles.inventoryCount}>
                                    <Text style={styles.inventoryCountText}>{count}</Text>
                                </View>
                            </View>
                        );
                    })}
                </View>

                <Text style={styles.inventoryHint}>⚡ These abilities are ready for your next level!</Text>
            </View>
        );
    };

    const renderPaymentModal = () => {
        if (!selectedForPurchase) return null;

        const item = selectedForPurchase;
        const canAffordCoins = coins >= item.priceCoins;
        const iconData = getIconData(item);

        return (
            <View style={styles.modalOverlay}>
                <View style={styles.paymentModal}>
                    {/* Item Preview */}
                    <View style={styles.paymentItemPreview}>
                        <View style={[styles.paymentItemIcon, { borderColor: item.color, backgroundColor: `${item.color}15` }]}>
                            <MaterialIcon
                                name={iconData.name}
                                family={iconData.family as any}
                                size={32}
                                color={item.color || ICON_COLORS.PRIMARY}
                            />
                        </View>
                        <View style={styles.paymentItemInfo}>
                            <Text style={styles.paymentTitle}>{item.displayName}</Text>
                            <Text style={styles.paymentSubtitle}>{item.description}</Text>
                        </View>
                    </View>

                    <Text style={styles.paymentMethodTitle}>Choose Payment Method</Text>

                    <View style={styles.paymentOptions}>
                        {/* Coin Option */}
                        {item.priceCoins > 0 && (
                            <TouchableOpacity
                                style={[
                                    styles.paymentOptionBtn,
                                    styles.coinPaymentBtn,
                                    !canAffordCoins && styles.disabledOption
                                ]}
                                onPress={() => executePurchase(item, 'coins')}
                                disabled={!canAffordCoins}
                                activeOpacity={0.8}
                            >
                                <View style={styles.paymentOptionContent}>
                                    <MaterialIcon name={GAME_ICONS.COIN.name} family={GAME_ICONS.COIN.family} size={24} color={ICON_COLORS.GOLD} />
                                    <View style={styles.paymentOptionText}>
                                        <Text style={[styles.paymentText, !canAffordCoins && styles.disabledText]}>
                                            {item.priceCoins.toLocaleString()} Coins
                                        </Text>
                                        {!canAffordCoins && <Text style={styles.errorTextSmall}>Not enough coins</Text>}
                                    </View>
                                </View>
                            </TouchableOpacity>
                        )}

                        {/* Money Option */}
                        {item.priceMoney > 0 && (
                            <TouchableOpacity
                                style={[styles.paymentOptionBtn, styles.moneyPaymentBtn]}
                                onPress={() => executePurchase(item, 'money')}
                                activeOpacity={0.8}
                            >
                                <View style={styles.paymentOptionContent}>
                                    <MaterialIcon name="credit-card" family="material" size={24} color="#4CAF50" />
                                    <View style={styles.paymentOptionText}>
                                        <Text style={styles.paymentText}>
                                            {item.currency || '₹'} {item.priceMoney}
                                        </Text>
                                        <Text style={styles.paymentMethodSubtext}>Real Money</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        )}
                    </View>

                    <TouchableOpacity style={styles.cancelButton} onPress={() => setSelectedForPurchase(null)}>
                        <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const renderAddCoinsModal = () => {
        if (!showAddCoins) return null;

        const coinPacks = shopItems
            .filter(item => item.type === 'coin_pack')
            .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

        return (
            <View style={styles.modalOverlay}>
                <View style={styles.addCoinsModal}>
                    <View style={styles.addCoinsHeader}>
                        <MaterialIcon name="monetization-on" family="material" size={32} color="#FFD700" />
                        <Text style={styles.addCoinsTitle}>Get More Coins</Text>
                        <TouchableOpacity
                            style={styles.addCoinsClose}
                            onPress={() => setShowAddCoins(false)}
                        >
                            <MaterialIcon name="close" family="material" size={20} color="#FFF" />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.addCoinsSubtitle}>Choose your coin package</Text>

                    <View style={styles.coinPacksGrid}>
                        {coinPacks.length > 0 ? (
                            coinPacks.map((item) => (
                                <TouchableOpacity
                                    key={item._id}
                                    style={[
                                        styles.coinPackCard,
                                        item.name.includes('1200') && styles.coinPackPopular // Best value indicator
                                    ]}
                                    onPress={() => {
                                        setShowAddCoins(false);
                                        onPurchasePress(item);
                                    }}
                                    activeOpacity={0.8}
                                >
                                    {item.name.includes('1200') && (
                                        <View style={styles.popularBadge}>
                                            <Text style={styles.popularText}>BEST VALUE</Text>
                                        </View>
                                    )}

                                    <View style={styles.coinPackIcon}>
                                        <MaterialIcon
                                            name={item.icon || 'monetization-on'}
                                            family="material"
                                            size={28}
                                            color="#FFD700"
                                        />
                                    </View>

                                    <Text style={styles.coinPackAmount}>{(item as any).coinReward?.toLocaleString() || '0'}</Text>
                                    <Text style={styles.coinPackCoins}>Coins</Text>

                                    <View style={styles.coinPackPrice}>
                                        <Text style={styles.coinPackPriceText}>
                                            {item.currency || '₹'}{item.priceMoney}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            ))
                        ) : (
                            <View style={{ padding: 20 }}>
                                <Text style={{ color: '#94A3B8', textAlign: 'center' }}>No coin packs available at the moment.</Text>
                            </View>
                        )}
                    </View>

                    <TouchableOpacity
                        style={styles.addCoinsCancelBtn}
                        onPress={() => setShowAddCoins(false)}
                    >
                        <Text style={styles.addCoinsCancelText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    if (!visible) return null;

    const translateY = slideAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [height, 0],
    });

    const scale = slideAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.8, 1],
    });

    return (
        <View style={styles.overlay}>
            <Animated.View style={[styles.container, { transform: [{ translateY }, { scale }] }]}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <MaterialIcon name="shopping-cart" family="material" size={24} color="#00E0FF" />
                        <Text style={styles.title}>ITEM SHOP</Text>
                    </View>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <MaterialIcon
                            name="close"
                            family="material"
                            size={ICON_SIZES.MEDIUM}
                            color={ICON_COLORS.WHITE}
                        />
                    </TouchableOpacity>
                </View>

                {/* Coins Display */}
                <View style={styles.coinsContainer}>
                    <View>
                        <Text style={styles.coinsLabel}>YOUR BALANCE</Text>
                        <View style={styles.coinsValueRow}>
                            <MaterialIcon
                                name={GAME_ICONS.COIN.name}
                                family={GAME_ICONS.COIN.family}
                                size={32}
                                color={ICON_COLORS.GOLD}
                            />
                            <Text style={styles.coinsText}>{coins.toLocaleString()}</Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={styles.addCoinsBtn}
                        onPress={() => setShowAddCoins(true)}
                        activeOpacity={0.8}
                    >
                        <MaterialIcon name="add" family="material" size={20} color="#000" />
                    </TouchableOpacity>
                </View>

                {/* Content */}
                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={ICON_COLORS.PRIMARY} />
                            <Text style={styles.loadingText}>Loading shop...</Text>
                        </View>
                    ) : (
                        <View style={styles.scrollPadding}>
                            {/* Inventory Section */}
                            {renderInventorySection()}

                            {/* Earn Coins Section */}
                            <View style={styles.earnSection}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.earnTitle}>NEED MORE COINS?</Text>
                                    <Text style={styles.earnDescription}>
                                        Watch a video to earn {adRewardAmount} coins instantly!
                                    </Text>
                                </View>
                                <RewardedAdButton
                                    onReward={onWatchAd}
                                    rewardAmount={adRewardAmount}
                                    style={styles.adButton}
                                />
                            </View>

                            {/* Shop Items Grid */}
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>FEATURED PACKS</Text>
                                <View style={styles.sectionLine} />
                            </View>

                            <View style={styles.itemsGrid}>
                                {shopItems.map((item) => {
                                    const iconData = getIconData(item);
                                    const hasCoinPrice = item.priceCoins > 0;
                                    const hasMoneyPrice = item.priceMoney > 0;
                                    const canAffordCoins = coins >= item.priceCoins;

                                    return (
                                        <View key={item._id} style={styles.itemCard}>
                                            {/* Type Badge */}
                                            <View style={[styles.typeBadge, { backgroundColor: getTypeBadgeColor(item.type) }]}>
                                                <Text style={styles.typeBadgeText}>{getTypeBadgeText(item.type)}</Text>
                                            </View>

                                            {/* Icon Container with Glow Effect */}
                                            <View style={[styles.itemIconContainer, { shadowColor: item.color }]}>
                                                <View style={[styles.itemIcon, { borderColor: item.color, backgroundColor: `${item.color}15` }]}>
                                                    <MaterialIcon
                                                        name={iconData.name}
                                                        family={iconData.family as any}
                                                        size={ICON_SIZES.XLARGE}
                                                        color={item.color || ICON_COLORS.PRIMARY}
                                                    />
                                                </View>
                                            </View>

                                            {/* Item Info */}
                                            <View style={styles.itemInfo}>
                                                <Text style={styles.itemName} numberOfLines={1}>{item.displayName}</Text>
                                                <Text style={styles.itemDescription} numberOfLines={2}>
                                                    {item.description}
                                                </Text>
                                            </View>

                                            {/* Price Display */}
                                            <View style={styles.priceContainer}>
                                                {hasCoinPrice && (
                                                    <View style={[styles.priceRow, !canAffordCoins && styles.priceRowDisabled]}>
                                                        <MaterialIcon name={GAME_ICONS.COIN.name} family={GAME_ICONS.COIN.family} size={16} color={ICON_COLORS.GOLD} />
                                                        <Text style={[styles.priceText, !canAffordCoins && styles.priceTextDisabled]}>
                                                            {item.priceCoins.toLocaleString()}
                                                        </Text>
                                                    </View>
                                                )}
                                                {hasMoneyPrice && (
                                                    <View style={styles.priceRow}>
                                                        <MaterialIcon name="credit-card" family="material" size={16} color="#4CAF50" />
                                                        <Text style={styles.priceText}>
                                                            {item.currency || '₹'}{item.priceMoney}
                                                        </Text>
                                                    </View>
                                                )}
                                            </View>

                                            {/* Purchase Button */}
                                            <TouchableOpacity
                                                style={[
                                                    styles.buyButton,
                                                    {
                                                        backgroundColor: item.color || ICON_COLORS.PRIMARY,
                                                        shadowColor: item.color || ICON_COLORS.PRIMARY,
                                                    }
                                                ]}
                                                onPress={() => onPurchasePress(item)}
                                                activeOpacity={0.8}
                                                disabled={purchasing === item._id}
                                            >
                                                {purchasing === item._id ? (
                                                    <ActivityIndicator size="small" color="#FFF" />
                                                ) : (
                                                    <>
                                                        <MaterialIcon name="shopping-cart" family="material" size={18} color="#FFFFFF" />
                                                        <Text style={styles.buyButtonText}>GET NOW</Text>
                                                    </>
                                                )}
                                            </TouchableOpacity>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>
                    )}
                </ScrollView>

                {/* Success Modal */}
                {successItem && (
                    <View style={styles.successOverlay}>
                        <View style={styles.successCard}>
                            <View style={[styles.successIconBubble, { borderColor: successItem.color || ICON_COLORS.GOLD }]}>
                                <MaterialIcon
                                    name={successItem.icon || 'check'}
                                    family="material"
                                    size={40}
                                    color={successItem.color || ICON_COLORS.GOLD}
                                />
                            </View>
                            <Text style={styles.successTitle}>PURCHASE SUCCESSFUL!</Text>
                            <Text style={styles.successName}>{successItem.displayName}</Text>
                            <Text style={styles.successDesc}>Your items have been added to your inventory.</Text>

                            <TouchableOpacity
                                style={styles.okButton}
                                onPress={() => setSuccessItem(null)}
                            >
                                <Text style={styles.okButtonText}>OK</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Payment Modal */}
                {renderPaymentModal()}

                {/* Add Coins Modal */}
                {renderAddCoinsModal()}

            </Animated.View>
            <ToastNotification ref={toastRef} />
        </View>
    );
};

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2000,
        padding: 20,
    },
    container: {
        backgroundColor: '#0A0A15',
        borderRadius: 30,
        borderWidth: 1.5,
        borderColor: '#00E0FF',
        width: '100%',
        height: '92%',
        maxHeight: 700,
        shadowColor: '#00E0FF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 30,
        elevation: 25,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    title: {
        color: '#FFF',
        fontSize: 24,
        fontWeight: '900',
        textShadowColor: 'rgba(0, 224, 255, 0.5)',
        textShadowRadius: 10,
        letterSpacing: 2,
        fontFamily: 'monospace',
    },
    closeButton: {
        padding: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    coinsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        paddingHorizontal: 24,
        backgroundColor: 'rgba(255, 215, 0, 0.05)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 215, 0, 0.1)',
    },
    coinsLabel: {
        color: '#888',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 2
    },
    coinsValueRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10
    },
    coinsText: {
        color: '#FFD60A',
        fontSize: 28,
        fontWeight: '900',
        textShadowColor: 'rgba(255, 214, 10, 0.5)',
        textShadowRadius: 10,
        fontFamily: 'monospace',
    },
    addCoinsBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFD60A',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#FFD60A',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
    },
    content: {
        flex: 1,
    },
    scrollPadding: {
        padding: 16,
        paddingBottom: 40,
    },
    loadingContainer: {
        padding: 60,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        color: '#00E0FF',
        marginTop: 15,
        fontSize: 16,
        fontFamily: 'monospace',
        letterSpacing: 1,
    },
    itemsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    itemCard: {
        width: '48%',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        minHeight: 280,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    itemIconContainer: {
        marginBottom: 12,
        marginTop: 8,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 20,
        elevation: 10,
    },
    itemIcon: {
        width: 70,
        height: 70,
        borderRadius: 35,
        borderWidth: 3,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#00E0FF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 15,
    },
    itemInfo: {
        alignItems: 'center',
        marginBottom: 12,
        flex: 1,
    },
    itemName: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 6,
        textAlign: 'center',
        fontFamily: 'monospace',
        letterSpacing: 0.5,
    },
    itemDescription: {
        color: '#94A3B8',
        fontSize: 12,
        textAlign: 'center',
        lineHeight: 16,
        paddingHorizontal: 4,
    },
    priceContainer: {
        alignItems: 'center',
        marginBottom: 12,
        gap: 4,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 4,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderRadius: 12,
    },
    priceRowDisabled: {
        opacity: 0.5,
    },
    priceText: {
        color: '#FFF',
        fontSize: 13,
        fontWeight: 'bold',
        fontFamily: 'monospace',
    },
    priceTextDisabled: {
        color: '#666',
    },
    buyButton: {
        backgroundColor: '#00FF88',
        width: '100%',
        height: 44,
        borderRadius: 22,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 8,
    },
    buyButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '900',
        fontFamily: 'monospace',
        letterSpacing: 1,
    },
    typeBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        zIndex: 10,
    },
    typeBadgeText: {
        color: '#FFF',
        fontSize: 9,
        fontWeight: '900',
        fontFamily: 'monospace',
        letterSpacing: 0.5,
    },
    earnSection: {
        marginBottom: 24,
        padding: 16,
        backgroundColor: 'rgba(0, 224, 255, 0.05)',
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: 'rgba(0, 224, 255, 0.2)',
        gap: 12
    },
    earnTitle: {
        color: '#00FF88',
        fontSize: 14,
        fontWeight: '900',
        marginBottom: 4,
        letterSpacing: 1,
        fontFamily: 'monospace',
    },
    earnDescription: {
        color: '#94A3B8',
        fontSize: 11,
        fontFamily: 'monospace',
        lineHeight: 14,
    },
    adButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        marginTop: 8
    },
    sectionTitle: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 1,
        marginRight: 12,
        fontFamily: 'monospace',
    },
    sectionLine: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.1)'
    },
    successOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 5000,
    },
    successCard: {
        width: '80%',
        backgroundColor: '#0A0A15',
        borderRadius: 25,
        borderWidth: 2,
        borderColor: '#00FF88',
        padding: 30,
        alignItems: 'center',
        shadowColor: '#00FF88',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 30,
        elevation: 50,
    },
    successIconBubble: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 3,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        marginBottom: 20,
        shadowColor: '#FFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 20
    },
    successTitle: {
        color: '#00FF88',
        fontSize: 20,
        fontWeight: '900',
        marginBottom: 10,
        textAlign: 'center',
        letterSpacing: 1
    },
    successName: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
        fontFamily: 'monospace'
    },
    successDesc: {
        color: '#94A3B8',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 25,
        lineHeight: 20
    },
    okButton: {
        backgroundColor: '#00FF88',
        paddingVertical: 12,
        paddingHorizontal: 40,
        borderRadius: 25,
        shadowColor: '#00FF88',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 5
    },
    okButtonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 1
    },
    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 4000,
    },
    paymentModal: {
        width: '90%',
        backgroundColor: '#0A0A15',
        borderRadius: 24,
        padding: 24,
        borderWidth: 2,
        borderColor: '#00E0FF',
        alignItems: 'center',
        shadowColor: '#00E0FF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 30,
        elevation: 20,
    },
    paymentTitle: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
        fontFamily: 'monospace',
        textAlign: 'center',
    },
    paymentSubtitle: {
        color: '#94A3B8',
        fontSize: 12,
        marginBottom: 8,
        fontFamily: 'monospace',
        textAlign: 'center',
        lineHeight: 16,
    },
    paymentOptions: {
        width: '100%',
        gap: 12,
        marginBottom: 20,
    },
    paymentOptionBtn: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        padding: 18,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    disabledOption: {
        opacity: 0.4,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    paymentText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'monospace',
    },
    disabledText: {
        color: '#888',
    },
    errorTextSmall: {
        position: 'absolute',
        bottom: 2,
        right: 12,
        color: '#FF4444',
        fontSize: 10,
        fontFamily: 'monospace',
    },
    cancelButton: {
        paddingVertical: 12,
        paddingHorizontal: 32,
    },
    cancelText: {
        color: '#94A3B8',
        fontSize: 14,
        fontFamily: 'monospace',
    },
    paymentItemPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        padding: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        gap: 12,
    },
    paymentItemIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    paymentItemInfo: {
        flex: 1,
    },
    paymentMethodTitle: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
        fontFamily: 'monospace',
    },
    paymentOptionContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    paymentOptionText: {
        flex: 1,
    },
    coinPaymentBtn: {
        backgroundColor: 'rgba(255, 214, 10, 0.1)',
        borderColor: '#FFD60A',
    },
    moneyPaymentBtn: {
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        borderColor: '#4CAF50',
    },
    paymentMethodSubtext: {
        color: '#888',
        fontSize: 11,
        fontFamily: 'monospace',
    },
    inventorySection: {
        marginBottom: 24,
        padding: 16,
        backgroundColor: 'rgba(0, 224, 255, 0.05)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(0, 224, 255, 0.2)',
    },
    inventoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    inventoryItem: {
        width: '23%',
        alignItems: 'center',
        marginBottom: 12,
    },
    inventoryIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
    },
    inventoryName: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold',
        textAlign: 'center',
        fontFamily: 'monospace',
        marginBottom: 2,
    },
    inventoryCount: {
        backgroundColor: '#00E0FF',
        borderRadius: 10,
        paddingHorizontal: 6,
        paddingVertical: 2,
        minWidth: 20,
        alignItems: 'center',
    },
    inventoryCountText: {
        color: '#000',
        fontSize: 10,
        fontWeight: 'bold',
        fontFamily: 'monospace',
    },
    inventoryHint: {
        color: '#94A3B8',
        fontSize: 11,
        textAlign: 'center',
        fontStyle: 'italic',
        fontFamily: 'monospace',
    },
    addCoinsModal: {
        width: '90%',
        backgroundColor: '#0A0A15',
        borderRadius: 24,
        padding: 24,
        borderWidth: 2,
        borderColor: '#FFD700',
        alignItems: 'center',
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 30,
        elevation: 20,
    },
    addCoinsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 8,
    },
    addCoinsTitle: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: 'bold',
        fontFamily: 'monospace',
        flex: 1,
        textAlign: 'center',
    },
    addCoinsClose: {
        padding: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 16,
    },
    addCoinsSubtitle: {
        color: '#94A3B8',
        fontSize: 14,
        marginBottom: 20,
        fontFamily: 'monospace',
        textAlign: 'center',
    },
    coinPacksGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 20,
    },
    coinPackCard: {
        width: '48%',
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        marginBottom: 12,
        borderWidth: 2,
        borderColor: 'rgba(255, 215, 0, 0.3)',
        position: 'relative',
    },
    coinPackPopular: {
        borderColor: '#FFD700',
        backgroundColor: 'rgba(255, 215, 0, 0.15)',
        transform: [{ scale: 1.05 }],
    },
    popularBadge: {
        position: 'absolute',
        top: -8,
        backgroundColor: '#FF6B35',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        zIndex: 10,
    },
    popularText: {
        color: '#FFF',
        fontSize: 8,
        fontWeight: 'bold',
        fontFamily: 'monospace',
    },
    coinPackIcon: {
        marginBottom: 8,
    },
    coinPackAmount: {
        color: '#FFD700',
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: 'monospace',
    },
    coinPackCoins: {
        color: '#94A3B8',
        fontSize: 12,
        fontFamily: 'monospace',
        marginBottom: 8,
    },
    coinPackPrice: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    coinPackPriceText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: 'bold',
        fontFamily: 'monospace',
    },
    addCoinsCancelBtn: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 16,
    },
    addCoinsCancelText: {
        color: '#94A3B8',
        fontSize: 14,
        fontFamily: 'monospace',
    },
});

export default Shop;
