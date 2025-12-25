import React, { useMemo, useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Animated,
  Easing,
  ImageBackground,
} from "react-native";
import LinearGradient from 'react-native-linear-gradient';
import GameScreen from './GameScreen';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const LEVEL_COUNT = 100;
const LEVEL_SPACING = 120; // Reduced spacing for better scrolling
const TOTAL_MAP_HEIGHT = LEVEL_COUNT * LEVEL_SPACING + 400;

const ZONES = [
  { 
    name: "Sky Castle", 
    start: 75, 
    end: 100, 
    image: require('../images/bg4.png'), 
    emoji: "🏰",
    colors: ['#87CEEB', '#4169E1', '#191970']
  },
  { 
    name: "Mountain Peak", 
    start: 50, 
    end: 74, 
    image: require('../images/bg3.png'), 
    emoji: "⛰️",
    colors: ['#8B4513', '#CD853F', '#DEB887']
  },
  { 
    name: "Forest Valley", 
    start: 25, 
    end: 49, 
    image: require('../images/bg2.png'), 
    emoji: "🌲",
    colors: ['#228B22', '#32CD32', '#90EE90']
  },
  { 
    name: "Coastal Beach", 
    start: 0, 
    end: 24, 
    image: require('../images/bg1.png'), 
    emoji: "🏖️",
    colors: ['#00CED1', '#20B2AA', '#48D1CC']
  },
];

const Roadmap: React.FC = () => {
  const [currentZoneIdx, setCurrentZoneIdx] = useState(0);
  const [showGameScreen, setShowGameScreen] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState(1);
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start from bottom (level 1)
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: false });
    }, 100);

    // Simple bounce animation for current level
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, { 
          toValue: -10, 
          duration: 600, 
          easing: Easing.inOut(Easing.quad), 
          useNativeDriver: true 
        }),
        Animated.timing(bounceAnim, { 
          toValue: 0, 
          duration: 600, 
          easing: Easing.inOut(Easing.quad), 
          useNativeDriver: true 
        }),
      ])
    ).start();
  }, []);

  // Simple scroll tracking
  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: false,
      listener: (event: any) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        const progress = 1 - (offsetY / (TOTAL_MAP_HEIGHT - SCREEN_HEIGHT));
        const level = Math.max(0, Math.min(99, Math.floor(progress * LEVEL_COUNT)));
        const zoneIdx = ZONES.findIndex(z => level >= z.start && level <= z.end);
        if (zoneIdx !== -1 && zoneIdx !== currentZoneIdx) {
          setCurrentZoneIdx(zoneIdx);
        }
      }
    }
  );

  // Handle level selection
  const handleLevelPress = (levelNumber: number, isLocked: boolean) => {
    if (isLocked) {
      // Visual feedback for locked levels - could add shake animation here
      console.log(`Level ${levelNumber} is locked!`);
      return;
    }
    
    console.log(`Opening level ${levelNumber}`);
    setSelectedLevel(levelNumber);
    setShowGameScreen(true);
  };

  // Handle back from game screen
  const handleBackToRoadmap = () => {
    setShowGameScreen(false);
  };

  // Simple road path following the background images
  const levelPositions = useMemo(() => {
    return Array.from({ length: LEVEL_COUNT }).map((_, i) => {
      // Simple curved path that follows the road in the images
      const xOffset = Math.sin(i * 0.3) * (SCREEN_WIDTH * 0.2);
      
      return {
        x: SCREEN_WIDTH / 2 + xOffset - 25,
        y: TOTAL_MAP_HEIGHT - (i * LEVEL_SPACING) - 200,
      };
    });
  }, []);

  // Show game screen if selected
  if (showGameScreen) {
    return <GameScreen onBackPress={handleBackToRoadmap} />;
  }

  return (
    <View style={styles.container}>
      
      {/* Simple Background with local images */}
      <View style={StyleSheet.absoluteFill}>
        {ZONES.map((zone, idx) => {
          const zoneStart = (TOTAL_MAP_HEIGHT * (100 - zone.end)) / 100;
          const zoneEnd = (TOTAL_MAP_HEIGHT * (100 - zone.start)) / 100;

          const opacity = scrollY.interpolate({
            inputRange: [zoneStart - SCREEN_HEIGHT, zoneStart, zoneEnd, zoneEnd + SCREEN_HEIGHT],
            outputRange: [0, 1, 1, 0],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View key={idx} style={[StyleSheet.absoluteFill, { opacity }]}>
              <ImageBackground 
                source={zone.image} 
                style={styles.bgImage} 
                resizeMode="cover"
              >
                <LinearGradient
                  colors={[
                    'rgba(0,0,0,0.3)',
                    'rgba(0,0,0,0.1)',
                    'rgba(0,0,0,0.3)'
                  ]}
                  style={StyleSheet.absoluteFill}
                />
              </ImageBackground>
            </Animated.View>
          );
        })}
      </View>

      {/* Simple HUD */}
      <View style={styles.hudContainer}>
        <LinearGradient
          colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
          style={styles.hudGlass}
        >
          <Text style={styles.hudText}>
            {ZONES[currentZoneIdx].emoji} {ZONES[currentZoneIdx].name}
          </Text>
        </LinearGradient>
      </View>

      <ScrollView
        ref={scrollViewRef}
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={{ height: TOTAL_MAP_HEIGHT }}
      >
        <View style={styles.roadLayer}>
          {/* Simple level circles */}
          {levelPositions.map((pos, i) => {
            const isCurrent = i === 0; // Current level
            const isLocked = i > 5; // Locked levels

            return (
              <View key={`level-${i}`} style={[styles.levelContainer, { left: pos.x, top: pos.y }]}>
                <Animated.View style={isCurrent ? { transform: [{ translateY: bounceAnim }] } : undefined}>
                  <TouchableOpacity
                    style={[
                      styles.levelCircle,
                      isCurrent && styles.currentLevel,
                      isLocked && styles.lockedLevel
                    ]}
                    activeOpacity={0.8}
                    onPress={() => handleLevelPress(i + 1, isLocked)}
                  >
                    {isLocked ? (
                      <Text style={styles.lockText}>🔒</Text>
                    ) : (
                      <Text style={styles.levelText}>{i + 1}</Text>
                    )}
                  </TouchableOpacity>
                </Animated.View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#000" 
  },
  bgImage: { 
    flex: 1, 
    width: SCREEN_WIDTH, 
    height: SCREEN_HEIGHT 
  },
  hudContainer: {
    position: 'absolute',
    top: 50,
    width: '100%',
    alignItems: 'center',
    zIndex: 100,
  },
  hudGlass: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  hudText: { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: 16,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  scrollView: {
    flex: 1,
  },
  roadLayer: { 
    flex: 1 
  },
  levelContainer: {
    position: "absolute",
    width: 50, 
    height: 50,
    alignItems: "center", 
    justifyContent: "center",
    zIndex: 2,
  },
  levelCircle: {
    width: 50, 
    height: 50,
    borderRadius: 25,
    alignItems: 'center', 
    justifyContent: 'center',
    backgroundColor: '#4cc9f0',
    borderWidth: 3,
    borderColor: '#fff',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  currentLevel: {
    backgroundColor: '#ff0054',
    borderColor: '#ffd700',
    borderWidth: 4,
    transform: [{ scale: 1.1 }],
  },
  lockedLevel: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderColor: '#666',
  },
  levelText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  lockText: {
    fontSize: 18,
    opacity: 0.7,
  },
});

export default Roadmap;