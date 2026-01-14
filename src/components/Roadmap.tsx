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
// Removed ethers due to Metro bundling issues in React Native. Using regex for validation instead.
import Shop from './Shop';
import RewardHistory from './RewardHistory';
import WithdrawHistory from './WithdrawHistory';
import RewardsCard from './RewardsCard';
import HelpSlider from './HelpSlider';
import HelpButton from './HelpButton';
import MessageModal from './MessageModal';

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
      <HelpButton onPress={onHelp} />
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

// Withdraw Modal Component
const WithdrawModal = ({ visible, onClose }: any) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [claimedEarnings, setClaimedEarnings] = useState(0);
  const [loading, setLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [msgModal, setMsgModal] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'info'
  });

  useEffect(() => {
    if (visible) {
      loadData();
    }
  }, [visible]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rewardRes, withdrawRes] = await Promise.all([
        BackendService.getRewardHistoryOnly(),
        BackendService.getWithdrawHistoryOnly()
      ]);

      if (rewardRes.success && rewardRes.history) {
        const total = rewardRes.history
          .filter(r => r.status === 'claimed')
          .reduce((sum, r) => sum + (r.reward || r.scoreEarning || 0), 0);
        setClaimedEarnings(total);
      }

      if (withdrawRes.success && withdrawRes.history) {
        setHistory(withdrawRes.history);
      }
    } catch (error) {
      console.error('Failed to load withdrawal data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (claimedEarnings <= 0) {
      setMsgModal({
        visible: true,
        title: 'INSUFFICIENT FUNDS',
        message: 'You do not have any available earnings for withdrawal at this time.',
        type: 'error'
      });
      return;
    }

    if (!walletAddress.trim()) {
      setMsgModal({
        visible: true,
        title: 'WALLET REQUIRED',
        message: 'Please enter a valid SHIB wallet address to receive your rewards.',
        type: 'error'
      });
      return;
    }

    // Wallet Address Validation using local regex
    // This is more performant than importing the entire ethers library in React Native
    const isValidWallet = /^0x[a-fA-F0-9]{40}$/.test(walletAddress);
    if (!isValidWallet) {
      setMsgModal({
        visible: true,
        title: 'INVALID WALLET',
        message: 'The wallet address provided is not a valid Ethereum-compatible address. Please check and try again.',
        type: 'error'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await BackendService.requestWithdrawal(walletAddress);
      if (result.success) {
        setMsgModal({
          visible: true,
          title: 'REQUEST SENT',
          message: `Your withdrawal request for ${result.amount?.toFixed(8)} SHIB has been submitted successfully! It will be processed shortly.`,
          type: 'success'
        });
        // We will close the main modal after the user clicks "Continue" on the success modal
      } else {
        setMsgModal({
          visible: true,
          title: 'WITHDRAWAL FAILED',
          message: result.error || 'The system could not process your withdrawal request. Please try again later.',
          type: 'error'
        });
      }
    } catch (error) {
      setMsgModal({
        visible: true,
        title: 'SYSTEM ERROR',
        message: 'A connection error occurred. Please verify your internet and try again.',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={localStyles.modalOverlay}>
        <View style={[localStyles.withdrawCard, { maxHeight: '80%', width: '90%' }]}>
          <Text style={localStyles.withdrawTitle}>WITHDRAWAL</Text>
          <View style={{ alignItems: 'center', marginVertical: 15, padding: 15, backgroundColor: 'rgba(0, 224, 255, 0.05)', borderRadius: 15, width: '100%' }}>
            <Text style={[localStyles.withdrawLabel, { fontSize: 13, marginBottom: 5 }]}>AVAILABLE REWARDS</Text>
            <Text style={{ color: '#00E0FF', fontSize: 28, fontWeight: '900', letterSpacing: 1 }}>{claimedEarnings.toFixed(8)}</Text>
            <Text style={{ color: '#00E0FF', fontSize: 14, fontWeight: '700', marginTop: 2 }}>SHIB</Text>
          </View>

          <View style={{ width: '100%', marginBottom: 15 }}>
            <Text style={[localStyles.withdrawLabel, { marginBottom: 8 }]}>WALLET ADDRESS</Text>
            <TextInput
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: 12,
                padding: 12,
                color: '#FFF',
                borderWidth: 1,
                borderColor: 'rgba(0, 224, 255, 0.2)',
                fontFamily: 'monospace',
                fontSize: 12
              }}
              placeholder="Enter your SHIB wallet address"
              placeholderTextColor="#64748B"
              value={walletAddress}
              onChangeText={setWalletAddress}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <TouchableOpacity
            style={[localStyles.withdrawBtn, (isSubmitting || claimedEarnings <= 0) && { opacity: 0.5 }]}
            onPress={handleWithdraw}
            disabled={isSubmitting || claimedEarnings <= 0}
          >
            <Text style={localStyles.withdrawBtnText}>
              {isSubmitting ? "PROCESSING..." : "REQUEST WITHDRAWAL"}
            </Text>
          </TouchableOpacity>

          <View style={{ width: '100%', marginTop: 20, flex: 1 }}>
            <Text style={[localStyles.withdrawLabel, { marginBottom: 10 }]}>WITHDRAWAL HISTORY</Text>
            {loading ? (
              <ActivityIndicator color="#00E0FF" />
            ) : history.length === 0 ? (
              <Text style={{ color: '#64748B', textAlign: 'center', fontStyle: 'italic' }}>No history found</Text>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {history.map((item) => (
                  <View key={item._id} style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    padding: 12,
                    borderRadius: 12,
                    marginBottom: 8,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <View>
                      <Text style={{ color: '#FFF', fontWeight: 'bold' }}>{(item.reward || item.scoreEarning || 0).toFixed(8)} SHIB</Text>
                      <Text style={{ color: '#64748B', fontSize: 10 }}>{new Date(item.date).toLocaleDateString()}</Text>
                    </View>
                    <View style={{
                      backgroundColor: item.status === 'pending' ? 'rgba(255, 165, 0, 0.2)' : 'rgba(0, 255, 136, 0.2)',
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 6
                    }}>
                      <Text style={{
                        color: item.status === 'pending' ? '#FFA500' : '#00FF88',
                        fontSize: 10,
                        fontWeight: 'bold'
                      }}>{item.status.toUpperCase()}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>

          <TouchableOpacity style={localStyles.withdrawCancelBtn} onPress={onClose} disabled={isSubmitting}>
            <Text style={localStyles.withdrawCancelText}>CLOSE</Text>
          </TouchableOpacity>
        </View>

        <MessageModal
          visible={msgModal.visible}
          title={msgModal.title}
          message={msgModal.message}
          type={msgModal.type}
          onClose={() => {
            setMsgModal(prev => ({ ...prev, visible: false }));
            if (msgModal.type === 'success') {
              onClose(); // Close withdrawal modal on success
              loadData();
            }
          }}
        />
      </View>
    </Modal>
  );
};

// Profile Popup Component
const ProfilePopup = ({ visible, onClose, user, userGameData, coins, currentLevel, onLogout, scoreRange, reward, onWithdrawPress, onRewardHistoryPress, onWithdrawHistoryPress }: any) => {
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [vibrationSupported, setVibrationSupported] = useState(true);
  const [claimedEarnings, setClaimedEarnings] = useState(0);

  useEffect(() => {
    if (visible) {
      loadEarnings();
    }
  }, [visible]);

  const loadEarnings = async () => {
    try {
      const result = await BackendService.getRewardHistoryOnly();
      if (result.success && result.history) {
        const total = result.history
          .filter(r => r.status === 'claimed')
          .reduce((sum, r) => sum + (r.reward || r.scoreEarning || 0), 0);
        setClaimedEarnings(total);
      }
    } catch (error) {
      console.error('Failed to load earnings for profile:', error);
    }
  };

  const currentScoreEarnings = claimedEarnings;

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

        <FlatList
          data={[1]} // Using FlatList as a container for better performance and scroll handling
          keyExtractor={() => 'profile-content'}
          renderItem={() => (
            <View style={{ paddingBottom: 20 }}>
              <View style={localStyles.profileMainCard}>
                <View style={localStyles.popupAvatar}>
                  <View style={localStyles.avatarRing}>
                    <MaterialIcon name="account-circle" family="material" size={SCREEN_WIDTH > 380 ? 90 : 70} color={ICON_COLORS.PRIMARY} />
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
                      <MaterialIcon name="visibility" family="material" size={SCREEN_WIDTH > 380 ? 22 : 18} color="#5856D6" />
                    </View>
                    <View style={localStyles.cardContent}>
                      <Text style={localStyles.cardValue}>{(userGameData?.totalAdEarnings || 0).toLocaleString()}</Text>
                      <Text style={localStyles.cardLabel}>AD REWARD</Text>
                    </View>
                  </View>

                  <RewardsCard
                    onWithdrawPress={onWithdrawPress}
                    onRewardHistoryPress={onRewardHistoryPress}
                    onWithdrawHistoryPress={onWithdrawHistoryPress}
                    style={{ marginBottom: 12 }}
                  />
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
                          size={SCREEN_WIDTH > 380 ? 20 : 18}
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
            </View>
          )}
          showsVerticalScrollIndicator={false}
        />
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
            size={SCREEN_WIDTH > 400 ? 80 : 60}
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
            size={SCREEN_WIDTH > 400 ? 32 : 24}
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

  // Load user data when component mounts or user changes
  const loadUserData = useCallback(async (showLoading = true) => {
    if (!user?.uid) return;

    console.log('🔄 loadUserData called with showLoading:', showLoading, 'user:', user?.email || 'no user');

    try {
      // ONLY show loading indicator if data has been loaded before (subsequent refreshes)
      // On initial mount, we let the app-wide LoadingScreen handle the UI
      if (showLoading && !isInitialLoad.current) setIsLoading(true);
      const isAuth = await BackendService.ensureAuthenticated(user);
      if (!isAuth) {
        console.log('❌ Authentication failed in loadUserData');
        if (showLoading) setIsLoading(false);
        return;
      }

      console.log('🔍 Fetching user game data from backend...');
      const result = await BackendService.getUserGameData();
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
            setBaseRewardAmount((gameConfigData.gameSettings as any).coinsPerLevel ?? 10);
            setStarBonusAmount(gameConfigData.gameSettings.starBonusBase ?? 5);
            setScoreRange(gameConfigData.gameSettings.scoreRange ?? 100);
            setScoreReward(gameConfigData.gameSettings.rewardPerRange ?? 0);
            console.log('💰 Using Game Rewards from DB:', gameConfigData.gameSettings);
          }
        } catch (configErr) {
          console.warn('Failed to load dynamic configs:', configErr);
        }

        // Initialize new users with 0 purchased abilities
        if (result.data.currentLevel <= 1 && result.data.totalScore === 0 && (!backendAbilities || Object.keys(backendAbilities).length === 0)) {
          const initialAbilities: Record<string, number> = {};
          abilitiesConfig.forEach(a => { initialAbilities[a.name] = 2; });

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
          adRewardAmount={adRewardAmount}
          levelReward={baseRewardAmount}
          starBonus={starBonusAmount}
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
            scoreRange={scoreRange}
            reward={scoreReward}
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
            scoreEarnings={(Number(scoreRange) || 100) > 0 ? (Number(userGameData?.totalScore || 0) / Number(scoreRange) * Number(scoreReward)) : 0}
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

          {/* Help Slider (replaces Instruction Modal) */}
          <HelpSlider
            visible={showInstructionModal}
            onClose={() => setShowInstructionModal(false)}
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
    width: SCREEN_WIDTH > 500 ? 460 : '94%',
    maxWidth: 500,
    maxHeight: SCREEN_HEIGHT * 0.85,
    backgroundColor: '#0A0A14',
    borderRadius: SCREEN_WIDTH > 400 ? 32 : 24,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 224, 255, 0.3)',
    shadowColor: '#00E0FF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 20,
    overflow: 'hidden',
  },
  profileHeaderBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: SCREEN_WIDTH > 400 ? 140 : 100,
    backgroundColor: 'rgba(0, 224, 255, 0.05)',
    overflow: 'hidden',
  },
  profileHeaderCircle: {
    position: 'absolute',
    top: SCREEN_WIDTH > 400 ? -120 : -80,
    right: SCREEN_WIDTH > 400 ? -60 : -40,
    width: SCREEN_WIDTH > 400 ? 300 : 200,
    height: SCREEN_WIDTH > 400 ? 300 : 200,
    borderRadius: SCREEN_WIDTH > 400 ? 150 : 100,
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
    marginTop: SCREEN_WIDTH > 380 ? 45 : 30,
    marginBottom: SCREEN_WIDTH > 380 ? 20 : 10,
  },
  popupAvatar: {
    position: 'relative',
    marginBottom: 15,
  },
  avatarRing: {
    padding: 4,
    borderRadius: SCREEN_WIDTH > 380 ? 60 : 50,
    borderWidth: 2,
    borderColor: '#00E0FF',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  onlineStatus: {
    position: 'absolute',
    bottom: SCREEN_WIDTH > 380 ? 5 : 3,
    right: SCREEN_WIDTH > 380 ? 5 : 3,
    width: SCREEN_WIDTH > 380 ? 18 : 14,
    height: SCREEN_WIDTH > 380 ? 18 : 14,
    borderRadius: 9,
    backgroundColor: '#00FF88',
    borderWidth: 3,
    borderColor: '#0A0A14',
  },
  popupName: {
    color: '#FFF',
    fontSize: SCREEN_WIDTH > 380 ? 28 : 22,
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
    width: SCREEN_WIDTH > 380 ? '48%' : '100%',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    padding: SCREEN_WIDTH > 380 ? 16 : 14,
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
    width: SCREEN_WIDTH > 380 ? 36 : 32,
    height: SCREEN_WIDTH > 380 ? 36 : 32,
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
    width: SCREEN_WIDTH > 500 ? 400 : '85%',
    backgroundColor: 'rgba(5, 5, 10, 0.98)',
    borderTopLeftRadius: 30,
    borderBottomRightRadius: 30,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 10,
    borderWidth: 2,
    borderColor: ICON_COLORS.GOLD,
    padding: SCREEN_WIDTH > 400 ? 30 : 20,
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