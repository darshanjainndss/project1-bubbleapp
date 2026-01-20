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
  TextInput,
  Modal,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import LottieView from 'lottie-react-native';
import GameScreen from './GameScreen';
import SpaceBackground from "../components/common/SpaceBackground";
import Leaderboard from './LeaderboardScreen';
import MaterialIcon from '../components/common/MaterialIcon';
import AdBanner from '../components/common/AdBanner';
import RewardedAdButton from '../components/common/RewardedAdButton';
import { GAME_ICONS, ICON_COLORS, ICON_SIZES } from '../config/icons';
import { getLevelPattern, getLevelMoves } from '../data/levelPatterns';
import { useAuth } from '../context/AuthContext';
import { styles, SCREEN_WIDTH, SCREEN_HEIGHT } from "../styles/screens/RoadmapStyles";
import BackendService from '../services/BackendService';
import ConfigService from '../services/ConfigService';
import ConfirmationModal from '../components/common/ConfirmationModal';
import ToastNotification, { ToastRef } from '../components/common/ToastNotification';
import SettingsService from '../services/SettingsService';
// Removed ethers due to Metro bundling issues in React Native. Using regex for validation instead.
import Shop from '../components/game/Shop';
import RewardHistory from '../components/game/RewardHistory';
import WithdrawHistory from '../components/game/WithdrawHistory';

import WithdrawModal from '../components/game/WithdrawModal';
import ProfilePopup from '../components/game/ProfilePopup';
import EarnCoinsPopup from '../components/game/EarnCoinsPopup';
import HelpSlider from '../components/common/HelpSlider';
import HelpButton from '../components/common/HelpButton';
import MessageModal from '../components/common/MessageModal';

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
];

const localStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  withdrawCard: {
    width: SCREEN_WIDTH * 0.85,
    backgroundColor: '#0A0A14',
    borderRadius: 30,
    padding: 25,
    borderWidth: 1,
    borderColor: 'rgba(0, 224, 255, 0.3)',
    alignItems: 'center',
  },
  withdrawTitle: {
    color: '#00E0FF',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 5,
    letterSpacing: 2,
  },
  withdrawLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 20,
    letterSpacing: 1,
  },
  withdrawInput: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: SCREEN_WIDTH > 380 ? 12 : 10,
    color: '#FFF',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  withdrawBtn: {
    width: '100%',
    backgroundColor: '#00FF88',
    borderRadius: 15,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  withdrawBtnText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1,
  },
  withdrawCancelBtn: {
    marginTop: 15,
    padding: 10,
  },
  withdrawCancelText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
  },
  withdrawInlineBtn: {
    backgroundColor: 'rgba(0, 255, 136, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 136, 0.3)',
  },
  withdrawInlineText: {
    color: '#00FF88',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  // Top HUD Styles
  topHudWrapper: {
    position: 'absolute',
    top: 50,
    left: SCREEN_WIDTH > 600 ? (SCREEN_WIDTH - 600) / 2 : '5%',
    right: SCREEN_WIDTH > 600 ? (SCREEN_WIDTH - 600) / 2 : '5%',
    maxWidth: 600,
    zIndex: 100,
  },
  topHudInner: {
    backgroundColor: 'rgba(10, 10, 20, 0.95)',
    borderRadius: SCREEN_WIDTH > 380 ? 25 : 20,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 224, 255, 0.4)',
    flexDirection: 'row',
    alignItems: 'center',
    padding: SCREEN_WIDTH > 380 ? 8 : 6,
    paddingRight: SCREEN_WIDTH > 380 ? 15 : 10,
    shadowColor: '#00E0FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  topHudProfileBtn: {
    marginRight: SCREEN_WIDTH > 380 ? 12 : 8,
  },
  topHudAvatarCircle: {
    width: SCREEN_WIDTH > 380 ? 44 : 38,
    height: SCREEN_WIDTH > 380 ? 44 : 38,
    borderRadius: SCREEN_WIDTH > 380 ? 22 : 19,
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
    fontSize: SCREEN_WIDTH > 380 ? 14 : 11,
    fontWeight: '900',
    marginLeft: SCREEN_WIDTH > 380 ? 8 : 4,
    fontFamily: 'monospace',
    letterSpacing: 0.5,
  },
  topHudDivider: {
    width: 1.5,
    height: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 15,
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
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
  },
  navText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  centerMapBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#00E0FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#000',
    shadowColor: '#00E0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  adBannerContainer: {
    position: 'absolute',
    bottom: 80, // Above nav bar
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 80,
  },
  popupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  earnCoinsPopupContent: {
    width: SCREEN_WIDTH * 0.85,
    backgroundColor: '#0A0A14',
    borderRadius: 30,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 214, 10, 0.3)',
    shadowColor: ICON_COLORS.GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 25,
    elevation: 20,
    overflow: 'hidden',
  },
  closePopupBtn: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
    padding: 5,
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
    fontSize: SCREEN_WIDTH > 400 ? 26 : 22,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    textShadowColor: ICON_COLORS.GOLD,
    textShadowRadius: 10,
  },
  earnCoinsDescription: {
    color: '#94A3B8',
    fontSize: SCREEN_WIDTH > 400 ? 16 : 14,
    textAlign: 'center',
    lineHeight: SCREEN_WIDTH > 400 ? 22 : 18,
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
      <HelpButton onPress={onHelp} />
    </View>
  </View>
);

// Bottom Navigation Bar Component - with Center Map Button
const BottomNavBar = ({ onLeaderboard, onShop, onAd, onWithdraw, onMap }: any) => (
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

    <TouchableOpacity style={localStyles.navItem} onPress={onWithdraw}>
      <MaterialIcon name="account-balance-wallet" family="material" size={26} color="#FFFFFF" />
      <Text style={localStyles.navText}>Redeem</Text>
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
  const [showHelpSlider, setShowHelpSlider] = useState(false);
  const [showEarnCoinsPopup, setShowEarnCoinsPopup] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showRewardHistory, setShowRewardHistory] = useState(false);
  const [showWithdrawHistory, setShowWithdrawHistory] = useState(false);
  const [userGameData, setUserGameData] = useState<any>({
    completedLevels: [],
    levelStars: {},
    currentLevel: 1,
    highScore: 0,
    totalScore: 0,
    totalCoins: 0,
    abilities: {}
  });
  const [dataLoaded, setDataLoaded] = useState(false);
  const [adRewardAmount, setAdRewardAmount] = useState(0);
  const [baseRewardAmount, setBaseRewardAmount] = useState(10);
  const [starBonusAmount, setStarBonusAmount] = useState(5);
  const [scoreRange, setScoreRange] = useState(100);
  const [scoreReward, setScoreReward] = useState(0);
  const [abilityStartingCounts, setAbilityStartingCounts] = useState<Record<string, number>>({});
  const [loadingDirection, setLoadingDirection] = useState<'toFight' | 'toBase'>('toFight');
  const [gameSettings, setGameSettings] = useState<any>(null);
  const toastRef = useRef<ToastRef>(null);
  const isInitialLoad = useRef(true);

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

  // Load user data when component mounts or user changes - OPTIMIZED
  const loadUserData = useCallback(async (showLoading = true) => {
    if (!user?.uid) return;

    console.log('🔄 loadUserData called with showLoading:', showLoading, 'user:', user?.email || 'no user');

    try {
      // ONLY show loading indicator if data has been loaded before (subsequent refreshes)
      // On initial mount, we let the app-wide LoadingScreen handle the UI
      if (showLoading && !isInitialLoad.current) setIsLoading(true);

      // IMMEDIATE FIX: Set default data first to prevent 0 coins/abilities
      setScore(0);
      setCoins(100);
      setCurrentLevel(1);
      setAbilityInventory({ lightning: 2, bomb: 2, freeze: 2, fire: 2 });
      setDataLoaded(true);
      console.log('✅ Set default data immediately - Coins: 100, Abilities: 2 each');

      // OPTIMIZATION: Run authentication and config fetching in parallel
      const [isAuth, configResults] = await Promise.allSettled([
        BackendService.ensureAuthenticated(user),
        Promise.all([
          ConfigService.getAbilitiesConfig(),
          ConfigService.getAdConfig(),
          ConfigService.getAdUnits(),
          ConfigService.getGameConfig()
        ])
      ]);

      // Check authentication result
      if (isAuth.status === 'rejected' || !isAuth.value) {
        console.log('❌ Authentication failed, but continuing with default data for new user...');
        // Don't return here - continue with default data initialization
      }

      // Process config results (even if some failed)
      let abilitiesConfig: any[] = [];
      let adReward = 50;
      
      if (configResults.status === 'fulfilled') {
        const [aConfig, adConfig, adUnitsData, gameConfigData] = configResults.value;
        
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
          setGameSettings(gameConfigData.gameSettings);
          setBaseRewardAmount((gameConfigData.gameSettings as any).coinsPerLevel ?? 10);
          setStarBonusAmount(gameConfigData.gameSettings.starBonusBase ?? 5);
          setScoreRange(gameConfigData.gameSettings.scoreRange ?? 100);
          setScoreReward(gameConfigData.gameSettings.rewardPerRange ?? 0);
          console.log('💰 Using Game Rewards from DB:', gameConfigData.gameSettings);
        }
      } else {
        console.warn('Failed to load dynamic configs:', configResults.reason);
      }

      // Now fetch user game data
      console.log('� BFetching user game data from backend...');
      const result = await BackendService.getUserGameData(true);
      console.log('📊 Backend response:', result.success ? 'SUCCESS' : 'FAILED', result.data ? `Score: ${result.data.totalScore}, Coins: ${result.data.totalCoins}` : result.error);

      if (result.success && result.data) {
        setUserGameData(result.data);
        setScore(result.data.totalScore || 0);
        setCoins(result.data.totalCoins || 0);
        setCurrentLevel(result.data.currentLevel || 1);

        console.log('✅ Updated local state - Score:', result.data.totalScore, 'Coins:', result.data.totalCoins, 'Level:', result.data.currentLevel);

        // Backend stores TOTAL abilities (base + purchased)
        // We need to extract ONLY purchased abilities for the inventory
        const backendAbilities = result.data.abilities || {};

        // Initialize new users with 0 purchased abilities
        if (result.data.currentLevel <= 1 && result.data.totalScore === 0 && (!backendAbilities || Object.keys(backendAbilities).length === 0)) {
          const initialAbilities: Record<string, number> = {};
          abilitiesConfig.forEach(a => { initialAbilities[a.name] = 2; });

          if (Object.keys(initialAbilities).length > 0) {
            // Don't await this - let it happen in background
            BackendService.updateAbilities(initialAbilities).catch(console.warn);
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

          // Calculate total available abilities from DB
          // The user wants to see EXACTLY what is in the DB.
          const allAbilityTypes = ['lightning', 'bomb', 'freeze', 'fire'];
          const totalInventory: Record<string, number> = {};

          allAbilityTypes.forEach(key => {
            const dbVal = backendAbilities[key] || 0;
            // Ensure minimum base count of 2 is reflected
            totalInventory[key] = Math.max(2, dbVal);
            console.log(`Inventory Calc: ${key} DB=${dbVal} -> Final=${totalInventory[key]}`);
          });

          setAbilityInventory(totalInventory);
        }

        setDataLoaded(true);
      } else {
        // New user or failed to fetch data - initialize with defaults
        console.log('🆕 New user or failed to fetch data, initializing with defaults...');
        
        const defaultUserData = {
          email: user?.email || '',
          totalScore: 0,
          highScore: 0,
          totalCoins: 100, // Give new users 100 coins to start
          currentLevel: 1,
          gamesPlayed: 0,
          gamesWon: 0,
          abilities: { lightning: 2, bomb: 2, freeze: 2, fire: 2 },
          achievements: [],
          completedLevels: [],
          levelStars: {},
          lastPlayedAt: new Date().toISOString()
        };

        // Set local state immediately so UI shows data
        setUserGameData(defaultUserData);
        setScore(0);
        setCoins(100);
        setCurrentLevel(1);
        setAbilityInventory({ lightning: 2, bomb: 2, freeze: 2, fire: 2 });

        console.log('✅ Initialized new user with defaults - Coins: 100, Abilities: 2 each');

        // Try to save this data to backend in background
        BackendService.updateUserGameData(defaultUserData).catch(error => {
          console.warn('Failed to save default user data to backend:', error);
        });

        setDataLoaded(true);
      }
    } catch (err) {
      console.error('Data load error:', err);
    } finally {
      if (showLoading) setIsLoading(false);
      isInitialLoad.current = false;
    }
  }, [user?.uid]);

  useEffect(() => {
    loadUserData();
  }, [user?.uid, loadUserData]);

  // Update local state when userGameData changes (e.g., after game completion)
  useEffect(() => {
    if (userGameData) {
      setScore(userGameData.totalScore || 0);
      setCoins(userGameData.totalCoins || 0);
      setCurrentLevel(userGameData.currentLevel || 1);
      console.log('🔄 Updated local state from userGameData:', {
        score: userGameData.totalScore,
        coins: userGameData.totalCoins,
        level: userGameData.currentLevel
      });
    }
  }, [userGameData?.totalScore, userGameData?.totalCoins, userGameData?.currentLevel]);

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
    // Strictly return the DB-configured coins per level
    // "Only coins perlevel should be fetch from mdb and that much only be give"
    return baseRewardAmount || 10;
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

  const handleBackPress = (shouldReload = true) => {
    // Set direction to base and show loading
    setLoadingDirection('toBase');
    setIsLoading(true);

    console.log('🔙 handleBackPress called with shouldReload:', shouldReload);

    // Wait for loading screen to appear before switching
    setTimeout(() => {
      setShowGameScreen(false);

      // Always refresh data when returning from game to ensure roadmap shows latest progress
      if (typeof loadUserData === 'function') {
        console.log('🔄 Refreshing user data after returning from game...');
        loadUserData(true); // Force refresh to get latest data from backend
      } else {
        console.log('⏭️ No loadUserData function available');
        setIsLoading(false); // Make sure to hide loading if we can't reload
      }

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
      }, 800); // Increased delay to ensure data loading completes
    }, 100);
  };

  const handleLevelComplete = async (completedLevel: number, finalScore: number, stars: number, coinsEarned?: number, action: 'next' | 'home' = 'next', sessionData?: any) => {
    try {
      console.log('🏆 handleLevelComplete called with:', {
        completedLevel,
        finalScore,
        stars,
        coinsEarned,
        action,
        sessionData: sessionData ? 'present' : 'missing'
      });

      console.log('🔍 Session data details:', sessionData);

      // 1. OPTIMISTIC UPDATE: Update local state immediately for instant UI feedback
      const isWin = sessionData?.isWin ?? (stars > 0); // Consider any stars as progress
      const shouldAdvanceLevel = isWin && stars >= 2;
      const newCurrentLevel = shouldAdvanceLevel ? Math.max(completedLevel + 1, currentLevel) : currentLevel;

      const currentTotalScore = userGameData?.totalScore || score || 0;
      const newTotalScore = stars > 0 ? (currentTotalScore + finalScore) : currentTotalScore; // Add score if any stars earned

      const currentTotalCoins = userGameData?.totalCoins || coins || 0;
      const newTotalCoins = stars > 0 ? (currentTotalCoins + (coinsEarned || 0)) : currentTotalCoins; // Add coins if any stars earned

      const updatedGameData = {
        ...userGameData,
        currentLevel: newCurrentLevel,
        totalScore: newTotalScore,
        highScore: Math.max(userGameData?.highScore || 0, finalScore),
        totalCoins: newTotalCoins,
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
      setScore(newTotalScore);
      setCoins(newTotalCoins);
      setCurrentLevel(newCurrentLevel);
      console.log(`✨ Optimistic update applied: currentLevel=${newCurrentLevel}, coins=${newTotalCoins}`);

      // 2. BACKEND SYNC: Submit game session to backend
      console.log('🔍 User object:', user ? 'exists' : 'missing');
      console.log('🔍 User UID:', user?.uid);

      if (user) {
        try {
          console.log('🔐 Ensuring authentication...');
          await BackendService.ensureAuthenticated(user);
          console.log('✅ Authentication confirmed');

          const sessionDataToSubmit = {
            level: completedLevel,
            score: finalScore,
            moves: sessionData?.moves !== undefined ? sessionData.moves : 0,
            stars: stars,
            duration: sessionData?.duration || 1,
            abilitiesUsed: sessionData?.abilitiesUsed || {},
            bubblesDestroyed: sessionData?.bubblesDestroyed || 0,
            chainReactions: sessionData?.chainReactions || 0,
            perfectShots: sessionData?.perfectShots || 0,
            coinsEarned: coinsEarned || 0,
            isWin: isWin
          };

          console.log('📤 Submitting game session to backend:', sessionDataToSubmit);
          const sessionResult = await BackendService.submitGameSession(sessionDataToSubmit);
          console.log('📥 Backend response:', sessionResult);

          if (sessionResult.success && sessionResult.data && sessionResult.data.updatedGameData) {
            const serverData = sessionResult.data;
            console.log('✅ Session submitted successfully!');
            console.log('📊 Server returned updated game data:', serverData.updatedGameData);
            console.log('💰 Server coins:', serverData.updatedGameData.totalCoins);
            console.log('🎯 Server score:', serverData.updatedGameData.totalScore);
            console.log('🏆 Server level:', serverData.updatedGameData.currentLevel);

            setUserGameData((prev: any) => ({
              ...prev,
              ...serverData.updatedGameData,
              currentLevel: Math.max(prev.currentLevel, serverData.updatedGameData.currentLevel || 1),
              levelStars: {
                ...(serverData.updatedGameData.levelStars || {}),
                [completedLevel]: Math.max(
                  prev.levelStars?.[completedLevel] || 0,
                  serverData.updatedGameData.levelStars?.[completedLevel] || 0
                )
              }
            }));

            if (serverData.updatedGameData.totalCoins !== undefined) {
              console.log('💰 Updating coins from', coins, 'to', serverData.updatedGameData.totalCoins);
              setCoins(serverData.updatedGameData.totalCoins);
            }
            if (serverData.updatedGameData.currentLevel !== undefined) {
              console.log('🏆 Updating level from', currentLevel, 'to', serverData.updatedGameData.currentLevel);
              setCurrentLevel(serverData.updatedGameData.currentLevel);
            }
            if (serverData.updatedGameData.abilities) {
              const serverAbilities = serverData.updatedGameData.abilities;
              const allAbilityTypes = ['lightning', 'bomb', 'freeze', 'fire'];
              const newDisplayInventory: Record<string, number> = {};

              allAbilityTypes.forEach(key => {
                const dbVal = serverAbilities[key] || 0;
                newDisplayInventory[key] = Math.max(2, dbVal);
              });

              console.log('🎒 Updating ability inventory from server:', newDisplayInventory);
              setAbilityInventory(newDisplayInventory);
            }
          } else {
            console.warn('⚠️ Session sync failed or incomplete response:', sessionResult);
            console.warn('⚠️ Attempting manual update fallback...');
            await BackendService.updateUserGameData(updatedGameData);
          }
        } catch (innerError: any) {
          console.error('❌ Backend sync error:', innerError);
          console.error('❌ Error details:', {
            message: innerError?.message,
            stack: innerError?.stack,
            name: innerError?.name
          });
          toastRef.current?.show('Progress saved locally.', 'info');
        }
      } else {
        console.error('❌ No user object available for backend sync');
        toastRef.current?.show('Please log in to save progress.', 'error');
      }



      // 4. NAVIGATION
      if (action === 'home') {
        console.log(`🏠 Returning home - ensuring data is refreshed`);
        // Always reload data when returning home to show updated progress
        handleBackPress(true); // Changed to true to force reload
      } else if (action === 'next' && stars >= 2) {
        if (completedLevel < levels.length) {
          console.log(`🚀 Progressing to level ${completedLevel + 1}`);
          setSelectedLevel(completedLevel + 1);
          setLoadingDirection('toFight');
          setIsLoading(true);
          setShowGameScreen(false);
          setTimeout(() => {
            setShowGameScreen(true);
            setIsLoading(false);
          }, 1000);
        } else {
          handleBackPress(false);
        }
      } else {
        handleBackPress(false);
      }
    } catch (error) {
      console.error('Error handling level completion:', error);
      handleBackPress(true);
    }
  };

  // Loading indicator for level transitions
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
          : 'Returning to Base...'
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
          adRewardAmount={adRewardAmount}
          levelReward={baseRewardAmount}
          starBonus={starBonusAmount}
          gameSettings={gameSettings}
        />
      ) : (
        <View style={{ flex: 1 }}>
          <SpaceBackground />

          {/* Leaderboard Modal */}
          <Leaderboard
            isVisible={showLeaderboard}
            onClose={() => setShowLeaderboard(false)}
            currentUserScore={score}
            userEmail={user?.email ?? undefined}
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
            onInventoryUpdate={(newInventory) => {
              console.log('🎯 Roadmap updating inventory:', newInventory);
              setAbilityInventory(newInventory);
            }}
            abilityStartingCounts={abilityStartingCounts}
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
              setShowHelpSlider(true);
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
            onWithdraw={() => setShowWithdrawModal(true)}
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
            onWithdrawPress={() => {
              setShowProfilePopup(false);
              setShowWithdrawModal(true);
            }}
            onRewardHistoryPress={() => {
              setShowProfilePopup(false);
              setShowRewardHistory(true);
            }}
            onWithdrawHistoryPress={() => {
              setShowProfilePopup(false);
              setShowWithdrawHistory(true);
            }}
          />

          <WithdrawModal
            visible={showWithdrawModal}
            onClose={() => setShowWithdrawModal(false)}
          />

          <RewardHistory
            visible={showRewardHistory}
            onClose={() => {
              setShowRewardHistory(false);
              setShowProfilePopup(true);
            }}
          />

          <WithdrawHistory
            visible={showWithdrawHistory}
            onClose={() => {
              setShowWithdrawHistory(false);
              setShowProfilePopup(true);
            }}
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

          {/* Help Slider */}
          <HelpSlider
            visible={showHelpSlider}
            onClose={() => setShowHelpSlider(false)}
            adRewardAmount={adRewardAmount}
            levelReward={baseRewardAmount}
            starBonus={starBonusAmount}
            scoreRange={scoreRange}
            scoreReward={scoreReward}
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


