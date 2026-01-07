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
import { GAME_ICONS, ICON_COLORS, ICON_SIZES } from '../config/icons';
import { getLevelPattern, getLevelMoves } from '../data/levelPatterns';
import { useAuth } from '../context/AuthContext';
import { styles, SCREEN_WIDTH, SCREEN_HEIGHT } from "../styles/RoadmapStyles";
import BackendService from '../services/BackendService';
import ConfigService from '../services/ConfigService';
import ConfirmationModal from './ConfirmationModal';
import ToastNotification, { ToastRef } from './ToastNotification';
import SettingsService from '../services/SettingsService';
import Shop from './Shop';
import HelpSlider from './HelpSlider';
import HelpButton from './HelpButton';

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

// Initial fallback for UI while loading (empty until backend fetches)

// Top HUD Component - with Modern Floating Design
const TopHUD = ({ coins, score, onProfilePress, onHelp }: any) => (
  <View style={localStyles.topHudWrapper}>
    <View style={localStyles.topHudInner}>
      {/* Profile Section */}
      <TouchableOpacity onPress={onProfilePress} style={localStyles.topHudProfileBtn}>
        <View style={localStyles.topHudAvatarCircle}>
          <MaterialIcon name="person" family="material" size={24} color="#00E0FF" />
        </View>
      </TouchableOpacity>

      {/* Stats Section */}
      <View style={localStyles.topHudStats}>
        <View style={localStyles.topHudStatItem}>
          <MaterialIcon name="stars" family="material" size={16} color={ICON_COLORS.SUCCESS} />
          <Text style={localStyles.topHudStatText}>{score.toLocaleString()}</Text>
        </View>
        <View style={localStyles.topHudDivider} />
        <View style={localStyles.topHudStatItem}>
          <MaterialIcon name="toll" family="material" size={16} color={ICON_COLORS.GOLD} />
          <Text style={localStyles.topHudStatText}>{typeof coins === 'number' ? coins.toLocaleString() : coins}</Text>
        </View>
      </View>

      {/* Help Section */}
      <TouchableOpacity onPress={onHelp} style={localStyles.topHudHelpBtn}>
        <MaterialIcon name="help-outline" family="material" size={22} color="rgba(255,255,255,0.7)" />
      </TouchableOpacity>
    </View>
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
const ProfilePopup = ({ visible, onClose, user, userGameData, coins, currentLevel, onLogout }: any) => {
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [vibrationSupported, setVibrationSupported] = useState(true);

  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Load vibration setting on mount
  useEffect(() => {
    if (visible) {
      // Load vibration setting
      const loadVibrationSetting = async () => {
        try {
          await SettingsService.ensureLoaded();
          setVibrationEnabled(SettingsService.getSetting('vibrationEnabled'));
          setVibrationSupported(SettingsService.isVibrationSupported());
        } catch (error) {
          console.error('Error loading vibration setting:', error);
          setVibrationEnabled(true);
          setVibrationSupported(true);
        }
      };
      loadVibrationSetting();

      // Start animations
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.9);
      opacityAnim.setValue(0);
    }
  }, [visible, scaleAnim, opacityAnim]);

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
      <Animated.View style={[
        localStyles.popupContent,
        {
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }]
        }
      ]}>
        {/* Header Background Decoration */}
        <View style={localStyles.profileHeaderBg}>
          <View style={localStyles.profileHeaderCircle} />
        </View>

        <TouchableOpacity style={localStyles.closePopupBtn} onPress={onClose}>
          <MaterialIcon name="close" family="material" size={24} color="#FFF" />
        </TouchableOpacity>

        <View style={localStyles.profileMainCard}>
          <View style={localStyles.popupAvatar}>
            <View style={localStyles.avatarRing}>
              <MaterialIcon name="account-circle" family="material" size={90} color={ICON_COLORS.PRIMARY} />
            </View>
            <View style={localStyles.onlineStatus} />
          </View>

          <Text style={localStyles.popupName}>{cleanName}</Text>
          <Text style={localStyles.popupLabel}>SPACE COMMANDER</Text>

          <View style={localStyles.rankBadge}>
            <MaterialIcon name="verified" family="material" size={14} color="#00E0FF" />
            <Text style={localStyles.rankText}>ELITE EXPLORER</Text>
          </View>
        </View>

        {/* Nested Cards Section */}
        <View style={localStyles.cardsContainer}>
          <Text style={localStyles.sectionHeader}>COMMANDER STATS</Text>
          <View style={localStyles.profileStatsGrid}>
            <View style={localStyles.nestedCard}>
              <View style={[localStyles.cardIconBox, { backgroundColor: 'rgba(0, 224, 255, 0.1)' }]}>
                <MaterialIcon name="trending-up" family="material" size={22} color={ICON_COLORS.SUCCESS} />
              </View>
              <View style={localStyles.cardContent}>
                <Text style={localStyles.cardValue}>{currentLevel}</Text>
                <Text style={localStyles.cardLabel}>LEVEL</Text>
              </View>
            </View>

            <View style={localStyles.nestedCard}>
              <View style={[localStyles.cardIconBox, { backgroundColor: 'rgba(255, 214, 10, 0.1)' }]}>
                <MaterialIcon name="monetization-on" family="material" size={22} color={ICON_COLORS.GOLD} />
              </View>
              <View style={localStyles.cardContent}>
                <Text style={localStyles.cardValue}>{coins.toLocaleString()}</Text>
                <Text style={localStyles.cardLabel}>COINS</Text>
              </View>
            </View>

            <View style={localStyles.nestedCard}>
              <View style={[localStyles.cardIconBox, { backgroundColor: 'rgba(255, 59, 48, 0.1)' }]}>
                <MaterialIcon name="stars" family="material" size={22} color="#FF3B30" />
              </View>
              <View style={localStyles.cardContent}>
                <Text style={localStyles.cardValue}>{(userGameData?.totalScore || 0).toLocaleString()}</Text>
                <Text style={localStyles.cardLabel}>EXP</Text>
              </View>
            </View>

            <View style={localStyles.nestedCard}>
              <View style={[localStyles.cardIconBox, { backgroundColor: 'rgba(88, 86, 214, 0.1)' }]}>
                <MaterialIcon name="visibility" family="material" size={22} color="#5856D6" />
              </View>
              <View style={localStyles.cardContent}>
                <Text style={localStyles.cardValue}>{(userGameData?.totalAdEarnings || 0).toLocaleString()}</Text>
                <Text style={localStyles.cardLabel}>AD REWARD</Text>
              </View>
            </View>
          </View>

          <Text style={localStyles.sectionHeader}>SYSTEM SETTINGS</Text>
          <View style={localStyles.settingsCard}>
            <TouchableOpacity
              style={[
                localStyles.settingRow,
                !vibrationSupported && localStyles.profileSettingDisabled
              ]}
              onPress={toggleVibration}
              disabled={!vibrationSupported}
            >
              <View style={localStyles.settingInfo}>
                <View style={localStyles.settingIconWrap}>
                  <MaterialIcon
                    name={GAME_ICONS.VIBRATION.name}
                    family={GAME_ICONS.VIBRATION.family}
                    size={20}
                    color={vibrationEnabled ? ICON_COLORS.PRIMARY : "#94A3B8"}
                  />
                </View>
                <Text style={localStyles.settingText}>Haptic Feedback</Text>
              </View>
              <View style={[
                localStyles.modernToggle,
                vibrationEnabled && vibrationSupported && localStyles.toggleActive
              ]}>
                <View style={[
                  localStyles.toggleCircle,
                  vibrationEnabled && vibrationSupported && localStyles.circleActive
                ]} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout Section */}
        <TouchableOpacity style={localStyles.modernLogoutBtn} onPress={onLogout}>
          <MaterialIcon name="power-settings-new" family="material" size={20} color="#FFF" />
          <Text style={localStyles.logoutBtnText}>DISCONNECT SESSION</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};



// Earn Coins Popup Component
const EarnCoinsPopup = ({ visible, onClose, onWatchAd, rewardAmount }: any) => {
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
          <Text style={localStyles.earnCoinsRewardText}>+{rewardAmount} Coins</Text>
        </View>

        {/* Action Buttons */}
        <View style={localStyles.earnCoinsButtons}>
          <RewardedAdButton
            onReward={(amount) => {
              onWatchAd(amount);
            }}
            rewardAmount={rewardAmount}
            style={localStyles.earnCoinsWatchBtnComponent}
          />

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
  const [showInstructionModal, setShowInstructionModal] = useState(false);
  const [showEarnCoinsPopup, setShowEarnCoinsPopup] = useState(false);
  const [userGameData, setUserGameData] = useState<any>({
    completedLevels: [],
    levelStars: {},
    currentLevel: 1,
    highScore: 0,
    totalCoins: 0,
    abilities: {}
  });
  const [dataLoaded, setDataLoaded] = useState(false);
  const [adRewardAmount, setAdRewardAmount] = useState(0);
  const [baseRewardAmount, setBaseRewardAmount] = useState(10);
  const [starBonusAmount, setStarBonusAmount] = useState(5);
  const [abilityStartingCounts, setAbilityStartingCounts] = useState<Record<string, number>>({});
  const [loadingDirection, setLoadingDirection] = useState<'toFight' | 'toBase'>('toFight');
  const toastRef = useRef<ToastRef>(null);

  const handleLogout = async () => {
    await BackendService.logout();
    signOut();
  };

  // Ability inventory - ONLY stores PURCHASED abilities (base abilities are added per level in GameScreen)
  const [abilityInventory, setAbilityInventory] = useState<Record<string, number>>({});

  // Removed manual rewarded ad state in favor of RewardedAdButton component

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

        // Backend stores TOTAL abilities (base + purchased)
        // We need to extract ONLY purchased abilities for the inventory
        const backendAbilities = result.data.abilities || {};

        // Fetch Dynamic Configs (Abilities and Ads) e,arly to know which abilities exist
        let abilitiesConfig: any[] = [];
        let adReward = 50;
        try {
          // Fetch abilities, ad config, AND ad units to get the correct reward amount
          const [aConfig, adConfig, adUnitsData, gameConfigData] = await Promise.all([
            ConfigService.getAbilitiesConfig(),
            ConfigService.getAdConfig(),
            ConfigService.getAdUnits(), // Fetch ad units which contain the reward amount
            ConfigService.getGameConfig() // Fetch game config which contains level rewards
          ]);
          abilitiesConfig = aConfig || [];

          // Prioritize dynamic ad unit reward, fallback to legacy adConfig, then default 50
          if (adUnitsData && adUnitsData.rewardedAmount) {
            adReward = adUnitsData.rewardedAmount;
            console.log('💰 Using Rewarded Amount from AdUnit:', adReward);
          } else if (adConfig && adConfig.rewardConfig) {
            adReward = adConfig.rewardConfig.coinsPerAd;
          }
          setAdRewardAmount(adReward);

          // Update game settings (base coins and star bonus from DB)
          if (gameConfigData && gameConfigData.gameSettings) {
            setBaseRewardAmount(gameConfigData.gameSettings.baseCoins || 10);
            setStarBonusAmount(gameConfigData.gameSettings.starBonusBase || 5);
            console.log('💰 Using Game Rewards from DB:', gameConfigData.gameSettings);
          }
        } catch (configErr) {
          console.warn('Failed to load dynamic configs:', configErr);
        }

        // Initialize new users with 0 purchased abilities
        if (result.data.currentLevel <= 1 && result.data.totalScore === 0 && (!backendAbilities || Object.keys(backendAbilities).length === 0)) {
          const initialAbilities: Record<string, number> = {};
          abilitiesConfig.forEach(a => { initialAbilities[a.name] = 0; });

          if (Object.keys(initialAbilities).length > 0) {
            await BackendService.updateAbilities(initialAbilities);
            setAbilityInventory(initialAbilities);
          }
        } else {
          const startingCounts: Record<string, number> = {};
          if (abilitiesConfig.length > 0) {
            abilitiesConfig.forEach(a => {
              startingCounts[a.name] = a.startingCount;
            });
            setAbilityStartingCounts(startingCounts);
          }

          // Calculate purchased abilities dynamically using dynamic starting counts
          const purchasedAbilities: Record<string, number> = {};
          Object.keys(backendAbilities).forEach(key => {
            purchasedAbilities[key] = Math.max(0, backendAbilities[key] - (startingCounts[key] ?? 2));
          });
          setAbilityInventory(purchasedAbilities);
        }

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

  // Manual ad initialization removed in favor of RewardedAdButton component

  // Handle rewarded ad button press - show popup first
  const handleRewardedAdPress = () => {
    safeVibrate();
    setShowEarnCoinsPopup(true);
  };

  // Handle watching the ad from popup
  const handleWatchAd = async (amount: number) => {
    try {
      console.log(`🎬 handleWatchAd called with amount: ${amount}`);

      // Call backend first to get server-validated reward amount
      const result = await BackendService.updateCoins(amount, 'add', true);

      if (result.success && result.newBalance !== undefined) {
        // Update local state with the actual validated amount from backend
        setCoins(result.newBalance);
        const actualAmount = result.previousBalance !== undefined
          ? result.newBalance - result.previousBalance
          : amount;

        // Update userGameData to reflect new totalCoins and totalAdEarnings
        setUserGameData((prev: any) => {
          if (!prev) return prev;
          return {
            ...prev,
            totalCoins: result.newBalance,
            totalAdEarnings: (prev.totalAdEarnings || 0) + actualAmount
          };
        });

        toastRef.current?.show(`Earned ${actualAmount} bonus coins!`, 'success');
        console.log(`✅ Synced ${actualAmount} rewarded coins to backend`);
      } else {
        console.error('Failed to update coins:', result.error);
        toastRef.current?.show('Failed to update coins', 'error');
      }
    } catch (error) {
      console.error('Failed to sync rewarded coins:', error);
      toastRef.current?.show('Network error', 'error');
    }
  };

  // Save user data - removed local StorageService calls, relying on explicit backend calls
  useEffect(() => {
    // No longer auto-saving every state change to avoid excessive API calls
    // Level complete and Purchases have their own backend calls now.
  }, []);

  // Update leaderboard entry is now handled by backend during submission

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

      // Keep purchased abilities (base abilities are provided per level automatically)

      // Create updated data object
      const updatedGameData = {
        ...userGameData,
        currentLevel: newCurrentLevel,
        totalScore: newTotalScore, // Optimistic update
        // We also want to update highScore (single best run) if applicable, though typically less visible
        highScore: Math.max(userGameData?.highScore || 0, finalScore),
        totalCoins: newTotalCoins,
        // Keep existing purchased abilities (base abilities provided per level)
        abilities: abilityInventory,
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
      // Keep purchased abilities for next level
      setCurrentLevel(newCurrentLevel);

      // Show appropriate completion message
      if (stars >= 2) {
        toastRef.current?.show(`Level Complete! Next level unlocked!`, 'success');
      } else {
        toastRef.current?.show(`Level Complete! Need 2+ stars to unlock next level. Try again for more stars!`, 'info');
      }

      // 2. BACKEND SYNC: Submit game session to backend
      if (user) {
        try {
          const sessionDataToSubmit = sessionData || {
            level: completedLevel,
            score: finalScore,
            moves: 0,
            stars,
            duration: 0,
            abilitiesUsed: sessionData?.abilitiesUsed || {},
            bubblesDestroyed: 0,
            chainReactions: 0,
            perfectShots: 0,
            coinsEarned: coinsEarned || 0,
            isWin: stars > 0
          };

          console.log('📤 Submitting game session to backend:', sessionDataToSubmit);
          const sessionResult = await BackendService.submitGameSession(sessionDataToSubmit);

          if (sessionResult.success && sessionResult.data) {
            console.log('✅ Game session submitted successfully:', sessionResult.data.sessionId);

            // CORRECT STATE WITH SERVER DATA
            // The backend is the source of truth for rewards (DB-configured values)
            const serverData = sessionResult.data;

            if (serverData.updatedGameData) {
              console.log('🔄 Syncing local state with server response...');

              setUserGameData((prev: any) => ({
                ...prev,
                ...serverData.updatedGameData
              }));

              // Update individual state atoms to match server truth
              if (serverData.updatedGameData.totalCoins !== undefined) {
                setCoins(serverData.updatedGameData.totalCoins);
              }
              if (serverData.updatedGameData.totalScore !== undefined) {
                setScore(serverData.updatedGameData.totalScore);
              }

              // Check if our optimistic coin calculation was wrong and notify
              if (coinsEarned !== serverData.coinsEarned) {
                console.log(`💰 Coin correction: Optimistic ${coinsEarned} -> Real ${serverData.coinsEarned}`);
                // Optional: Toast nice message if the reward was actually higher
                if (serverData.coinsEarned > (coinsEarned || 0)) {
                  // toastRef.current?.show(`Bonus! You earned ${serverData.coinsEarned} coins!`, 'success');
                }
              }
            }
          } else {
            console.error('❌ Failed to submit game session:', sessionResult.error);
            // Fallback: Try to explicit update if session failed but we want to persist optimistic
            // (Existing logic handles this via catch block or subsequent calls)
          }

          // Skip the separate updateUserGameData call since submitGameSession handles it now
          // But we assume the submitGameSession was successful.
          if (!sessionResult.success) {
            // Only try manual update if session submission messed up
            try {
              const updateResult = await BackendService.updateUserGameData(updatedGameData);
              if (updateResult.success) {
                console.log('✅ User game data updated in backend (fallback)');
              } else {
                console.error('❌ Failed to update user game data:', updateResult.error);
                toastRef.current?.show('Progress saved locally. Backend sync will retry later.', 'warning');
              }
            } catch (error) {
              console.error('❌ Backend update error:', error);
              toastRef.current?.show('Progress saved locally. Backend sync will retry later.', 'warning');
            }
          } else {
            console.log('✅ Backend sync complete via session submission');
          }

        } catch (error) {
          console.error('❌ Backend sync error:', error);
        }

        // Update purchased abilities in backend (abilityInventory contains ONLY purchased, not base)
        try {
          await BackendService.updateAbilities(abilityInventory);
          console.log('✅ Synced purchased abilities to backend:', abilityInventory);
        } catch (error) {
          console.error('Failed to sync abilities to backend:', error);
        }

        // 3. Trigger Background Sync
        loadUserData(false);
      }

      // 4. Navigate UI based on Action and Stars
      if (action === 'next' && stars >= 2) {
        // Progress to next level only if we got 2+ stars
        if (completedLevel < levels.length) {
          // Prepare to move to next level
          setSelectedLevel(completedLevel + 1);
          setLoadingDirection('toFight');
          setIsLoading(true);

          // Close current GameScreen and reopen with next level to reset modal state
          setShowGameScreen(false);

          setTimeout(() => {
            // Reopen GameScreen with next level - this will reset the game state and close modal
            setShowGameScreen(true);
            setIsLoading(false);
          }, 1000);
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
    <View style={{ flex: 1, backgroundColor: '#000' }}>

      {/* Background - Persistent across screens if needed, or specific per screen */}
      {/* GameScreen has its own background, Roadmap has its own. */}

      {showGameScreen ? (
        <GameScreen
          onBackPress={handleBackPress}
          level={selectedLevel}
          onLevelComplete={handleLevelComplete}
          initialAbilities={abilityInventory} // Pass purchased abilities
          initialStartingCounts={abilityStartingCounts}
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
          <Shop
            visible={showShop}
            onClose={() => setShowShop(false)}
            coins={coins}
            onCoinsUpdate={(newCoins) => {
              setCoins(newCoins);
              // Optimistically update total coins in userGameData
              setUserGameData((prev: any) => ({ ...prev, totalCoins: newCoins }));
            }}
            abilityInventory={abilityInventory}
            onInventoryUpdate={setAbilityInventory}
            abilityStartingCounts={abilityStartingCounts}
            onWatchAd={(amount) => handleWatchAd(amount)}
            adRewardAmount={adRewardAmount}
          />

          {/* Top HUD */}
          <TopHUD
            coins={coins}
            score={score}
            onProfilePress={() => {
              safeVibrate();
              setShowProfilePopup(true);
            }}
            onHelp={() => {
              safeVibrate();
              setShowInstructionModal(true);
            }}
          />

          <FlatList
            ref={flatListRef}
            data={reversedLevels}
            renderItem={({ item, index }) => <LevelItem item={item} index={levels.length - 1 - index} />}
            keyExtractor={(item) => item.id.toString()}
            style={styles.scrollView}
            contentContainerStyle={[styles.roadmapContainer, { paddingBottom: 220, paddingTop: 150 }]}
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
            ListEmptyComponent={<Text style={{ color: 'white', marginTop: 200, textAlign: 'center' }}>No Levels Loaded</Text>}
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
            onLogout={handleLogout}
          />

          {/* Earn Coins Popup */}
          <EarnCoinsPopup
            visible={showEarnCoinsPopup}
            onClose={() => setShowEarnCoinsPopup(false)}
            onWatchAd={(amount: number) => {
              handleWatchAd(amount);
              setShowEarnCoinsPopup(false);
            }}
            rewardAmount={adRewardAmount}
          />

          {/* Help Slider (replaces Instruction Modal) */}
          <HelpSlider
            visible={showInstructionModal}
            onClose={() => setShowInstructionModal(false)}
            adRewardAmount={adRewardAmount}
            levelReward={baseRewardAmount}
            starBonus={starBonusAmount}
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
  // Top HUD Styles
  topHudWrapper: {
    position: 'absolute',
    top: 50,
    left: '5%',
    right: '5%',
    zIndex: 100,
  },
  topHudInner: {
    backgroundColor: 'rgba(10, 10, 20, 0.95)',
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 224, 255, 0.4)',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    paddingRight: 15,
    shadowColor: '#00E0FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  topHudProfileBtn: {
    marginRight: 12,
  },
  topHudAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 224, 255, 0.1)',
    borderWidth: 1.5,
    borderColor: '#00E0FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topHudStats: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginRight: 12,
  },
  topHudStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topHudStatText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '900',
    marginLeft: 8,
    fontFamily: 'monospace',
    letterSpacing: 0.5,
  },
  topHudDivider: {
    width: 1.5,
    height: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 15,
  },
  topHudHelpBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
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
  // Profile popup Styles
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
    width: '92%',
    maxWidth: 450,
    backgroundColor: '#0A0A14',
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 224, 255, 0.3)',
    shadowColor: '#00E0FF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 20,
    overflow: 'hidden',
    paddingBottom: 25,
  },
  profileHeaderBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: 'rgba(0, 224, 255, 0.05)',
    overflow: 'hidden',
  },
  profileHeaderCircle: {
    position: 'absolute',
    top: -100,
    right: -50,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(0, 224, 255, 0.1)',
  },
  closePopupBtn: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: 8,
    borderRadius: 20,
    // Explicitly remove shadow/elevation that might be inherited or caused by interaction
    elevation: 0,
    shadowOpacity: 0,
  },
  profileMainCard: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  popupAvatar: {
    position: 'relative',
    marginBottom: 15,
  },
  avatarRing: {
    padding: 4,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#00E0FF',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  onlineStatus: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#00FF88',
    borderWidth: 3,
    borderColor: '#0A0A14',
  },
  popupName: {
    color: '#FFF',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 224, 255, 0.5)',
    textShadowRadius: 10,
  },
  popupLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 3,
    marginTop: 4,
  },
  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 224, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 224, 255, 0.2)',
  },
  rankText: {
    color: '#00E0FF',
    fontSize: 10,
    fontWeight: '900',
    marginLeft: 6,
    letterSpacing: 1,
  },
  cardsContainer: {
    paddingHorizontal: 20,
  },
  sectionHeader: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 12,
    marginTop: 10,
  },
  profileStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  nestedCard: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  cardIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  cardContent: {
    flex: 1,
  },
  cardValue: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900',
    fontFamily: 'monospace',
  },
  cardLabel: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
  },
  settingsCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingText: {
    color: '#E2E8F0',
    fontSize: 15,
    fontWeight: '600',
  },
  modernToggle: {
    width: 46,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1E1E2E',
    padding: 3,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: 'rgba(0, 224, 255, 0.2)',
  },
  toggleCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#475569',
  },
  circleActive: {
    backgroundColor: '#00E0FF',
    transform: [{ translateX: 22 }],
  },
  modernLogoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    marginHorizontal: 20,
    marginTop: 25,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.2)',
  },
  logoutBtnText: {
    color: '#FF3B30',
    fontSize: 13,
    fontWeight: '900',
    marginLeft: 10,
    letterSpacing: 1.5,
  },
  profileSettingDisabled: {
    opacity: 0.5,
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
  earnCoinsWatchBtnComponent: {
    backgroundColor: 'rgba(255, 214, 10, 0.1)',
    borderColor: ICON_COLORS.GOLD,
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