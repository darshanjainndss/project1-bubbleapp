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
import MaterialIcon from './MaterialIcon';
import RewardedAdButton from './RewardedAdButton';
import ToastNotification, { ToastRef } from './ToastNotification';
import { GAME_ICONS, ICON_COLORS, ICON_SIZES } from '../config/icons';
import ConfigService from '../services/ConfigService';
import BackendService, { AbilityConfig } from '../services/BackendService';

const { width } = Dimensions.get('window');

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

const ABILITY_UI_DATA: Record<string, { icon: any, color: string }> = {
  lightning: { icon: GAME_ICONS.LIGHTNING, color: ICON_COLORS.PRIMARY },
  bomb: { icon: GAME_ICONS.BOMB, color: ICON_COLORS.WARNING },
  freeze: { icon: GAME_ICONS.FREEZE, color: ICON_COLORS.INFO },
  fire: { icon: GAME_ICONS.FIRE, color: ICON_COLORS.ERROR },
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
  const [abilities, setAbilities] = useState<AbilityConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const toastRef = useRef<ToastRef>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Load abilities from backend
  useEffect(() => {
    if (visible) {
      loadAbilities();
      // Animate in
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    } else {
      // Animate out
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const loadAbilities = async () => {
    try {
      setLoading(true);
      const abilitiesConfig = await ConfigService.getAbilitiesConfig();
      setAbilities(abilitiesConfig);
    } catch (error) {
      console.error('Failed to load abilities:', error);
      toastRef.current?.show('Failed to load shop items', 'error');
    } finally {
      setLoading(false);
    }
  };

  const purchaseAbility = async (ability: AbilityConfig) => {
    if (coins < ability.price) {
      toastRef.current?.show(`Need ${ability.price} coins, you have ${coins}`, 'error');
      return;
    }

    setPurchasing(ability.id);
    try {
      // Correctly type the ability name for the backend service
      const abilityKey = ability.name as 'lightning' | 'bomb' | 'freeze' | 'fire';
      const result = await BackendService.purchaseAbilities(abilityKey, 1);

      if (result.success) {
        onCoinsUpdate(result.newCoinBalance || 0);

        // Calculate purchased count (total - base)
        const totalCount = result.newAbilityCount || 0;
        const baseCount = abilityStartingCounts[ability.name] || 2;
        const purchasedCount = Math.max(0, totalCount - baseCount);

        const newInventory = {
          ...abilityInventory,
          [ability.name]: purchasedCount
        };
        onInventoryUpdate(newInventory);

        toastRef.current?.show(`${ability.displayName} purchased!`, 'success');
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

  if (!visible) return null;

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [600, 0],
  });

  return (
    <View style={styles.overlay}>
      <Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>ABILITY SHOP</Text>
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
          <MaterialIcon
            name={GAME_ICONS.COIN.name}
            family={GAME_ICONS.COIN.family}
            size={ICON_SIZES.LARGE}
            color={ICON_COLORS.GOLD}
          />
          <Text style={styles.coinsText}>{coins.toLocaleString()}</Text>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={ICON_COLORS.PRIMARY} />
              <Text style={styles.loadingText}>Loading abilities...</Text>
            </View>
          ) : (
            <View style={styles.scrollPadding}>
              {/* Abilities Grid */}
              <View style={styles.abilitiesGrid}>
                {abilities.map((ability) => {
                  const uiData = ABILITY_UI_DATA[ability.name] || {
                    icon: GAME_ICONS.TARGET,
                    color: ICON_COLORS.PRIMARY
                  };
                  const purchasedCount = abilityInventory[ability.name] || 0;
                  const canAfford = coins >= ability.price;
                  const isPurchasing = purchasing === ability.id;

                  return (
                    <View key={ability.id} style={styles.abilityCard}>
                      {/* Icon */}
                      <View style={[styles.abilityIcon, { borderColor: uiData.color }]}>
                        <MaterialIcon
                          name={uiData.icon.name}
                          family={uiData.icon.family}
                          size={ICON_SIZES.XLARGE}
                          color={uiData.color}
                        />
                      </View>

                      {/* Info */}
                      <Text style={styles.abilityName}>{ability.displayName}</Text>
                      <Text style={styles.abilityDescription} numberOfLines={2}>
                        {ability.description}
                      </Text>

                      {/* Stats */}
                      <View style={styles.abilityStats}>
                        <Text style={styles.statText}>
                          Base: {ability.startingCount} / lvl
                        </Text>
                        <Text style={styles.statText}>
                          +{ability.pointsPerBubble} pts/bubble
                        </Text>
                      </View>

                      {/* Purchase Section */}
                      <View style={styles.purchaseSection}>
                        <View style={styles.priceContainer}>
                          <MaterialIcon
                            name={GAME_ICONS.COIN.name}
                            family={GAME_ICONS.COIN.family}
                            size={ICON_SIZES.SMALL}
                            color={ICON_COLORS.GOLD}
                          />
                          <Text style={styles.priceText}>{ability.price}</Text>
                        </View>
                        <TouchableOpacity
                          style={[
                            styles.buyButton,
                            !canAfford && styles.buyButtonDisabled,
                            isPurchasing && styles.buyButtonPurchasing
                          ]}
                          onPress={() => purchaseAbility(ability)}
                          disabled={!canAfford || isPurchasing}
                        >
                          {isPurchasing ? (
                            <ActivityIndicator size="small" color={ICON_COLORS.WHITE} />
                          ) : (
                            <MaterialIcon
                              name="add-shopping-cart"
                              family="material"
                              size={ICON_SIZES.SMALL}
                              color={canAfford ? ICON_COLORS.WHITE : ICON_COLORS.DISABLED}
                            />
                          )}
                        </TouchableOpacity>
                      </View>

                      {/* Inventory Badge */}
                      {purchasedCount > 0 && (
                        <View style={styles.inventoryBadge}>
                          <Text style={styles.inventoryText}>+{purchasedCount}</Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>

              {/* Earn Coins Section */}
              <View style={styles.earnSection}>
                <Text style={styles.earnTitle}>EARN FREE COINS</Text>
                <Text style={styles.earnDescription}>
                  Watch a short video to earn {adRewardAmount} coins
                </Text>
                <RewardedAdButton
                  onReward={onWatchAd}
                  rewardAmount={adRewardAmount}
                  style={styles.adButton}
                />
              </View>
            </View>
          )}
        </ScrollView>
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
    justifyContent: 'flex-end',
    zIndex: 2000,
  },
  container: {
    backgroundColor: '#0A0A12',
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    borderWidth: 2,
    borderColor: '#00E0FF',
    maxHeight: '92%',
    shadowColor: '#00E0FF',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 25,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 224, 255, 0.2)',
  },
  title: {
    color: '#FFF',
    fontSize: 26,
    fontWeight: '900',
    textShadowColor: 'rgba(0, 224, 255, 0.8)',
    textShadowRadius: 15,
    letterSpacing: 3,
    fontFamily: 'monospace',
  },
  closeButton: {
    padding: 8,
    backgroundColor: 'rgba(0, 224, 255, 0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 224, 255, 0.3)',
  },
  coinsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: 'rgba(255, 214, 10, 0.05)',
    borderRadius: 20,
    marginHorizontal: 24,
    marginTop: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 214, 10, 0.2)',
  },
  coinsText: {
    color: '#FFD60A',
    fontSize: 28,
    fontWeight: '900',
    marginLeft: 12,
    textShadowColor: 'rgba(255, 214, 10, 0.5)',
    textShadowRadius: 10,
    fontFamily: 'monospace',
  },
  content: {
    flex: 1,
  },
  scrollPadding: {
    padding: 20,
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
  abilitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  abilityCard: {
    width: (width - 60) / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 24,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 224, 255, 0.15)',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  abilityIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    marginBottom: 12,
    shadowColor: '#00E0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  abilityName: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  abilityDescription: {
    color: '#AAA',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 12,
    height: 34,
    lineHeight: 16,
  },
  abilityStats: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 10,
    marginBottom: 12,
  },
  statText: {
    color: '#777',
    fontSize: 10,
    textAlign: 'center',
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  purchaseSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 15,
    padding: 5,
    paddingLeft: 10,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceText: {
    color: '#FFD60A',
    fontSize: 18,
    fontWeight: '900',
    marginLeft: 6,
    fontFamily: 'monospace',
  },
  buyButton: {
    backgroundColor: '#00FF88',
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00FF88',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buyButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: '#333',
    shadowOpacity: 0,
  },
  buyButtonPurchasing: {
    backgroundColor: 'rgba(0, 255, 136, 0.5)',
  },
  inventoryBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#00FF88',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1.5,
    borderColor: '#0A0A12',
    shadowColor: '#00FF88',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  inventoryText: {
    color: '#000',
    fontSize: 11,
    fontWeight: '900',
    fontFamily: 'monospace',
  },
  earnSection: {
    marginTop: 10,
    padding: 24,
    backgroundColor: 'rgba(0, 224, 255, 0.04)',
    borderRadius: 28,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 224, 255, 0.15)',
    borderStyle: 'dashed',
  },
  earnTitle: {
    color: '#00FF88',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 8,
    letterSpacing: 2,
    fontFamily: 'monospace',
  },
  earnDescription: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'monospace',
  },
  adButton: {
    width: '100%',
  },
});

export default Shop;
