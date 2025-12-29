import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Animated,
  Image,
} from "react-native";
import GameScreen from './GameScreen';
import SpaceBackground from "./SpaceBackground.tsx";

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

// GLASS CARD HEADER COMPONENT
const GlassCardHeader = ({ coins }: { coins: number }) => {
  const textSlideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Text entrance animation
    Animated.timing(textSlideAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <View style={styles.cardContainer}>
      {/* Glass Card with Hexagonal Shape */}
      <View style={styles.hexagonalCard}>
        {/* Left Section: Title */}
        <Animated.View
          style={[
            styles.titleSection,
            {
              transform: [
                {
                  translateX: textSlideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-50, 0],
                  }),
                },
              ],
              opacity: textSlideAnim,
            },
          ]}
        >
          <Text style={styles.cardTitle}>SPACE</Text>
          <Text style={styles.cardSubtitle}>ADVENTURE</Text>
        </Animated.View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Right Section: Stats */}
        <Animated.View
          style={[
            styles.statsSection,
            {
              transform: [
                {
                  translateX: textSlideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  }),
                },
              ],
              opacity: textSlideAnim,
            },
          ]}
        >
          {/* Coins Stat */}
          <View style={styles.statItem}>
            <Text style={styles.coinIcon}>🪙</Text>
            <Text style={styles.statNumber}>{coins}</Text>
          </View>

          {/* Stars Stat */}
          <View style={styles.statItem}>
            <Text style={styles.starIcon}>⭐</Text>
            <Text style={styles.statNumber}>48</Text>
          </View>
        </Animated.View>
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

  const scrollViewRef = useRef<ScrollView>(null);
  const glowAnim = useRef(new Animated.Value(0)).current;

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
    'https://img.icons8.com/fluency/512/earth-planet.png',
    'https://img.icons8.com/fluency/512/mercury-planet.png',
    'https://img.icons8.com/fluency/512/sun.png',
    'https://img.icons8.com/fluency/512/asteroid.png',
    'https://img.icons8.com/fluency/512/black-hole.png',
    'https://img.icons8.com/fluency/512/uranus-planet.png',
    'https://img.icons8.com/fluency/512/venus-planet.png',
    'https://img.icons8.com/fluency/512/neptune-planet.png',
    'https://img.icons8.com/fluency/512/supernova.png',
    'https://img.icons8.com/fluency/512/shooting-star.png',
  ];

  // Generate levels data (all 20 levels unlocked)
  const levels = Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    isLocked: false,
    stars: Math.floor(Math.random() * 3) + 1,
  }));

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.3, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handleLevelPress = (level: number, isLocked: boolean) => {
    if (isLocked) return;
    setSelectedLevel(level);
    setShowGameScreen(true);
  };

  const handleBackPress = () => {
    setShowGameScreen(false);
  };

  const getRoadmapPosition = (index: number) => {
    const isEven = index % 2 === 0;
    const x = isEven ? SCREEN_WIDTH * 0.22 : SCREEN_WIDTH * 0.78;
    const y = 150 + (index * 220);
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
    return <GameScreen onBackPress={handleBackPress} level={selectedLevel} />;
  }

  return (
    <View style={styles.container}>
      <SpaceBackground />

      {/* Glass Card Header */}
      <GlassCardHeader coins={coins} />

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.roadmapContainer}
        showsVerticalScrollIndicator={false}
      >
        {renderConnectingDots()}

        {levels.map((level, index) => {
          const isCurrent = level.id === currentLevel;
          const isPassed = level.id < currentLevel;
          const position = getRoadmapPosition(index);
          const levelColor = RING_COLORS[index % RING_COLORS.length];

          return (
            <View key={level.id} style={[styles.ufoLevel, { left: position.x - 75, top: position.y }]}>
              <TouchableOpacity onPress={() => handleLevelPress(level.id, level.isLocked)} activeOpacity={0.8} style={styles.ufoTouchable}>

                {/* Centered Layers Container - Restored perfect mathematical centering */}
                <View style={StyleSheet.absoluteFill} pointerEvents="none">
                  <View style={styles.centeredLayers}>
                    {/* Multi-Ripple Wave Effect emitting from the planet edge every 2s */}
                    <WavePulse color={levelColor} duration={2000} size={100} />
                    <WavePulse color={levelColor} duration={2000} delay={1000} size={100} />

                    {/* Different number of Orbital Rings per level (1 to 3) with Perpendicular Axis */}
                    {Array.from({ length: (index % 3) + 1 }).map((_, rIdx) => {
                      // Determine rotation for perpendicular and tilted orbits
                      let rx = '0deg';
                      let ry = '0deg';

                      if (rIdx === 0) rx = '75deg'; // Horizontal/Equatorial
                      if (rIdx === 1) ry = '75deg'; // Perpendicular/Polar
                      if (rIdx === 2) { rx = '45deg'; ry = '45deg'; } // Tilted/Diagonal

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
                  </View>
                </View>

                {/* Planet Node - Wrapped in absolute center for perfect alignment with rings */}
                <View style={StyleSheet.absoluteFill} pointerEvents="none">
                  <View style={[styles.centeredLayers, { zIndex: 1 }]}> {/* zIndex 1 for nodeCore, higher than waves (default 0) */}
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
                      {/* Internal Glow Layer */}
                      <StationInnerGlow color={levelColor} isCurrent={isCurrent} />

                      {/* Hide icons for level 6 and 8 as requested */}
                      {!(level.id === 6 || level.id === 8) && (
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

                {/* Level Badge - Sleek Badge */}
                <Animated.View style={[
                  styles.levelBadge,
                  {
                    backgroundColor: isCurrent ? '#00FF88' : isPassed ? '#A259FF' : '#333',
                    transform: [{ scale: isCurrent ? glowAnim.interpolate({ inputRange: [0.3, 1], outputRange: [1, 1.15] }) : 1 }]
                  }
                ]}>
                  <Text style={styles.levelNumberText}>{level.id}</Text>
                </Animated.View>

                {/* Star Reward Display */}
                {isPassed && (
                  <View style={styles.starsContainer}>
                    {[1, 2, 3].map(s => (
                      <Text key={s} style={[styles.starMini, { opacity: s <= level.stars ? 1 : 0.2 }]}>⭐</Text>
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  // Glass Card Header Styles
  cardContainer: {
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    zIndex: 100,
  },
  hexagonalCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 224, 255, 0.6)',
    shadowColor: 'rgba(0, 224, 255, 0.4)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
    minHeight: 70,
    // Hexagonal approximation using varied corner radii
    borderTopLeftRadius: 12,
    borderTopRightRadius: 3,
    borderBottomRightRadius: 12,
    borderBottomLeftRadius: 3,
  },
  titleSection: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTitle: {
    color: '#00E0FF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
  },
  cardSubtitle: {
    color: '#00FF88',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: 2,
  },
  divider: {
    width: 1.5,
    height: 50,
    backgroundColor: 'rgba(0, 224, 255, 0.3)',
    marginHorizontal: 10,
  },
  statsSection: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 224, 255, 0.1)',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 224, 255, 0.3)',
  },
  coinIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  starIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  statNumber: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '900',
  },

  // Existing Styles
  scrollView: { flex: 1 },
  roadmapContainer: { paddingVertical: 120, minHeight: 4800 },

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
    borderWidth: 2,
    borderStyle: 'dashed',
    opacity: 0.8,
  },
  ufoIcon: { width: 85, height: 85 },
  levelBadge: {
    position: 'absolute',
    top: 0,
    right: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
    zIndex: 10,
  },
  levelNumberText: { color: '#FFF', fontSize: 13, fontWeight: '900' },
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