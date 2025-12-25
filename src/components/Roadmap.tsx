import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Animated,
  ImageBackground,
  Image,
  ActivityIndicator,
} from "react-native";
import LottieView from 'lottie-react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import GameScreen from './GameScreen';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Height for scrollable coconut levels
const COCONUT_SCROLL_HEIGHT = SCREEN_HEIGHT * 3; 

const Roadmap: React.FC = () => {
  const [showGameScreen, setShowGameScreen] = useState(false);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [showLoading, setShowLoading] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const loadingSpinAnim = useRef(new Animated.Value(0)).current;
  
  // Falling coconuts for loading screen
  const coconutAnims = useRef(
    Array.from({ length: 6 }, () => ({
      translateY: new Animated.Value(-100),
      rotate: new Animated.Value(0),
      opacity: new Animated.Value(1),
    }))
  ).current;

  // Manual Coordinates optimized for a "Z-pattern" road
  // x: 0.1 to 0.9, y: 0.02 (top) to 0.95 (bottom)
  const levelPositions = [
    { x: 0.50, y: 0.94 }, { x: 0.30, y: 0.90 }, { x: 0.20, y: 0.85 },
    { x: 0.40, y: 0.81 }, { x: 0.70, y: 0.77 }, { x: 0.85, y: 0.72 },
    { x: 0.65, y: 0.67 }, { x: 0.35, y: 0.63 }, { x: 0.15, y: 0.58 },
    { x: 0.25, y: 0.53 }, { x: 0.55, y: 0.49 }, { x: 0.80, y: 0.44 },
    { x: 0.70, y: 0.39 }, { x: 0.40, y: 0.35 }, { x: 0.20, y: 0.30 },
    { x: 0.30, y: 0.25 }, { x: 0.60, y: 0.20 }, { x: 0.80, y: 0.15 },
    { x: 0.60, y: 0.08 }, { x: 0.50, y: 0.03 },
  ];

  useEffect(() => {
    // Start at the bottom (Level 1)
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: false });
    }, 100);

    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, { toValue: -15, duration: 600, useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handleLevelPress = (level: number, isLocked: boolean) => {
    if (isLocked) return;
    setSelectedLevel(level);
    showLoadingScreen(() => setShowGameScreen(true));
  };

  const handleGameComplete = (gameScore: number, gameCoins: number, levelCompleted: number) => {
    setScore(prev => prev + gameScore);
    setCoins(prev => prev + gameCoins);
    if (levelCompleted >= currentLevel) {
      setCurrentLevel(levelCompleted + 1);
    }
    showLoadingScreen(() => setShowGameScreen(false));
  };

  const handleReset = () => {
    setCurrentLevel(1);
    setScore(0);
    setCoins(0);
    showLoadingScreen(() => setShowGameScreen(false));
  };

  const showLoadingScreen = (callback: () => void) => {
    setShowLoading(true);
    
    // Reset coconut positions
    coconutAnims.forEach(anim => {
      anim.translateY.setValue(-100);
      anim.rotate.setValue(0);
      anim.opacity.setValue(1);
    });
    
    // Start spinning animation for icon
    Animated.loop(
      Animated.timing(loadingSpinAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();

    // Start falling coconuts animation
    const animations = coconutAnims.map((anim, index) => 
      Animated.parallel([
        Animated.timing(anim.translateY, {
          toValue: SCREEN_HEIGHT + 100,
          duration: 1500 + index * 100,
          useNativeDriver: true,
        }),
        Animated.timing(anim.rotate, {
          toValue: 360 * 2,
          duration: 1500 + index * 100,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(1200 + index * 100),
          Animated.timing(anim.opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    Animated.stagger(100, animations).start();

    // Show loading for 1.5 seconds
    setTimeout(() => {
      setShowLoading(false);
      loadingSpinAnim.stopAnimation();
      loadingSpinAnim.setValue(0);
      callback();
    }, 1500);
  };

  if (showGameScreen) {
    return (
      <GameScreen 
        onBackPress={() => showLoadingScreen(() => setShowGameScreen(false))}
        onGameComplete={handleGameComplete}
        level={selectedLevel}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Single Top Card with Score, Coins, and Reset */}
      <View style={styles.topCard}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>🪙</Text>
            <Text style={styles.statValue}>{coins.toLocaleString()}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>⭐</Text>
            <Text style={styles.statValue}>{score.toLocaleString()}</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.resetButton}
          onPress={handleReset}
          activeOpacity={0.8}
        >
          <Text style={styles.resetButtonText}>🔄</Text>
        </TouchableOpacity>
      </View>

      {/* Fixed Background Image */}
      <ImageBackground
        source={require('../images/raodmap5.jpg')}
        style={styles.backgroundImage}
        resizeMode="stretch"
      >
        {/* Boy Character Image */}
        <Image
          source={require('../images/boy-removebg-preview.png')}
          style={styles.boyImage}
          resizeMode="contain"
        />
      </ImageBackground>

      {/* Flying Bee Lottie Animation */}
      <LottieView
        source={require('../images/Loading Flying Beee.json')}
        style={styles.flyingBee}
        autoPlay
        loop
      />

      {/* Scrollable Coconut Levels */}
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ height: COCONUT_SCROLL_HEIGHT }}
        bounces={true}
        bouncesZoom={true}
        alwaysBounceVertical={true}
        style={styles.scrollContainer}
      >
        <View style={styles.coconutContainer}>
          {levelPositions.map((pos, index) => {
            const level = index + 1;
            const isCurrent = level === currentLevel;
            const isLocked = level > currentLevel;
            
            // Scaled positioning for scrollable area
            const leftPos = (pos.x * SCREEN_WIDTH) - 35; // Adjusted for smaller coconuts
            const topPos = (pos.y * COCONUT_SCROLL_HEIGHT) - 35; // Adjusted for smaller coconuts

            return (
              <View key={index} style={[styles.nodeContainer, { left: leftPos, top: topPos }]}>
                {/* 3-Star Rating display */}
                {!isLocked && (
                  <View style={styles.starsRow}>
                    <Text style={styles.starIcon}>⭐</Text>
                    <Text style={[styles.starIcon, { fontSize: 16, marginTop: -5 }]}>⭐</Text>
                    <Text style={styles.starIcon}>⭐</Text>
                  </View>
                )}

                <Animated.View style={isCurrent ? { transform: [{ translateY: bounceAnim }] } : null}>
                  <TouchableOpacity 
                    activeOpacity={0.8}
                    onPress={() => handleLevelPress(level, isLocked)}
                    style={styles.coconutButton}
                  >
                    {/* Coconut Image */}
                    <Image
                      source={require('../images/coconut.png')}
                      style={[
                        styles.coconutImage,
                        isCurrent && styles.activeCoconut,
                        isLocked && styles.lockedCoconut
                      ]}
                      resizeMode="contain"
                    />
                    
                    {/* Level Number Overlay */}
                    <View style={styles.levelNumberOverlay}>
                      {isLocked ? (
                        <Text style={styles.lockIcon}>🔒</Text>
                      ) : (
                        <Text style={styles.levelText}>{level}</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                </Animated.View>
                
                {/* 3D Platform Base */}
                <View style={styles.nodeBaseShadow} />
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Loading Screen */}
      {showLoading && (
        <View style={styles.loadingOverlay}>
          {/* Falling coconuts */}
          {coconutAnims.map((anim, index) => (
            <Animated.Image
              key={index}
              source={require('../images/coconut.png')}
              style={[
                styles.fallingCoconut,
                {
                  left: (index * SCREEN_WIDTH / 6) + Math.random() * 60,
                  transform: [
                    { translateY: anim.translateY },
                    { rotate: anim.rotate.interpolate({
                        inputRange: [0, 360],
                        outputRange: ['0deg', '360deg'],
                      })
                    },
                  ],
                  opacity: anim.opacity,
                },
              ]}
              resizeMode="contain"
            />
          ))}
          
          <View style={styles.loadingContainer}>
            <Animated.View
              style={[
                styles.loadingIconContainer,
                {
                  transform: [
                    {
                      rotate: loadingSpinAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg'],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Text style={styles.loadingIcon}>🔄</Text>
            </Animated.View>
            <Text style={styles.loadingText}>Loading...</Text>
            <ActivityIndicator size="large" color="#4CAF50" style={styles.activityIndicator} />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a1a' },
  topCard: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    height: 60,
    zIndex: 1000,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  statIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  statValue: {
    color: '#2c3e50',
    fontSize: 16,
    fontWeight: '900',
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  backgroundImage: {
    position: 'absolute', // Fixed position
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    top: 0,
    left: 0,
  },
  boyImage: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.45, // Increased to 45% of screen width
    height: SCREEN_HEIGHT * 0.35, // Increased to 35% of screen height
    bottom: SCREEN_HEIGHT * 0.25, // Moved higher - 25% from bottom
    right: SCREEN_WIDTH * 0.05, // Moved to right side - 5% from right
    zIndex: 5, // Above background but below coconuts
  },
  flyingBee: {
    position: 'absolute',
    width: 50,
    height: 50,
    bottom: SCREEN_HEIGHT * 0.45, // Boy's face level (boy starts at 25% from bottom + most of his 35% height)
    right: SCREEN_WIDTH * 0.35, // In front of boy's face (boy is at 5% from right with 45% width)
    zIndex: 500, // High z-index but below topCard (1000)
  },
  scrollContainer: {
    flex: 1,
  },
  coconutContainer: {
    flex: 1,
    position: 'relative',
  },
  coconutButton: {
    width: 70, // Reduced from 90
    height: 70, // Reduced from 90
    alignItems: 'center',
    justifyContent: 'center',
  },
  coconutImage: {
    width: 60, // Reduced from 80
    height: 60, // Reduced from 80
  },
  activeCoconut: {
    width: 70, // Reduced from 95
    height: 70, // Reduced from 95
  },
  lockedCoconut: {
    opacity: 0.5,
  },
  levelNumberOverlay: {
    position: 'absolute',
    width: 60, // Reduced from 80
    height: 60, // Reduced from 80
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 30, // Adjusted for new size
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  nodeContainer: {
    position: 'absolute',
    width: 70, // Reduced from 90
    height: 100, // Reduced from 120
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  starsRow: {
    flexDirection: 'row',
    position: 'absolute',
    top: -15,
    alignItems: 'flex-end',
  },
  starIcon: { fontSize: 12, textShadowColor: 'black', textShadowRadius: 3 },
  nodeCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 4,
    borderColor: '#ffffff',
    elevation: 15,
    overflow: 'hidden',
  },
  activeCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderColor: '#FFD700',
    borderWidth: 5,
  },
  lockedCircle: { borderColor: '#bdc3c7' },
  nodeGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  levelText: { color: '#fff', fontSize: 22, fontWeight: '900', textShadowColor: 'black', textShadowRadius: 2 },
  lockIcon: { fontSize: 22 },
  nodeBaseShadow: {
    width: 25,
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 12,
    marginTop: 2,
    zIndex: -1,
  },
  resetButton: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButtonText: {
    fontSize: 18,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    zIndex: 2000,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 2001,
  },
  loadingIconContainer: {
    marginBottom: 15,
  },
  loadingIcon: {
    fontSize: 50,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  activityIndicator: {
    marginTop: 5,
  },
  fallingCoconut: {
    position: 'absolute',
    width: 35,
    height: 35,
    zIndex: 1999,
  }
});

export default Roadmap;