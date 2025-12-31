import React, { useState, useRef, useEffect, useMemo } from "react";
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
import { GAME_ICONS, ICON_COLORS, ICON_SIZES } from '../config/icons';
import { getLevelPattern, getLevelMoves } from '../data/levelPatterns';
import { useAuth } from '../context/AuthContext';
import StorageService, { UserGameData } from '../services/StorageService';

import { styles, SCREEN_WIDTH, SCREEN_HEIGHT } from "../styles/RoadmapStyles";

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
  { id: 'lightning', name: 'Lightning', icon: GAME_ICONS.LIGHTNING, price: 15, description: 'Destroys entire row', color: ICON_COLORS.PRIMARY },
  { id: 'bomb', name: 'Bomb', icon: GAME_ICONS.BOMB, price: 20, description: 'Destroys 6 hex neighbors', color: ICON_COLORS.WARNING },
  { id: 'freeze', name: 'Freeze', icon: GAME_ICONS.FREEZE, price: 5, description: 'Freezes column up to 2 rows', color: ICON_COLORS.INFO },
  { id: 'fire', name: 'Fire', icon: GAME_ICONS.FIRE, price: 10, description: 'Burns through obstacles', color: ICON_COLORS.ERROR },
];

// UNIFIED DASHBOARD HEADER COMPONENT
const RoadmapHeader = ({ coins, score, onShopPress, onLeaderboardPress }: {
  coins: number;
  score: number;
  onShopPress: () => void;
  onLeaderboardPress: () => void;
}) => {
  const { signOut, user } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => signOut()
        }
      ]
    );
  };

  return (
    <View style={styles.dashboardContainer}>
      {/* Top Section: Title & Stats */}
      <View style={styles.dashboardTop}>
        <View style={styles.titleBlock}>
          <Text style={styles.cardTitle}>SPACE</Text>
          <Text style={styles.cardSubtitle}>ADVENTURE</Text>
          {user?.email && (
            <Text style={styles.userEmail}>{user.email}</Text>
          )}
        </View>

        <View style={styles.dividerVertical} />

        <View style={styles.statsBlock}>
          <View style={styles.statChip}>
            <MaterialIcon
              name={GAME_ICONS.COIN.name}
              family={GAME_ICONS.COIN.family}
              size={ICON_SIZES.MEDIUM}
              color={ICON_COLORS.GOLD}
            />
            <Text style={styles.statNumber}>{coins}</Text>
          </View>
          <View style={styles.statChip}>
            <MaterialIcon
              name={GAME_ICONS.SCORE.name}
              family={GAME_ICONS.SCORE.family}
              size={ICON_SIZES.MEDIUM}
              color={ICON_COLORS.SUCCESS}
            />
            <Text style={styles.statNumber}>{score.toLocaleString()}</Text>
          </View>
        </View>
      </View>

      {/* Horizontal Divider Line */}
      <View style={styles.dashboardDivider} />

      {/* Bottom Section: Action Menu */}
      <View style={styles.dashboardBottom}>
        <TouchableOpacity style={styles.actionBtn} onPress={onLeaderboardPress}>
          <MaterialIcon
            name={GAME_ICONS.LEADERBOARD.name}
            family={GAME_ICONS.LEADERBOARD.family}
            size={ICON_SIZES.MEDIUM}
            color={ICON_COLORS.SECONDARY}
          />
          <Text style={[styles.menuText, { color: '#00E0FF' }]}>LEADERBOARD</Text>
        </TouchableOpacity>

        <View style={styles.dividerVerticalSmall} />

        <TouchableOpacity style={styles.actionBtn} onPress={onShopPress}>
          <MaterialIcon
            name={GAME_ICONS.SHOP.name}
            family={GAME_ICONS.SHOP.family}
            size={ICON_SIZES.MEDIUM}
            color={ICON_COLORS.SUCCESS}
          />
          <Text style={[styles.menuText, { color: '#00FF88' }]}>SHOP</Text>
        </TouchableOpacity>

        <View style={styles.dividerVerticalSmall} />

        <TouchableOpacity style={styles.actionBtn} onPress={handleLogout}>
          <MaterialIcon
            name="exit-to-app"
            family="material"
            size={ICON_SIZES.MEDIUM}
            color={ICON_COLORS.ERROR}
          />
          <Text style={[styles.menuText, { color: '#FF6B6B' }]}>LOGOUT</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const Roadmap: React.FC = () => {
  const { user } = useAuth();
  const [showGameScreen, setShowGameScreen] = useState(false);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [score, setScore] = useState(0); // Start with zero score
  const [coins, setCoins] = useState(0); // Start with zero coins
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [userGameData, setUserGameData] = useState<UserGameData | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [loadingDirection, setLoadingDirection] = useState<'toFight' | 'toBase'>('toFight');

  // Ability inventory
  const [abilityInventory, setAbilityInventory] = useState({
    lightning: 0,
    bomb: 0,
    fire: 0,
    freeze: 0,
  });

  const flatListRef = useRef<FlatList>(null);
  const glowAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Load user data when component mounts or user changes
  useEffect(() => {
    const loadUserData = async () => {
      if (user?.uid) {
        try {
          if (!dataLoaded) {
            setIsLoading(true);
          }

          // Parallelize data fetching
          const [userData] = await Promise.all([
            StorageService.loadUserData(user.uid),
            StorageService.setCurrentUser(user.uid)
          ]);

          setUserGameData(userData);
          setScore(userData.score);
          setCoins(userData.coins);
          setCurrentLevel(userData.currentLevel);
          setAbilityInventory(userData.abilityInventory);
          setDataLoaded(true);
        } catch (error) {
          console.error('Error loading user data:', error);
        } finally {
          // Only hide loading if we showed it
          if (!dataLoaded) {
            setIsLoading(false);
          }
        }
      }
    };

    loadUserData();
  }, [user?.uid]);

  // Save user data whenever important state changes
  useEffect(() => {
    const saveUserData = async () => {
      if (user?.uid && dataLoaded && userGameData) {
        try {
          const updatedData: UserGameData = {
            ...userGameData,
            score,
            coins,
            currentLevel,
            abilityInventory,
          };
          await StorageService.saveUserData(user.uid, updatedData);
          setUserGameData(updatedData);

          // Update leaderboard with user info
          await updateLeaderboardEntry();
        } catch (error) {
          console.error('Error saving user data:', error);
        }
      }
    };

    // Only save if data has been loaded to avoid overwriting with initial values
    if (dataLoaded) {
      saveUserData();
    }
  }, [score, coins, currentLevel, abilityInventory, user?.uid, dataLoaded]);

  // Update leaderboard entry with current user info
  const updateLeaderboardEntry = async () => {
    if (!user?.uid || !userGameData) return;

    try {
      const leaderboard = await StorageService.getLeaderboard();
      const existingIndex = leaderboard.findIndex(entry => entry.userId === user.uid);

      const leaderboardEntry = {
        userId: user.uid,
        username: user.displayName || user.email?.split('@')[0] || `Player_${user.uid.substring(0, 8)}`,
        email: user.email || '',
        score,
        level: currentLevel,
        coins,
        stars: userGameData.totalStars,
        lastUpdated: new Date().toISOString(),
      };

      if (existingIndex >= 0) {
        leaderboard[existingIndex] = leaderboardEntry;
      } else {
        leaderboard.push(leaderboardEntry);
      }

      // Sort and save
      leaderboard.sort((a, b) => b.score - a.score);
      await StorageService.getLeaderboard(); // This will trigger the save
    } catch (error) {
      console.error('Error updating leaderboard:', error);
    }
  };

  // Purchase ability function - no loading screen for shop operations
  const purchaseAbility = async (abilityId: string, price: number) => {
    if (!user?.uid) return;

    try {
      const result = await StorageService.purchaseAbility(
        user.uid,
        abilityId as keyof UserGameData['abilityInventory'],
        price
      );

      if (result.success) {
        setCoins(result.newCoins);
        setAbilityInventory(result.newInventory);
        Alert.alert('Purchase Successful!', `You bought ${abilityId}!`);
      } else {
        Alert.alert('Insufficient Coins', 'You need more coins to purchase this ability.');
      }
    } catch (error) {
      console.error('Error purchasing ability:', error);
      Alert.alert('Error', 'Failed to purchase ability. Please try again.');
    }
  };

  // Generate levels data (100 levels) - memoized for performance
  const levels = useMemo(() =>
    Array.from({ length: 100 }, (_, i) => {
      const levelId = i + 1;
      const isCompleted = userGameData?.completedLevels.includes(levelId) || false;
      const stars = userGameData?.levelStars[levelId] || 0;
      const currentUserLevel = userGameData?.currentLevel || 1;

      return {
        id: levelId,
        isLocked: levelId > currentUserLevel,
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

  // Handle level completion with progressive rewards
  const handleLevelComplete = async (level: number, starsEarned: number, scoreEarned: number) => {
    if (!user?.uid) return;

    try {
      const updatedData = await StorageService.completeLevel(
        user.uid,
        level,
        starsEarned,
        scoreEarned
      );

      // Calculate progressive coin reward
      const coinsEarned = calculateLevelCoins(level, starsEarned);
      const newCoins = await StorageService.addCoins(user.uid, coinsEarned);

      // Update local state
      setUserGameData(updatedData);
      setScore(updatedData.score);
      setCurrentLevel(updatedData.currentLevel);
      setCoins(newCoins);

      Alert.alert(
        'Level Complete!',
        `Level ${level} Complete!\n⭐ Stars: ${starsEarned}\n🎯 Score: +${scoreEarned.toLocaleString()}\n🪙 Coins: +${coinsEarned}`
      );
    } catch (error) {
      console.error('Error completing level:', error);
    }
  };

  // Auto-scroll to current level on mount and when current level changes
  useEffect(() => {
    if (dataLoaded && userGameData) {
      setTimeout(() => {
        const currentUserLevel = userGameData.currentLevel;
        const currentIndex = levels.findIndex(level => level.id === currentUserLevel);
        if (currentIndex !== -1) {
          // Calculate the reversed index since we're showing levels in reverse order
          const reversedIndex = levels.length - 1 - currentIndex;
          flatListRef.current?.scrollToIndex({
            index: reversedIndex,
            animated: true,
            viewPosition: 0.5 // Center the current level perfectly
          });
        }
      }, 500); // Increased delay to ensure data is loaded
    }
  }, [dataLoaded, userGameData?.currentLevel, levels.length]); // Re-run when data loads or current level changes

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
      Alert.alert(
        'Level Locked',
        `Complete level ${level - 1} first to unlock this level!`,
        [{ text: 'OK', style: 'default' }]
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

  // Loading Indicator Component - Full Screen Overlay
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
          ? `Going for Fight - Level ${selectedLevel}...`
          : 'Returning to Base...'
        }
      </Text>
    </View>
  );

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
        <GameScreen onBackPress={handleBackPress} level={selectedLevel} />
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
              </View>
            </View>
          )}

          {/* Unified Dashboard Header */}
          <RoadmapHeader
            coins={coins}
            score={score}
            onShopPress={() => setShowShop(true)}
            onLeaderboardPress={() => setShowLeaderboard(true)}
          />

          <FlatList
            ref={flatListRef}
            data={reversedLevels}
            renderItem={({ item, index }) => <LevelItem item={item} index={levels.length - 1 - index} />}
            keyExtractor={(item) => item.id.toString()}
            style={styles.scrollView}
            contentContainerStyle={styles.roadmapContainer}
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
            initialScrollIndex={dataLoaded && userGameData ? Math.max(0, levels.length - userGameData.currentLevel) : 0}
            onScrollToIndexFailed={(info) => {
              setTimeout(() => {
                flatListRef.current?.scrollToIndex({
                  index: Math.min(info.index, levels.length - 1),
                  animated: false,
                });
              }, 100);
            }}
          />
        </View>
      )}

      {/* Loading Overlay - Visible on top during transitions */}
      {isLoading && <LoadingIndicator />}
    </View>
  );
};

export default Roadmap;