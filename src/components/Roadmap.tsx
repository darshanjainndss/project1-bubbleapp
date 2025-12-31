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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

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
};

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
          // Only show loading on initial data load, not for modal operations
          if (!dataLoaded) {
            setIsLoading(true);
          }
          
          await StorageService.setCurrentUser(user.uid);
          
          // For testing - clear existing data to start fresh (remove this in production)
          if (__DEV__) {
            await StorageService.clearAllData();
          }
          
          const userData = await StorageService.loadUserData(user.uid);
          
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

  // Level-specific ring colors for variety
  const RING_COLORS = [
    '#00FF88', // Emerald
    '#00E0FF', // Cyan
    '#A259FF', // Purple
    '#FF6000', // Deep Orange
    '#FFD60A', // Yellow
    '#FF2D55', // Pink Red
    '#5856D6', // Indigo
    '#FF9500', // Orange
    '#AF52DE', // Purple
    '#007AFF', // Blue
  ];

  // Shop items configuration
  const SHOP_ITEMS = [
    {
      id: 'lightning',
      name: 'Lightning',
      icon: GAME_ICONS.LIGHTNING,
      price: 15, // Increased from 2 to 15
      description: 'Destroys entire row',
      color: ICON_COLORS.PRIMARY,
    },
    {
      id: 'bomb',
      name: 'Bomb',
      icon: GAME_ICONS.BOMB,
      price: 20, // Increased from 2 to 20
      description: 'Destroys 6 hex neighbors',
      color: ICON_COLORS.WARNING,
    },
    {
      id: 'freeze',
      name: 'Freeze',
      icon: GAME_ICONS.FREEZE,
      price: 5, // Decreased from 3 to 5
      description: 'Freezes column up to 2 rows',
      color: ICON_COLORS.INFO,
    },
    {
      id: 'fire',
      name: 'Fire',
      icon: GAME_ICONS.FIRE,
      price: 10, // Decreased from 3 to 10
      description: 'Burns through obstacles',
      color: ICON_COLORS.ERROR,
    },
  ];

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
        
        // Show success feedback without loading screen
        Alert.alert('Purchase Successful!', `You bought ${abilityId}!`);
      } else {
        Alert.alert('Insufficient Coins', 'You need more coins to purchase this ability.');
      }
    } catch (error) {
      console.error('Error purchasing ability:', error);
      Alert.alert('Error', 'Failed to purchase ability. Please try again.');
    }
  };

  const LEVEL_TITLES = [
    "CYPRUS SECTOR", "NEON VOID", "PLASMA CORE", "FROST MOON",
    "AMBER RIFT", "JADE NEBULA", "COBALT STAR", "ONYX DEEP",
    "QUARTZ ZONE", "RUBY STATION", "SILVER WAKE", "GOLDEN GATE"
  ];

  // Diverse collection of high-quality cosmic icons
  const ICONS = [
    'https://img.icons8.com/fluency/512/galaxy.png',
    'https://img.icons8.com/fluency/512/planet.png',
    'https://img.icons8.com/fluency/512/saturn-planet.png',
    'https://img.icons8.com/fluency/512/mars-planet.png',
    'https://img.icons8.com/fluency/512/jupiter-planet.png',
    // Removed Earth
    'https://img.icons8.com/fluency/512/mercury-planet.png',
    // Removed Sun
    'https://img.icons8.com/fluency/512/asteroid.png',
    'https://img.icons8.com/fluency/512/black-hole.png',
    'https://img.icons8.com/fluency/512/uranus-planet.png',
    'https://img.icons8.com/fluency/512/venus-planet.png',
    'https://img.icons8.com/fluency/512/neptune-planet.png',
    'https://img.icons8.com/fluency/512/supernova.png',
    'https://img.icons8.com/fluency/512/shooting-star.png',
  ];

  // Generate levels data (100 levels) - memoized for performance
  const levels = useMemo(() =>
    Array.from({ length: 100 }, (_, i) => {
      const levelId = i + 1;
      const isCompleted = userGameData?.completedLevels.includes(levelId) || false;
      const stars = userGameData?.levelStars[levelId] || 0;
      const currentUserLevel = userGameData?.currentLevel || 1;
      
      return {
        id: levelId,
        isLocked: levelId > currentUserLevel, // Lock levels beyond current
        isCompleted,
        stars: isCompleted ? stars : 0,
      };
    }), [userGameData]
  );

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

  // Static Spaceship Component using Lottie
  const StaticSpaceship = ({ size = 120 }: { size?: number }) => {
    return (
      <View style={[styles.staticSpaceship, { width: size, height: size }]}>
        <LottieView
          source={require('../images/Spaceship.json')}
          autoPlay
          loop
          style={styles.spaceshipLottie}
        />
      </View>
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
          {/* Centered Layers Container */}
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <View style={styles.centeredLayers}>
              {/* Multi-Ripple Wave Effect */}
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

              {/* Current level indicator */}
              {isCurrent && (
                <OrbitalRing
                  size={110}
                  color="rgba(255,255,255,0.5)"
                  duration={4000}
                />
              )}

              {/* Add static spaceship for current level */}
              {isCurrent && (
                <StaticSpaceship size={100} />
              )}
            </View>
          </View>

          {/* Planet Node */}
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <View style={[styles.centeredLayers, { zIndex: 1 }]}>
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

                {/* Planet Icon - always visible clearly */}
                {!(item.id === 6 || item.id === 8) && (
                  <Image
                    source={{ uri: ICONS[index % ICONS.length] }}
                    style={styles.ufoIcon}
                    resizeMode="contain"
                  />
                )}

                {/* Simple lock overlay for locked levels */}
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

          {/* Star Reward Display - only for completed levels */}
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

  // Create proper curved connecting dots with Trail Effect
  const renderConnectingDots = () => {
    const dots = [];
    for (let i = 0; i < levels.length - 1; i++) {
      const currentPos = getRoadmapPosition(i);
      const nextPos = getRoadmapPosition(i + 1);
      const numDots = 20;

      for (let j = 1; j < numDots; j++) {
        const t = j / numDots;
        const deltaX = nextPos.x - currentPos.x;
        const deltaY = nextPos.y - currentPos.y;
        const control1X = currentPos.x + deltaX * 0.2;
        const control1Y = currentPos.y + 120 + deltaY * 0.1;
        const control2X = currentPos.x + deltaX * 0.8;
        const control2Y = nextPos.y + 120 - deltaY * 0.1;

        const dotX = Math.pow(1 - t, 3) * currentPos.x +
          3 * Math.pow(1 - t, 2) * t * control1X +
          3 * (1 - t) * Math.pow(t, 2) * control2X +
          Math.pow(t, 3) * nextPos.x;

        const dotY = Math.pow(1 - t, 3) * (currentPos.y + 75) +
          3 * Math.pow(1 - t, 2) * t * control1Y +
          3 * (1 - t) * Math.pow(t, 2) * control2Y +
          Math.pow(t, 3) * (nextPos.y + 75);

        const size = 3 + Math.sin(t * Math.PI) * 5;
        const dotColor = RING_COLORS[i % RING_COLORS.length];
        dots.push(
          <View
            key={`dot-${i}-${j}`}
            style={[
              styles.connectingDot,
              {
                left: dotX - size / 2,
                top: dotY - size / 2,
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: dotColor,
                shadowColor: dotColor,
                opacity: 0.4 + Math.random() * 0.4,
              }
            ]}
          />
        );
      }
    }
    return dots;
  };

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
            data={levels.slice().reverse()} // Reverse to show level 1 at bottom
            renderItem={({ item, index }) => <LevelItem item={item} index={levels.length - 1 - index} />}
            keyExtractor={(item) => item.id.toString()}
            style={styles.scrollView}
            contentContainerStyle={styles.roadmapContainer}
            showsVerticalScrollIndicator={false}
            initialNumToRender={10}
            maxToRenderPerBatch={5}
            windowSize={10}
            removeClippedSubviews={true}
            getItemLayout={(data, index) => ({
              length: 220, // Height of each level item
              offset: 220 * index,
              index,
            })}
            initialScrollIndex={dataLoaded && userGameData ? Math.max(0, levels.length - userGameData.currentLevel) : 0}
            onScrollToIndexFailed={(info) => {
              // Fallback if scroll fails
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  // UNIFIED DASHBOARD STYLES
  dashboardContainer: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 15,
    backgroundColor: 'rgba(20, 20, 30, 0.95)',
    // Asymmetric Cyber Shape
    borderTopLeftRadius: 40,
    borderBottomRightRadius: 40,
    borderTopRightRadius: 4,
    borderBottomLeftRadius: 4,
    borderWidth: 2,
    borderColor: 'rgba(0, 224, 255, 0.6)',
    shadowColor: '#00E0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 15,
    zIndex: 100,
    overflow: 'hidden',
  },
  dashboardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  titleBlock: {
    justifyContent: 'center',
  },
  statsBlock: {
    flexDirection: 'row',
    gap: 8,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    gap: 6, // Add gap between icon and text
  },
  dashboardDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    width: '100%',
  },
  dashboardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingVertical: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.2)', // Slightly darker bottom
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dividerVertical: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dividerVerticalSmall: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },

  // Reused Font Styles
  cardTitle: {
    color: '#00E0FF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2,
  },
  cardSubtitle: {
    color: '#00FF88',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: 2,
  },
  userEmail: {
    color: '#FFD700',
    fontSize: 8,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  coinIcon: { fontSize: 14, marginRight: 4 },
  starIcon: { fontSize: 14, marginRight: 4 },
  statNumber: { color: '#FFF', fontSize: 12, fontWeight: '900' },
  menuIcon: { fontSize: 18, marginRight: 4 },
  menuText: { fontSize: 12, fontWeight: '800', letterSpacing: 1.2 },

  // Existing Styles
  scrollView: { flex: 1 },
  roadmapContainer: { paddingVertical: 120, paddingHorizontal: 20 },
  levelItemContainer: {
    height: 220,
    width: '100%',
    justifyContent: 'center',
    position: 'relative',
  },
  staticSpaceship: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5, // Above other elements
    top: -60, // Position above the planet
  },
  spaceshipLottie: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000', // Opaque black for solid cover
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingSpaceship: {
    width: 120,
    height: 120,
  },
  loadingText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 20,
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },

  connectingDot: {
    position: 'absolute',
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 5,
  },

  ufoLevel: {
    position: 'absolute',
    width: 150,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ufoTouchable: {
    width: 150,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nebulaGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  centeredLayers: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wavePulse: {
    position: 'absolute',
  },
  nodeCore: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  activeNodeCore: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    shadowOpacity: 1,
    shadowRadius: 30,
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 50,
  },
  titleContainer: {
    marginTop: 15,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  levelTitleText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  orbitalRing: {
    position: 'absolute',
    borderWidth: 3, // Increased from 2 for better visibility
    // borderStyle: 'dashed', // Keep dashed if desired, or make solid for even clearer rings. keeping dashed but thicker.
    borderStyle: 'dashed',
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    opacity: 1, // Full opacity
  },
  ufoIcon: { width: 85, height: 85, opacity: 1 },
  levelTextContainer: {
    position: 'absolute',
    bottom: -30, // Position below the planet
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  levelNumberText: {
    fontSize: 16,
    fontWeight: '900',
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 1,
    textAlign: 'center',
  },
  starsContainer: {
    position: 'absolute',
    top: -45,
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  starMini: { fontSize: 13, marginHorizontal: 1 },
  
  // Shop Modal Styles
  shopOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  shopModal: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: 'rgba(20, 20, 30, 0.95)',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#00E0FF',
    padding: 20,
  },
  shopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  shopTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1,
  },
  shopCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.5)',
  },
  shopCoins: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    padding: 10,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  shopCoinsText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
    marginLeft: 8,
  },
  shopGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  shopItem: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  shopItemIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  shopItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  shopItemDesc: {
    fontSize: 12,
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 15,
  },
  shopItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  shopItemPrice: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shopPriceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
    marginLeft: 5,
  },
  shopBuyBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#00E0FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shopBuyBtnDisabled: {
    backgroundColor: 'rgba(142, 142, 147, 0.3)',
  },
  shopInventoryBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#00FF88',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shopInventoryText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default Roadmap;