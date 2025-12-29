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
} from "react-native";
import LottieView from 'lottie-react-native';
import GameScreen from './GameScreen';
import SpaceBackground from "./SpaceBackground.tsx";
import { getLevelPattern, getLevelMoves } from '../data/levelPatterns';

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
const RoadmapHeader = ({ coins }: { coins: number }) => {
  return (
    <View style={styles.dashboardContainer}>
      {/* Top Section: Title & Stats */}
      <View style={styles.dashboardTop}>
        <View style={styles.titleBlock}>
          <Text style={styles.cardTitle}>SPACE</Text>
          <Text style={styles.cardSubtitle}>ADVENTURE</Text>
        </View>

        <View style={styles.dividerVertical} />

        <View style={styles.statsBlock}>
          <View style={styles.statChip}>
            <Text style={styles.coinIcon}>🪙</Text>
            <Text style={styles.statNumber}>{coins}</Text>
          </View>
          <View style={styles.statChip}>
            <Text style={styles.starIcon}>⭐</Text>
            <Text style={styles.statNumber}>48</Text>
          </View>
        </View>
      </View>

      {/* Horizontal Divider Line */}
      <View style={styles.dashboardDivider} />

      {/* Bottom Section: Action Menu */}
      <View style={styles.dashboardBottom}>
        <TouchableOpacity style={styles.actionBtn}>
          <Text style={[styles.menuIcon, { color: '#FFD60A' }]}>🥇</Text>
          <Text style={[styles.menuText, { color: '#00E0FF' }]}>LEADERBOARD</Text>
        </TouchableOpacity>

        <View style={styles.dividerVerticalSmall} />

        <TouchableOpacity style={styles.actionBtn}>
          <Text style={[styles.menuIcon, { color: '#00E0FF' }]}></Text>
          <Text style={[styles.menuText, { color: '#00FF88' }]}>PROFILE</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const Roadmap: React.FC = () => {
  const [showGameScreen, setShowGameScreen] = useState(false);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(1250);
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const glowAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

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
    Array.from({ length: 100 }, (_, i) => ({
      id: i + 1,
      isLocked: false, // For testing, unlock all. Real game would lock i > solvedMax
      stars: Math.floor(Math.random() * 3) + 1,
    })), []
  );

  // Auto-scroll to current level on mount and when current level changes
  useEffect(() => {
    setTimeout(() => {
      const currentIndex = levels.findIndex(level => level.id === currentLevel);
      if (currentIndex !== -1) {
        // Calculate the reversed index since we're showing levels in reverse order
        const reversedIndex = levels.length - 1 - currentIndex;
        flatListRef.current?.scrollToIndex({ 
          index: Math.max(0, reversedIndex - 2), // Show a bit of context above
          animated: true,
          viewPosition: 0.5 // Center the item
        });
      }
    }, 100);
  }, [currentLevel]); // Re-run when current level changes

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
    if (isLocked || isLoading) return;
    
    setIsLoading(true);
    setSelectedLevel(level);
    setCurrentLevel(level);
    
    // Preload level data
    const levelPattern = getLevelPattern(level);
    const levelMoves = getLevelMoves(level);
    
    // Smooth fade out animation
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200, // Faster fade out
      useNativeDriver: true,
    }).start(() => {
      // Small delay to ensure smooth transition
      setTimeout(() => {
        setShowGameScreen(true);
        // Fade back in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200, // Faster fade in
          useNativeDriver: true,
        }).start(() => {
          setIsLoading(false);
        });
      }, 50);
    });
  };

  const handleBackPress = () => {
    setIsLoading(true);
    
    // Smooth fade out animation
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200, // Faster transition
      useNativeDriver: true,
    }).start(() => {
      setShowGameScreen(false);
      
      // Fade back in and scroll to current level
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200, // Faster transition
        useNativeDriver: true,
      }).start(() => {
        setIsLoading(false);
        
        // Scroll to current level when returning from game screen
        setTimeout(() => {
          const currentIndex = levels.findIndex(level => level.id === currentLevel);
          if (currentIndex !== -1) {
            const reversedIndex = levels.length - 1 - currentIndex;
            flatListRef.current?.scrollToIndex({ 
              index: Math.max(0, reversedIndex - 2),
              animated: true,
              viewPosition: 0.5
            });
          }
        }, 50); // Faster scroll timing
      });
    });
  };

  // Loading Indicator Component
  const LoadingIndicator = () => (
    <View style={styles.loadingContainer}>
      <LottieView
        source={require('../images/Spaceship.json')}
        autoPlay
        loop
        style={styles.loadingSpaceship}
      />
      <Text style={styles.loadingText}>Loading Level {selectedLevel}...</Text>
    </View>
  );

  // Individual Level Item Component for better performance
  const LevelItem = React.memo(({ item, index }: { item: any, index: number }) => {
    const isCurrent = item.id === currentLevel;
    const isPassed = item.id < currentLevel;
    const levelColor = RING_COLORS[index % RING_COLORS.length];
    const isEven = index % 2 === 0;
    const x = isEven ? SCREEN_WIDTH * 0.22 : SCREEN_WIDTH * 0.78;

    return (
      <View style={[styles.levelItemContainer, { marginLeft: x - 75 }]}>
        <TouchableOpacity 
          onPress={() => handleLevelPress(item.id, item.isLocked)} 
          activeOpacity={0.8} 
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
              {/* zIndex 1 for nodeCore, higher than waves (default 0) */}
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
                    style={[styles.ufoIcon, { opacity: index <= currentLevel ? 1 : 0.85 }]}
                    resizeMode="contain"
                  />
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
            <Text style={[styles.levelNumberText, { color: levelColor }]}>LEVEL {item.id}</Text>
          </View>

          {/* Star Reward Display */}
          {isPassed && (
            <View style={styles.starsContainer}>
              {[1, 2, 3].map(s => (
                <Text key={s} style={[styles.starMini, { opacity: s <= item.stars ? 1 : 0.2 }]}>⭐</Text>
              ))}
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  });

  const getRoadmapPosition = (index: number) => {
    const isEven = index % 2 === 0;
    const x = isEven ? SCREEN_WIDTH * 0.22 : SCREEN_WIDTH * 0.78;
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

  if (showGameScreen) {
    return (
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        {isLoading && <LoadingIndicator />}
        <GameScreen onBackPress={handleBackPress} level={selectedLevel} />
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {isLoading && <LoadingIndicator />}
      <SpaceBackground />

      {/* Unified Dashboard Header */}
      <RoadmapHeader coins={coins} />

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
        inverted={false}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  // UNIFIED DASHBOARD STYLES
  dashboardContainer: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 5,
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
    paddingVertical: 10,
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
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
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
  ufoIcon: { width: 85, height: 85 },
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
});

export default Roadmap;