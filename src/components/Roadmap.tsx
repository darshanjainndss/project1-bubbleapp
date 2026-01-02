import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  Image,
  FlatList,
  Alert,
} from "react-native";
import LottieView from 'lottie-react-native';
import GameScreen from './GameScreen';
import SpaceBackground from "./SpaceBackground.tsx";
import Leaderboard from './Leaderboard';
import MaterialIcon from './MaterialIcon';
import AdBanner from './AdBanner';
import RewardedAdButton from './RewardedAdButton';
import SimpleRewardedAdButton from './SimpleRewardedAdButton';
import { GAME_ICONS, ICON_COLORS, ICON_SIZES } from '../config/icons';
import { getLevelPattern, getLevelMoves } from '../data/levelPatterns';
import { useAuth } from '../context/AuthContext';
import { styles, SCREEN_WIDTH, SCREEN_HEIGHT } from "../styles/RoadmapStyles";
import BackendService from '../services/BackendService';
import ConfirmationModal from './ConfirmationModal';
import ToastNotification, { ToastRef } from './ToastNotification';
import SettingsService from '../services/SettingsService';

// Helper function to safely call vibration
const safeVibrate = () => {
  try {
    SettingsService.vibrateClick();
  } catch (error) {
    console.warn('Vibration failed:', error);
  }
};

// Sub-component for Wave effect that emits from the circle edge
const WavePulse = ({ color, duration, delay = 0, size = 100 }: any) => {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const runAnimation = () => {
      pulseAnim.setValue(0);
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: duration,
          useNativeDriver: true,
        })
      ]).start(() => runAnimation());
    };
    runAnimation();
  }, [duration, delay]);

  const scale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1.02, 3], // Emerges strictly from the border edge
  });

  const opacity = pulseAnim.interpolate({
    inputRange: [0, 0.05, 1],
    outputRange: [0, 0.8, 0], // Sharp fade-in at border for maximum emission effect
  });

  return (
    <Animated.View
      style={[
        styles.wavePulse,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: color,
          borderWidth: 2,
          transform: [{ scale }],
          opacity,
        },
      ]}
    />
  );
};

// Internal Breathing Glow for Planet Core
const StationInnerGlow = ({ color, isCurrent }: any) => {
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: color,
          borderRadius: 50,
          opacity: glow.interpolate({
            inputRange: [0, 1],
            outputRange: [isCurrent ? 0.15 : 0.05, isCurrent ? 0.4 : 0.2]
          }),
        },
      ]}
    />
  );
};

const OrbitalRing = ({ size, color, duration, rotateX = '0deg', rotateY = '0deg', delay = 0 }: any) => {
  const rotation = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: duration,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.orbitalRing,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: color,
          transform: [
            { perspective: 1000 },
            { rotateX: rotateX },
            { rotateY: rotateY },
            { rotate: rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) },
          ],
        },
      ]}
    />
  );
}; const RING_COLORS = [
  '#00FF88', '#00E0FF', '#A259FF', '#FF6000', '#FFD60A',
  '#FF2D55', '#5856D6', '#FF9500', '#AF52DE', '#007AFF',
];

const LEVEL_TITLES = [
  "CYPRUS SECTOR", "NEON VOID", "PLASMA CORE", "FROST MOON",
  "AMBER RIFT", "JADE NEBULA", "COBALT STAR", "ONYX DEEP",
  "QUARTZ ZONE", "RUBY STATION", "SILVER WAKE", "GOLDEN GATE"
];

const ICONS = [
  'https://img.icons8.com/fluency/512/galaxy.png',
  'https://img.icons8.com/fluency/512/planet.png',
  'https://img.icons8.com/fluency/512/saturn-planet.png',
  'https://img.icons8.com/fluency/512/mars-planet.png',
  'https://img.icons8.com/fluency/512/jupiter-planet.png',
  'https://img.icons8.com/fluency/512/mercury-planet.png',
  'https://img.icons8.com/fluency/512/asteroid.png',
  'https://img.icons8.com/fluency/512/black-hole.png',
  'https://img.icons8.com/fluency/512/uranus-planet.png',
  'https://img.icons8.com/fluency/512/venus-planet.png',
  'https://img.icons8.com/fluency/512/neptune-planet.png',
  'https://img.icons8.com/fluency/512/supernova.png',
  'https://img.icons8.com/fluency/512/shooting-star.png',
];

const SHOP_ITEMS = [
  { id: 'lightning', name: 'Lightning', icon: GAME_ICONS.LIGHTNING, price: 50, description: 'Destroys entire row', color: ICON_COLORS.PRIMARY },
  { id: 'bomb', name: 'Bomb', icon: GAME_ICONS.BOMB, price: 75, description: 'Destroys 6 hex neighbors', color: ICON_COLORS.WARNING },
  { id: 'freeze', name: 'Freeze', icon: GAME_ICONS.FREEZE, price: 30, description: 'Freezes column up to 2 rows', color: ICON_COLORS.INFO },
  { id: 'fire', name: 'Fire', icon: GAME_ICONS.FIRE, price: 40, description: 'Burns through obstacles', color: ICON_COLORS.ERROR },
];

// Top HUD Component
// Top HUD Component - with Neon Styling
const TopHUD = ({ coins, score, onProfilePress, onLogout }: any) => (
  <View style={[styles.dashboardContainer, localStyles.topHudContainer]}>
    <TouchableOpacity onPress={onProfilePress} style={localStyles.profileButton}>
      <MaterialIcon name="account-circle" family="material" size={48} color="#FFFFFF" />
    </TouchableOpacity>

    <View style={localStyles.statsRow}>
      <View style={localStyles.statBadgeNeon}>
        <MaterialIcon name="stars" family="material" size={20} color={ICON_COLORS.SUCCESS} />
        <Text style={localStyles.statValue}>{score.toLocaleString()}</Text>
      </View>
      <View style={[localStyles.statBadgeNeon, { marginLeft: 10 }]}>
        <MaterialIcon
          name={GAME_ICONS.COIN.name}
          family={GAME_ICONS.COIN.family}
          size={20}
          color={ICON_COLORS.GOLD}
        />
        <Text style={localStyles.statValue}>{coins}</Text>
      </View>
    </View>

    <TouchableOpacity onPress={onLogout} style={localStyles.logoutButton}>
      <MaterialIcon name="logout" family="material" size={28} color={ICON_COLORS.ERROR} />
    </TouchableOpacity>
  </View>
);

// Bottom Navigation Bar Component
// Bottom Navigation Bar Component - with Center Map Button
const BottomNavBar = ({ onLeaderboard, onShop, onAd, onProfile, onMap }: any) => (
  <View style={localStyles.bottomNavGrid}>
    {/* Left Side */}
    <TouchableOpacity style={localStyles.navItem} onPress={onLeaderboard}>
      <MaterialIcon name="leaderboard" family="material" size={26} color={ICON_COLORS.SECONDARY} />
      <Text style={localStyles.navText}>Rank</Text>
    </TouchableOpacity>

    <TouchableOpacity style={localStyles.navItem} onPress={onShop}>
      <MaterialIcon name="shopping-cart" family="material" size={26} color={ICON_COLORS.SUCCESS} />
      <Text style={localStyles.navText}>Shop</Text>
    </TouchableOpacity>

    {/* Placeholder for center button space to ensure equal gaps */}
    <View style={localStyles.placeholderNavItem} />

    {/* Right Side */}
    <TouchableOpacity style={localStyles.navItem} onPress={onAd}>
      <MaterialIcon name="play-circle-filled" family="material" size={26} color={ICON_COLORS.WARNING} />
      <Text style={localStyles.navText}>Earn</Text>
    </TouchableOpacity>

    <TouchableOpacity style={localStyles.navItem} onPress={onProfile}>
      <MaterialIcon name="person" family="material" size={26} color="#FFFFFF" />
      <Text style={localStyles.navText}>Profile</Text>
    </TouchableOpacity>

    {/* Center Map Button - Raised & Floating */}
    <View style={localStyles.centerBtnContainer}>
      <TouchableOpacity style={localStyles.centerMapBtn} onPress={onMap}>
        <MaterialIcon name="map" family="material" size={32} color="#000" />
      </TouchableOpacity>
      <Text style={[localStyles.navText, { color: '#00E0FF', marginTop: 4 }]}>Map</Text>
    </View>
  </View>
);

// Profile Popup Component
const ProfilePopup = ({ visible, onClose, user, userGameData, coins, currentLevel }: any) => {
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [vibrationSupported, setVibrationSupported] = useState(true);

  // Load vibration setting on mount
  useEffect(() => {
    const loadVibrationSetting = async () => {
      try {
        await SettingsService.ensureLoaded();
        setVibrationEnabled(SettingsService.getSetting('vibrationEnabled'));
        setVibrationSupported(SettingsService.isVibrationSupported());
      } catch (error) {
        console.error('Error loading vibration setting:', error);
        // Set safe defaults if loading fails
        setVibrationEnabled(true);
        setVibrationSupported(true);
      }
    };
    if (visible) {
      loadVibrationSetting();
    }
  }, [visible]);

  const toggleVibration = async () => {
    if (!vibrationSupported) return;
    
    try {
      const newValue = !vibrationEnabled;
      setVibrationEnabled(newValue);
      await SettingsService.setVibrationEnabled(newValue);
      
      // Give feedback when enabling vibration
      if (newValue) {
        try {
          SettingsService.vibrateClick();
        } catch (error) {
          console.warn('Vibration feedback failed:', error);
        }
      }
    } catch (error) {
      console.error('Error toggling vibration:', error);
    }
  };

  if (!visible || !user) return null;

  // Get name without @gmail.com or domain
  const rawName = user.displayName || user.email?.split('@')[0] || 'Explorer';
  const cleanName = rawName.replace(/@.*/, '');

  return (
    <View style={localStyles.popupOverlay}>
      <View style={localStyles.popupContent}>
        <TouchableOpacity style={localStyles.closePopupBtn} onPress={onClose}>
          <MaterialIcon name="close" family="material" size={24} color="#FFF" />
        </TouchableOpacity>

        <View style={localStyles.popupAvatar}>
          <MaterialIcon name="account-circle" family="material" size={80} color={ICON_COLORS.PRIMARY} />
        </View>

        <Text style={localStyles.popupName}>{cleanName}</Text>
        <Text style={localStyles.popupLabel}>Space Commander</Text>

        {/* Stats Section */}
        <View style={localStyles.profileStatsContainer}>
          <View style={localStyles.profileStatItem}>
            <MaterialIcon name="trending-up" family="material" size={24} color={ICON_COLORS.SUCCESS} />
            <Text style={localStyles.profileStatLabel}>Level</Text>
            <Text style={localStyles.profileStatValue}>{currentLevel}</Text>
          </View>
          
          <View style={localStyles.profileStatItem}>
            <MaterialIcon
              name={GAME_ICONS.COIN.name}
              family={GAME_ICONS.COIN.family}
              size={24}
              color={ICON_COLORS.GOLD}
            />
            <Text style={localStyles.profileStatLabel}>Coins</Text>
            <Text style={localStyles.profileStatValue}>{coins.toLocaleString()}</Text>
          </View>

          <View style={localStyles.profileStatItem}>
            <MaterialIcon name="stars" family="material" size={24} color={ICON_COLORS.WARNING} />
            <Text style={localStyles.profileStatLabel}>Score</Text>
            <Text style={localStyles.profileStatValue}>{(userGameData?.totalScore || 0).toLocaleString()}</Text>
          </View>
        </View>

        {/* Settings Section */}
        <View style={localStyles.profileSettingsContainer}>
          <Text style={localStyles.profileSectionTitle}>Settings</Text>
          
          <TouchableOpacity 
            style={[
              localStyles.profileSettingItem,
              !vibrationSupported && localStyles.profileSettingDisabled
            ]} 
            onPress={toggleVibration}
            disabled={!vibrationSupported}
          >
            <View style={localStyles.profileSettingLeft}>
              <MaterialIcon 
                name={GAME_ICONS.VIBRATION.name} 
                family={GAME_ICONS.VIBRATION.family} 
                size={24} 
                color={
                  !vibrationSupported 
                    ? ICON_COLORS.DISABLED 
                    : vibrationEnabled 
                      ? ICON_COLORS.SUCCESS 
                      : ICON_COLORS.DISABLED
                } 
              />
              <Text style={[
                localStyles.profileSettingLabel,
                !vibrationSupported && localStyles.profileSettingLabelDisabled
              ]}>
                Vibration {!vibrationSupported && '(Not Available)'}
              </Text>
            </View>
            <View style={[
              localStyles.profileToggle,
              vibrationEnabled && vibrationSupported && localStyles.profileToggleActive,
              !vibrationSupported && localStyles.profileToggleDisabled
            ]}>
              <View style={[
                localStyles.profileToggleThumb,
                vibrationEnabled && vibrationSupported && localStyles.profileToggleThumbActive
              ]} />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// Earn Coins Popup Component
const EarnCoinsPopup = ({ visible, onClose, onWatchAd, isAdLoaded }: any) => {
  if (!visible) return null;

  return (
    <View style={localStyles.popupOverlay}>
      <View style={localStyles.earnCoinsPopupContent}>
        <TouchableOpacity style={localStyles.closePopupBtn} onPress={onClose}>
          <MaterialIcon name="close" family="material" size={24} color="#FFF" />
        </TouchableOpacity>

        {/* Coin Icon */}
        <View style={localStyles.earnCoinsIcon}>
          <MaterialIcon
            name={GAME_ICONS.COIN.name}
            family={GAME_ICONS.COIN.family}
            size={80}
            color={ICON_COLORS.GOLD}
          />
        </View>

        <Text style={localStyles.earnCoinsTitle}>Earn Free Coins!</Text>
        <Text style={localStyles.earnCoinsDescription}>
          Watch a short video ad to earn coins that you can use to buy power-ups and abilities.
        </Text>

        {/* Reward Info */}
        <View style={localStyles.earnCoinsRewardBox}>
          <MaterialIcon
            name={GAME_ICONS.COIN.name}
            family={GAME_ICONS.COIN.family}
            size={32}
            color={ICON_COLORS.GOLD}
          />
          <Text style={localStyles.earnCoinsRewardText}>+50 Coins</Text>
        </View>

        {/* Action Buttons */}
        <View style={localStyles.earnCoinsButtons}>
          <TouchableOpacity 
            style={[
              localStyles.earnCoinsWatchBtn,
              !isAdLoaded && localStyles.earnCoinsWatchBtnDisabled
            ]} 
            onPress={onWatchAd}
            disabled={!isAdLoaded}
          >
            <MaterialIcon name="play-circle-filled" family="material" size={24} color="#000" />
            <Text style={localStyles.earnCoinsWatchBtnText}>
              {isAdLoaded ? 'Watch Ad' : 'Loading...'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={localStyles.earnCoinsLaterBtn} onPress={onClose}>
            <Text style={localStyles.earnCoinsLaterBtnText}>Maybe Later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const Roadmap: React.FC = () => {
  const { user, signOut } = useAuth();
  const [showGameScreen, setShowGameScreen] = useState(false);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [showEarnCoinsPopup, setShowEarnCoinsPopup] = useState(false);
  const [userGameData, setUserGameData] = useState<any>({
    completedLevels: [],
    levelStars: {},
    currentLevel: 1,
    highScore: 0,
    totalCoins: 0,
    abilities: { lightning: 2, bomb: 2, freeze: 2, fire: 2 }
  });
  const [dataLoaded, setDataLoaded] = useState(false);
  const [loadingDirection, setLoadingDirection] = useState<'toFight' | 'toBase'>('toFight');
  const toastRef = useRef<ToastRef>(null);

  const handleLogout = async () => {
    await BackendService.logout();
    signOut();
  };

  // Ability inventory
  const [abilityInventory, setAbilityInventory] = useState({
    lightning: 2,
    bomb: 2,
    fire: 2,
    freeze: 2,
  });

  // Rewarded ad state
  const [rewardedAd, setRewardedAd] = useState<any>(null);
  const [isAdLoaded, setIsAdLoaded] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const glowAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Load user data when component mounts or user changes
  const loadUserData = useCallback(async (showLoading = true) => {
    if (!user?.uid) return;
    try {
      if (showLoading && !dataLoaded) setIsLoading(true);
      const isAuth = await BackendService.ensureAuthenticated(user);
      if (!isAuth) {
        if (showLoading) setIsLoading(false);
        return;
      }
      const result = await BackendService.getUserGameData();
      if (result.success && result.data) {
        setUserGameData(result.data);
        setScore(result.data.totalScore || 0);
        setCoins(result.data.totalCoins || 0);
        setCurrentLevel(result.data.currentLevel || 1);
        const inv = result.data.abilities || { lightning: 2, bomb: 2, freeze: 2, fire: 2 };
        if (result.data.currentLevel <= 1 && result.data.totalScore === 0 && inv.lightning === 0) {
          inv.lightning = 2; inv.bomb = 2; inv.fire = 2; inv.freeze = 2;
          await BackendService.updateAbilities(inv);
        }
        setAbilityInventory(inv);
        setDataLoaded(true);
      }
    } catch (err) {
      console.error('Data load error:', err);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, [user?.uid, dataLoaded]);

  useEffect(() => {
    loadUserData();
  }, [user?.uid, loadUserData]);

  // Initialize rewarded ad
  useEffect(() => {
    const { RewardedAd, AdEventType, RewardedAdEventType } = require('react-native-google-mobile-ads');
    const { ADMOB_CONFIG } = require('../config/admob');

    const ad = RewardedAd.createForAdRequest(ADMOB_CONFIG.REWARDED_AD_UNIT_ID, {
      requestNonPersonalizedAdsOnly: true,
    });

    const unsubscribeLoaded = ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
      console.log('✅ Rewarded ad loaded');
      setIsAdLoaded(true);
    });

    const unsubscribeEarned = ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (reward: any) => {
      console.log('🎉 User earned reward:', reward);
      setCoins((prev: any) => prev + 50);
      toastRef.current?.show('Earned 50 bonus coins!', 'success');
    });

    const unsubscribeError = ad.addAdEventListener(AdEventType.ERROR, (error: any) => {
      console.log('❌ Rewarded ad error:', error);
      setIsAdLoaded(false);
    });

    setRewardedAd(ad);
    ad.load();

    return () => {
      unsubscribeLoaded();
      unsubscribeEarned();
      unsubscribeError();
    };
  }, []);

  // Handle rewarded ad button press - show popup first
  const handleRewardedAdPress = () => {
    safeVibrate();
    setShowEarnCoinsPopup(true);
  };

  // Handle watching the ad from popup
  const handleWatchAd = () => {
    if (rewardedAd && isAdLoaded) {
      setShowEarnCoinsPopup(false);
      rewardedAd.show();
    } else {
      toastRef.current?.show('Ad not ready. Try again in a moment.', 'info');
    }
  };

  // Save user data - removed local StorageService calls, relying on explicit backend calls
  useEffect(() => {
    // No longer auto-saving every state change to avoid excessive API calls
    // Level complete and Purchases have their own backend calls now.
  }, []);

  // Update leaderboard entry is now handled by backend during submission

  // Purchase ability function - now using BackendService
  const purchaseAbility = async (abilityId: string, price: number) => {
    if (!user?.uid) return;

    console.log(`🛒 Attempting to purchase ${abilityId} for ${price} coins. Current balance: ${coins}`);
    
    // Add client-side validation
    if (coins < price) {
      toastRef.current?.show(`Insufficient coins. Need ${price}, have ${coins}.`, 'error');
      return;
    }

    try {
      const result = await BackendService.purchaseAbilities(
        abilityId as any,
        1
      );

      console.log('🛒 Purchase result:', result);

      if (result.success) {
        setCoins(result.newCoinBalance || 0);
        setAbilityInventory((prev: any) => ({
          ...prev,
          [abilityId]: result.newAbilityCount || (prev[abilityId as keyof typeof prev] + 1)
        }));
        toastRef.current?.show(`Successfully purchased ${abilityId}!`, 'success');
      } else {
        toastRef.current?.show(result.error || 'Insufficient coins.', 'error');
      }
    } catch (error) {
      console.error('Error purchasing ability:', error);
      toastRef.current?.show('Failed to purchase ability.', 'error');
    }
  };

  // Generate levels data (Infinite Levels)
  const levels = useMemo(() =>
    Array.from({ length: 2000 }, (_, i) => {
      const levelId = i + 1;
      const completedLevels = userGameData?.completedLevels || [];
      const isCompleted = completedLevels.includes(levelId);
      const levelStars = userGameData?.levelStars || {};
      const stars = levelStars[levelId] || 0;
      const currentUserLevel = userGameData?.currentLevel || 1;

      // Check if level should be unlocked based on previous level having 2+ stars
      let isLocked = false;
      if (levelId > 1) {
        const previousLevelStars = levelStars[levelId - 1] || 0;
        isLocked = levelId > currentUserLevel && previousLevelStars < 2;
      } else {
        isLocked = false; // Level 1 is always unlocked
      }

      return {
        id: levelId,
        isLocked,
        isCompleted,
        stars: isCompleted ? stars : 0,
      };
    }), [userGameData]);

  const reversedLevels = useMemo(() => [...levels].reverse(), [levels]);

  // Progressive coin calculation based on level
  const calculateLevelCoins = (level: number, stars: number): number => {
    // Base coins increase progressively with level
    const baseCoins = Math.floor(10 + (level * 2.5)); // Level 1: 12, Level 50: 135, Level 100: 260
    const starBonus = stars * Math.floor(5 + (level * 0.5)); // Star bonus also increases with level
    const completionBonus = Math.floor(level * 1.2); // Completion bonus

    return baseCoins + starBonus + completionBonus;
  };

  // Auto-scroll to current level on mount and when data loads
  useEffect(() => {
    if (dataLoaded && userGameData) {
      const currentUserLevel = userGameData.currentLevel || 1;
      const currentIndex = levels.findIndex(level => level.id === currentUserLevel);
      if (currentIndex !== -1) {
        const reversedIndex = levels.length - 1 - currentIndex;

        // Immediate jump on first load to prevent seeing Level 2000
        flatListRef.current?.scrollToIndex({
          index: reversedIndex,
          animated: false,
          viewPosition: 0.5
        });

        // Backup scroll after a short delay in case FlatList wasn't ready
        const timer = setTimeout(() => {
          flatListRef.current?.scrollToIndex({
            index: reversedIndex,
            animated: false,
            viewPosition: 0.5
          });
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [dataLoaded, userGameData?.currentLevel, levels.length]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.3, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Static Spaceship Component using Lottie with floating animation
  const StaticSpaceship = ({ size = 120 }: { size?: number }) => {
    const floatAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(floatAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, []);

    const translateY = floatAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -20],
    });

    return (
      <Animated.View style={[styles.staticSpaceship, { width: size, height: size, transform: [{ translateY }] }]}>
        <LottieView
          source={require('../images/Spaceship.json')}
          autoPlay
          loop
          style={styles.spaceshipLottie}
        />
      </Animated.View>
    );
  };

  const handleLevelPress = (level: number, isLocked: boolean) => {
    if (isLocked) {
      // Show message for locked levels without loading
      const previousLevel = level - 1;
      const previousLevelStars = userGameData?.levelStars?.[previousLevel] || 0;

      toastRef.current?.show(
        `Level Locked! Need 2 stars on Level ${previousLevel} (You have ${previousLevelStars})`,
        'warning'
      );
      return;
    }

    // Set direction to fight and show loading
    setLoadingDirection('toFight');
    setIsLoading(true);
    setSelectedLevel(level);
    setCurrentLevel(level);

    // Wait for loading screen to appear before switching
    setTimeout(() => {
      setShowGameScreen(true);
      // Wait for GameScreen to initialize
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    }, 100);
  };

  const handleBackPress = () => {
    // Set direction to base and show loading
    setLoadingDirection('toBase');
    setIsLoading(true);

    // Wait for loading screen to appear before switching
    setTimeout(() => {
      setShowGameScreen(false);
      // Refresh data to ensure accuracy
      if (typeof loadUserData === 'function') loadUserData(false);

      // Scroll to current level when returning
      setTimeout(() => {
        if (userGameData) {
          const currentUserLevel = userGameData.currentLevel;
          const currentIndex = levels.findIndex(level => level.id === currentUserLevel);
          if (currentIndex !== -1) {
            const reversedIndex = levels.length - 1 - currentIndex;
            flatListRef.current?.scrollToIndex({
              index: reversedIndex,
              animated: false, // Instant scroll while hidden
              viewPosition: 0.5 // Center perfectly
            });
          }
        }
        setIsLoading(false);
      }, 100);
    }, 100);
  };

  const handleLevelComplete = async (completedLevel: number, finalScore: number, stars: number, coinsEarned?: number, action: 'next' | 'home' = 'next', sessionData?: any) => {
    try {
      console.log('🏆 Level Complete:', completedLevel, 'Score:', finalScore, 'Stars:', stars, 'Coins:', coinsEarned, 'Action:', action);

      // 1. OPTIMISTIC UPDATE: Update local state immediately for instant UI feedback
      // Only advance to next level if we got 2+ stars OR if it's the current level
      const shouldAdvanceLevel = stars >= 2 || completedLevel === currentLevel;
      const newCurrentLevel = shouldAdvanceLevel ? Math.max(completedLevel + 1, currentLevel) : currentLevel;

      // SWITCH TO CUMULATIVE SCORE DISPLAY
      // Optimistically add the new level score to the total score
      const currentTotalScore = userGameData?.totalScore || score || 0;
      const newTotalScore = currentTotalScore + finalScore;

      // Calculate new total coins optimistically
      const currentTotalCoins = userGameData?.totalCoins || coins || 0;
      const newTotalCoins = currentTotalCoins + (coinsEarned || 0);

      // Add ability rewards: 2 of each ability per level completion
      const abilityRewards = { lightning: 2, bomb: 2, freeze: 2, fire: 2 };
      const newAbilityInventory = {
        lightning: (abilityInventory.lightning || 0) + abilityRewards.lightning,
        bomb: (abilityInventory.bomb || 0) + abilityRewards.bomb,
        freeze: (abilityInventory.freeze || 0) + abilityRewards.freeze,
        fire: (abilityInventory.fire || 0) + abilityRewards.fire,
      };

      // Create updated data object
      const updatedGameData = {
        ...userGameData,
        currentLevel: newCurrentLevel,
        totalScore: newTotalScore, // Optimistic update
        // We also want to update highScore (single best run) if applicable, though typically less visible
        highScore: Math.max(userGameData?.highScore || 0, finalScore),
        totalCoins: newTotalCoins,
        abilities: newAbilityInventory, // Update abilities
        levelStars: {
          ...userGameData.levelStars,
          [completedLevel]: Math.max(userGameData.levelStars?.[completedLevel] || 0, stars)
        },
        completedLevels: userGameData.completedLevels.includes(completedLevel)
          ? userGameData.completedLevels
          : [...userGameData.completedLevels, completedLevel]
      };

      // Set State Immediately
      setUserGameData(updatedGameData);
      setScore(newTotalScore); // Show TOTAL score in HUD
      setCoins(newTotalCoins);
      setAbilityInventory(newAbilityInventory); // Update ability inventory
      setCurrentLevel(newCurrentLevel);

      // Show appropriate completion message
      if (stars >= 2) {
        toastRef.current?.show(`Level Complete! Next level unlocked! +2 of each ability earned!`, 'success');
      } else {
        toastRef.current?.show(`Level Complete! Need 2+ stars to unlock next level. +2 of each ability earned!`, 'info');
      }

      // 2. BACKEND SYNC: Submit game session to backend
      try {
        const sessionDataToSubmit = sessionData || {
          level: completedLevel,
          score: finalScore,
          moves: 0,
          stars,
          duration: 0,
          abilitiesUsed: { lightning: 0, bomb: 0, freeze: 0, fire: 0 },
          bubblesDestroyed: 0,
          chainReactions: 0,
          perfectShots: 0,
          coinsEarned: coinsEarned || 0,
          isWin: stars > 0
        };

        console.log('📤 Submitting game session to backend:', sessionDataToSubmit);
        const sessionResult = await BackendService.submitGameSession(sessionDataToSubmit);
        
        if (sessionResult.success) {
          console.log('✅ Game session submitted successfully:', sessionResult.data?.sessionId);
        } else {
          console.error('❌ Failed to submit game session:', sessionResult.error);
        }

        // Update user game data in backend
        const updateResult = await BackendService.updateUserGameData(updatedGameData);
        if (updateResult.success) {
          console.log('✅ User game data updated in backend');
        } else {
          console.error('❌ Failed to update user game data:', updateResult.error);
        }

      } catch (error) {
        console.error('❌ Backend sync error:', error);
      }

      // Update abilities in backend
      try {
        await BackendService.updateAbilities(newAbilityInventory);
      } catch (error) {
        console.error('Failed to sync abilities to backend:', error);
      }

      // 3. Trigger Background Sync
      loadUserData(false);

      // 4. Navigate UI based on Action and Stars
      if (action === 'next' && stars >= 2) {
        // Progress to next level only if we got 2+ stars
        if (completedLevel < levels.length) {
          // Prepare to move to next level
          setSelectedLevel(completedLevel + 1);
          setLoadingDirection('toBase'); // Show loading briefly
          setIsLoading(true);
          setTimeout(() => setIsLoading(false), 500);
        } else {
          handleBackPress();
        }
      } else {
        // Action is 'home' or didn't get enough stars - user wants to quit to map directly
        handleBackPress();
      }

    } catch (error) {
      console.error('Error handling level completion:', error);
      handleBackPress();
    }
  };

  // Loading Indicator Component - Battle Transition Loading (Different from app loading)
  const LoadingIndicator = () => (
    <View style={styles.loadingContainer}>
      <LottieView
        source={require('../images/Spaceship.json')}
        autoPlay
        loop
        style={styles.loadingSpaceship}
      />
      <Text style={styles.loadingText}>
        {loadingDirection === 'toFight'
          ? `Preparing for Battle - Level ${selectedLevel}...`
          : 'Mission Complete - Returning to Base...'
        }
      </Text>
      <View style={{ marginTop: 20 }}>
        <BattleLoadingDots />
      </View>
    </View>
  );

  // Simple battle loading dots
  const BattleLoadingDots = () => {
    const dot1 = useRef(new Animated.Value(0)).current;
    const dot2 = useRef(new Animated.Value(0)).current;
    const dot3 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      const animateDots = () => {
        Animated.sequence([
          Animated.timing(dot1, { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.timing(dot2, { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.timing(dot3, { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.parallel([
            Animated.timing(dot1, { toValue: 0, duration: 200, useNativeDriver: true }),
            Animated.timing(dot2, { toValue: 0, duration: 200, useNativeDriver: true }),
            Animated.timing(dot3, { toValue: 0, duration: 200, useNativeDriver: true }),
          ]),
        ]).start(() => animateDots());
      };
      animateDots();
    }, []);

    return (
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 20 }}>
        <Animated.View style={[{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#00E0FF', marginHorizontal: 4 }, { opacity: dot1 }]} />
        <Animated.View style={[{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#00E0FF', marginHorizontal: 4 }, { opacity: dot2 }]} />
        <Animated.View style={[{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#00E0FF', marginHorizontal: 4 }, { opacity: dot3 }]} />
      </View>
    );
  };

  // Individual Level Item Component for better performance
  const LevelItem = React.memo(({ item, index }: { item: any, index: number }) => {
    const isCurrent = item.id === currentLevel;
    const isPassed = item.isCompleted;
    const isLocked = item.isLocked;
    const levelColor = RING_COLORS[index % RING_COLORS.length];
    const isEven = index % 2 === 0;
    const x = isEven ? SCREEN_WIDTH * 0.22 : SCREEN_WIDTH * 0.78;

    return (
      <View style={[styles.levelItemContainer, { marginLeft: x - 75 }]}>
        <TouchableOpacity
          onPress={() => handleLevelPress(item.id, isLocked)}
          activeOpacity={isLocked ? 1.0 : 0.8}
          style={styles.ufoTouchable}
        >
          {/* Wave & Rings Layers */}
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <View style={styles.centeredLayers}>
              <WavePulse color={levelColor} duration={2000} size={100} />
              <WavePulse color={levelColor} duration={2000} delay={1000} size={100} />

              {/* Orbital Rings */}
              {Array.from({ length: (index % 3) + 1 }).map((_, rIdx) => {
                let rx = '0deg';
                let ry = '0deg';
                if (rIdx === 0) rx = '75deg';
                if (rIdx === 1) ry = '75deg';
                if (rIdx === 2) { rx = '45deg'; ry = '45deg'; }

                return (
                  <OrbitalRing
                    key={`ring-${rIdx}`}
                    size={135 + (rIdx * 15)}
                    color={isCurrent ? levelColor : levelColor + '88'}
                    duration={isCurrent ? 3000 - (rIdx * 500) : 8000 + (rIdx * 2000)}
                    rotateX={rx}
                    rotateY={ry}
                  />
                );
              })}

              {isCurrent && (
                <OrbitalRing size={110} color="rgba(255,255,255,0.5)" duration={4000} />
              )}
            </View>
          </View>

          {/* Planet Node & Floating Spaceship */}
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <View style={[styles.centeredLayers, { zIndex: 10 }]}>
              <View style={[
                styles.nodeCore,
                isCurrent && styles.activeNodeCore,
                {
                  borderColor: levelColor + '88',
                  shadowColor: levelColor,
                  shadowOpacity: isCurrent ? 0.9 : 0.4,
                  shadowRadius: isCurrent ? 30 : 15,
                }
              ]}>
                <StationInnerGlow color={levelColor} isCurrent={isCurrent} />

                {!(item.id === 6 || item.id === 8) && (
                  <Image
                    source={{ uri: ICONS[index % ICONS.length] }}
                    style={styles.ufoIcon}
                    resizeMode="contain"
                  />
                )}

                {isLocked && (
                  <View style={styles.lockOverlay}>
                    <MaterialIcon
                      name={GAME_ICONS.LOCK.name}
                      family={GAME_ICONS.LOCK.family}
                      size={ICON_SIZES.LARGE}
                      color="rgba(255, 255, 255, 0.9)"
                    />
                  </View>
                )}
              </View>

              {/* Spaceship floats ABOVE the planet node */}
              {isCurrent && (
                <StaticSpaceship size={110} />
              )}
            </View>
          </View>

          {/* Station Title */}
          <View style={styles.titleContainer}>
            <Text style={[styles.levelTitleText, { color: levelColor }]}>
              {LEVEL_TITLES[index % LEVEL_TITLES.length]}
            </Text>
          </View>

          {/* Level Text */}
          <View style={styles.levelTextContainer}>
            <Text style={[styles.levelNumberText, { color: levelColor }]}>
              LEVEL {item.id}
            </Text>
          </View>

          {/* Star Reward Display */}
          {isPassed && (
            <View style={styles.starsContainer}>
              {[1, 2, 3].map(s => (
                <MaterialIcon
                  key={s}
                  name={s <= item.stars ? GAME_ICONS.STAR.name : GAME_ICONS.STAR_OUTLINE.name}
                  family={GAME_ICONS.STAR.family}
                  size={12}
                  color={s <= item.stars ? ICON_COLORS.GOLD : ICON_COLORS.DISABLED}
                  style={{ opacity: s <= item.stars ? 1 : 0.3 }}
                />
              ))}
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  });

  const getRoadmapPosition = (index: number) => {
    const isEven = index % 2 === 0;
    const x = SCREEN_WIDTH * (isEven ? 0.22 : 0.78);
    // INVERTED Y Logic: Level 1 (Index 0) at the BOTTOM
    // Total Levels = 100.
    // Index 0 -> Bottom. Index 99 -> Top.
    const verticalSpacing = 220;
    const topPadding = 150;
    const invertedIndex = (levels.length - 1) - index;

    const y = topPadding + (invertedIndex * verticalSpacing);

    return { x, y };
  };

  // Connecting dots removed for cleaner UI
  // const connectingDots = useMemo(() => {
  //   if (!dataLoaded) return null;
  //   const dots = [];
  //   for (let i = 0; i < levels.length - 1; i++) {
  //     const currentPos = getRoadmapPosition(i);
  //     const nextPos = getRoadmapPosition(i + 1);
  //     const numDots = 8; // Significantly reduced for faster loading
  //
  //     for (let j = 1; j < numDots; j++) {
  //       const t = j / numDots;
  //       const deltaX = nextPos.x - currentPos.x;
  //       const deltaY = nextPos.y - currentPos.y;
  //       const control1X = currentPos.x + deltaX * 0.2;
  //       const control1Y = currentPos.y + 120 + deltaY * 0.1;
  //       const control2X = currentPos.x + deltaX * 0.8;
  //       const control2Y = nextPos.y + 120 - deltaY * 0.1;
  //
  //       const dotX = Math.pow(1 - t, 3) * currentPos.x +
  //         3 * Math.pow(1 - t, 2) * t * control1X +
  //         3 * (1 - t) * Math.pow(t, 2) * control2X +
  //         Math.pow(t, 3) * nextPos.x;
  //
  //       const dotY = Math.pow(1 - t, 3) * (currentPos.y + 75) +
  //         3 * Math.pow(1 - t, 2) * t * control1Y +
  //         3 * (1 - t) * Math.pow(t, 2) * control2Y +
  //         Math.pow(t, 3) * (nextPos.y + 75);
  //
  //       const size = 3 + Math.sin(t * Math.PI) * 4;
  //       const dotColor = RING_COLORS[i % RING_COLORS.length];
  //       dots.push(
  //         <View
  //           key={`dot-${i}-${j}`}
  //           style={[
  //             styles.connectingDot,
  //             {
  //               left: dotX - size / 2,
  //               top: dotY - size / 2,
  //               width: size,
  //               height: size,
  //               borderRadius: size / 2,
  //               backgroundColor: dotColor,
  //               shadowColor: dotColor,
  //               opacity: 0.35,
  //             }
  //           ]}
  //         />
  //       );
  //     }
  //   }
  //   return dots;
  // }, [levels, dataLoaded]);

  return (
    <View style={styles.container}>
      {/* Background - Persistent across screens if needed, or specific per screen */}
      {/* GameScreen has its own background, Roadmap has its own. */}

      {showGameScreen ? (
        <GameScreen
          onBackPress={handleBackPress}
          level={selectedLevel}
          onLevelComplete={handleLevelComplete}
          initialAbilities={abilityInventory}
        />
      ) : (
        <View style={{ flex: 1 }}>
          <SpaceBackground />

          {/* Leaderboard Modal */}
          <Leaderboard
            isVisible={showLeaderboard}
            onClose={() => setShowLeaderboard(false)}
            currentUserScore={score}
            userId={user?.uid}
          />

          {/* Shop Modal */}
          {showShop && (
            <View style={styles.shopOverlay}>
              <View style={styles.shopModal}>
                <View style={styles.shopHeader}>
                  <Text style={styles.shopTitle}>ABILITY SHOP</Text>
                  <TouchableOpacity
                    style={styles.shopCloseBtn}
                    onPress={() => setShowShop(false)}
                  >
                    <MaterialIcon
                      name={GAME_ICONS.CLOSE.name}
                      family={GAME_ICONS.CLOSE.family}
                      size={ICON_SIZES.MEDIUM}
                      color={ICON_COLORS.WHITE}
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.shopCoins}>
                  <MaterialIcon
                    name={GAME_ICONS.COIN.name}
                    family={GAME_ICONS.COIN.family}
                    size={ICON_SIZES.LARGE}
                    color={ICON_COLORS.GOLD}
                  />
                  <Text style={styles.shopCoinsText}>{coins}</Text>
                </View>

                <View style={styles.shopGrid}>
                  {SHOP_ITEMS.map((item) => (
                    <View key={item.id} style={styles.shopItem}>
                      <View style={styles.shopItemIcon}>
                        <MaterialIcon
                          name={item.icon.name}
                          family={item.icon.family}
                          size={ICON_SIZES.XLARGE}
                          color={item.color}
                        />
                      </View>

                      <Text style={styles.shopItemName}>{item.name}</Text>
                      <Text style={styles.shopItemDesc}>{item.description}</Text>

                      <View style={styles.shopItemFooter}>
                        <View style={styles.shopItemPrice}>
                          <MaterialIcon
                            name={GAME_ICONS.COIN.name}
                            family={GAME_ICONS.COIN.family}
                            size={ICON_SIZES.SMALL}
                            color={ICON_COLORS.GOLD}
                          />
                          <Text style={styles.shopPriceText}>{item.price}</Text>
                        </View>

                        <TouchableOpacity
                          style={[
                            styles.shopBuyBtn,
                            coins < item.price && styles.shopBuyBtnDisabled
                          ]}
                          onPress={() => purchaseAbility(item.id, item.price)}
                          disabled={coins < item.price}
                        >
                          <MaterialIcon
                            name={GAME_ICONS.BUY.name}
                            family={GAME_ICONS.BUY.family}
                            size={ICON_SIZES.SMALL}
                            color={coins >= item.price ? ICON_COLORS.WHITE : ICON_COLORS.DISABLED}
                          />
                        </TouchableOpacity>
                      </View>

                      {/* Inventory count */}
                      {abilityInventory[item.id as keyof typeof abilityInventory] > 0 && (
                        <View style={styles.shopInventoryBadge}>
                          <Text style={styles.shopInventoryText}>
                            {abilityInventory[item.id as keyof typeof abilityInventory]}
                          </Text>
                        </View>
                      )}
                    </View>
                  ))}
                </View>

                {/* Rewarded Ad Section */}
                <View style={styles.shopRewardSection}>
                  <Text style={styles.shopRewardTitle}>EARN COINS</Text>
                  <RewardedAdButton
                    onReward={(amount) => {
                      setCoins((prev: any) => prev + amount);
                      console.log(`🎉 Rewarded ${amount} coins from ad!`);
                    }}
                    rewardAmount={50}
                  />
                </View>
              </View>
            </View>
          )}

          {/* Top HUD */}
          <TopHUD
            coins={coins}
            score={score}
            onProfilePress={() => {
              safeVibrate();
              setShowProfilePopup(true);
            }}
            onLogout={() => {
              safeVibrate();
              handleLogout();
            }}
          />

          <FlatList
            ref={flatListRef}
            data={reversedLevels}
            renderItem={({ item, index }) => <LevelItem item={item} index={levels.length - 1 - index} />}
            keyExtractor={(item) => item.id.toString()}
            style={styles.scrollView}
            contentContainerStyle={[styles.roadmapContainer, { paddingBottom: 220, paddingTop: 120 }]}
            showsVerticalScrollIndicator={false}
            initialNumToRender={6}
            maxToRenderPerBatch={3}
            windowSize={5}
            removeClippedSubviews={true}
            updateCellsBatchingPeriod={100}
            getItemLayout={(data, index) => ({
              length: 220,
              offset: 220 * index,
              index,
            })}
            initialScrollIndex={userGameData ? Math.max(0, levels.length - (userGameData.currentLevel || 1)) : levels.length - 1}
            onScrollToIndexFailed={(info) => {
              setTimeout(() => {
                flatListRef.current?.scrollToIndex({
                  index: info.index,
                  animated: false,
                  viewPosition: 0.5
                });
              }, 50);
            }}
          />

          {/* Bottom Navigation Bar */}
          <BottomNavBar
            onMap={() => {
              safeVibrate();
              // Scroll to current level
              if (userGameData) {
                const currentUserLevel = userGameData.currentLevel;
                const currentIndex = levels.findIndex(level => level.id === currentUserLevel);
                if (currentIndex !== -1) {
                  const reversedIndex = levels.length - 1 - currentIndex;
                  flatListRef.current?.scrollToIndex({
                    index: reversedIndex,
                    animated: true,
                    viewPosition: 0.5
                  });
                }
              }
            }}
            onLeaderboard={() => {
              safeVibrate();
              setShowLeaderboard(true);
            }}
            onShop={() => {
              safeVibrate();
              setShowShop(true);
            }}
            onAd={handleRewardedAdPress}
            onProfile={() => {
              safeVibrate();
              setShowProfilePopup(true);
            }}
          />

          {/* Ad Banner - Restored */}
          <View style={localStyles.adBannerContainer}>
            <AdBanner />
          </View>

          {/* Profile Popup */}
          <ProfilePopup
            visible={showProfilePopup}
            onClose={() => setShowProfilePopup(false)}
            user={user}
            userGameData={userGameData}
            coins={coins}
            currentLevel={currentLevel}
          />

          {/* Earn Coins Popup */}
          <EarnCoinsPopup
            visible={showEarnCoinsPopup}
            onClose={() => setShowEarnCoinsPopup(false)}
            onWatchAd={handleWatchAd}
            isAdLoaded={isAdLoaded}
          />

        </View>
      )}

      {/* Loading Overlay - Visible on top during transitions */}
      {isLoading && <LoadingIndicator />}
      <ToastNotification ref={toastRef} />
    </View>
  );
};

export default Roadmap;

const localStyles = StyleSheet.create({
  topHudContainer: {
    // Override the generic dashboardContainer positioning/styles where needed
    // Maintain the container style (styles.dashboardContainer) from RoadmapStyles:
    // backgroundColor: 'rgba(5, 5, 10, 0.98)', borderWidth: 2, borderColor: '#00E0FF', etc.
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 85, // Increased height to prevent profile clipping
    paddingVertical: 10,
    paddingHorizontal: 15,
    top: 50,
    zIndex: 100,
  },
  profileButton: {
    padding: 2,
    borderWidth: 2,
    borderColor: '#00E0FF',
    borderRadius: 30, // Circle
    backgroundColor: 'rgba(0,0,0,0.5)',
    shadowColor: '#00E0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 5,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statBadgeNeon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 224, 255, 0.5)', // Neon Blue tint
    shadowColor: '#00E0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  statValue: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 6,
    fontFamily: 'monospace',
    textShadowColor: 'rgba(0, 224, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  logoutButton: {
    padding: 5,
  },
  bottomNavGrid: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    backgroundColor: 'rgba(5, 5, 10, 0.98)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly', // Even distribution of 5 elements
    paddingHorizontal: 0,
    paddingBottom: 10,
    borderTopWidth: 2,
    borderTopColor: '#00E0FF',
    shadowColor: '#00E0FF',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 20,
    zIndex: 90,
  },
  placeholderNavItem: {
    width: 60, // Match Map button width
    height: '100%',
  },
  centerBtnContainer: {
    position: 'absolute',
    left: '50%',
    top: -25, // Float up
    marginLeft: -30, // Half of width (60/2)
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  centerMapBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#00E0FF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00E0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 10,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  adBannerContainer: {
    position: 'absolute',
    bottom: 110, // Increased more to be safely above the raised Map button and its text
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    alignItems: 'center',
    zIndex: 95,
  },
  // We need to adjust styles for AdBanner container if we want it visible
  // The original styles.adBannerContainer was bottom: 0. 
  // I will just let them overlap for now or rely on the user to request adjustment if it looks bad.
  // Wait, I can override adBannerContainer style in the render.

  navItem: {
    width: 60, // Fixed width for all items ensures perfectly equal spacing
    alignItems: 'center',
    justifyContent: 'center',
    padding: 5,
  },
  navText: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 4,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  popupOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
  },
  popupContent: {
    width: '90%',
    backgroundColor: 'rgba(5, 5, 10, 0.98)',
    borderTopLeftRadius: 40,
    borderBottomRightRadius: 40,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 10,
    borderWidth: 2,
    borderColor: '#00E0FF',
    padding: 30,
    alignItems: 'center',
    shadowColor: '#00E0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 25,
    elevation: 20,
    overflow: 'hidden',
  },
  closePopupBtn: {
    position: 'absolute',
    top: 15,
    right: 15,
    padding: 5,
  },
  popupAvatar: {
    marginBottom: 20,
    shadowColor: ICON_COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
  },
  popupName: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
    textShadowColor: '#00E0FF',
    textShadowRadius: 10,
  },
  popupLabel: {
    color: '#00E0FF',
    fontSize: 14,
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: 20,
  },
  profileStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 25,
    paddingHorizontal: 10,
  },
  profileStatItem: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 15,
    backgroundColor: 'rgba(0, 224, 255, 0.1)',
    borderRadius: 15,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: 'rgba(0, 224, 255, 0.3)',
  },
  profileStatLabel: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 5,
    marginBottom: 3,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  profileStatValue: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    textShadowColor: '#00E0FF',
    textShadowRadius: 5,
  },
  profileSettingsContainer: {
    width: '100%',
    marginTop: 10,
  },
  profileSectionTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    textShadowColor: '#00E0FF',
    textShadowRadius: 5,
  },
  profileSettingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0, 224, 255, 0.05)',
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 224, 255, 0.2)',
  },
  profileSettingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileSettingLabel: {
    color: '#FFF',
    fontSize: 16,
    marginLeft: 12,
    fontWeight: '600',
  },
  profileToggle: {
    width: 50,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(148, 163, 184, 0.3)',
    justifyContent: 'center',
    paddingHorizontal: 2,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.5)',
  },
  profileToggleActive: {
    backgroundColor: 'rgba(0, 224, 255, 0.3)',
    borderColor: '#00E0FF',
  },
  profileToggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#94A3B8',
    alignSelf: 'flex-start',
  },
  profileToggleThumbActive: {
    backgroundColor: '#00E0FF',
    alignSelf: 'flex-end',
    shadowColor: '#00E0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  profileSettingDisabled: {
    opacity: 0.5,
  },
  profileSettingLabelDisabled: {
    color: '#94A3B8',
  },
  profileToggleDisabled: {
    opacity: 0.3,
  },
  // Earn Coins Popup Styles
  earnCoinsPopupContent: {
    width: '85%',
    backgroundColor: 'rgba(5, 5, 10, 0.98)',
    borderTopLeftRadius: 30,
    borderBottomRightRadius: 30,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 10,
    borderWidth: 2,
    borderColor: ICON_COLORS.GOLD,
    padding: 30,
    alignItems: 'center',
    shadowColor: ICON_COLORS.GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 25,
    elevation: 20,
    overflow: 'hidden',
  },
  earnCoinsIcon: {
    marginBottom: 20,
    shadowColor: ICON_COLORS.GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
  },
  earnCoinsTitle: {
    color: '#FFF',
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    textShadowColor: ICON_COLORS.GOLD,
    textShadowRadius: 10,
  },
  earnCoinsDescription: {
    color: '#94A3B8',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 25,
    paddingHorizontal: 10,
  },
  earnCoinsRewardBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 25,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  earnCoinsRewardText: {
    color: ICON_COLORS.GOLD,
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
    textShadowColor: ICON_COLORS.GOLD,
    textShadowRadius: 5,
  },
  earnCoinsButtons: {
    width: '100%',
    gap: 15,
  },
  earnCoinsWatchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ICON_COLORS.GOLD,
    borderRadius: 25,
    paddingVertical: 15,
    paddingHorizontal: 30,
    shadowColor: ICON_COLORS.GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 10,
  },
  earnCoinsWatchBtnDisabled: {
    backgroundColor: '#94A3B8',
    shadowColor: '#94A3B8',
  },
  earnCoinsWatchBtnText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  earnCoinsLaterBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.5)',
  },
  earnCoinsLaterBtnText: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: '600',
  },
});