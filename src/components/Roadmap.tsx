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
} from "react-native";
import GameScreen from './GameScreen';

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const Roadmap: React.FC = () => {
  const [showGameScreen, setShowGameScreen] = useState(false);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [selectedLevel, setSelectedLevel] = useState(1);

  const scrollViewRef = useRef<ScrollView>(null);
  const glowAnim = useRef(new Animated.Value(0)).current;

  // Generate levels data (all 20 levels unlocked)
  const levels = Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    isLocked: false, // Unlock all levels
    stars: Math.floor(Math.random() * 3) + 1,
  }));

  useEffect(() => {
    // Only glow animation for active level number
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.3, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handleLevelPress = (level: number, isLocked: boolean) => {
    if (isLocked) return; // This won't trigger since all levels are unlocked
    setSelectedLevel(level);
    setShowGameScreen(true);
  };

  const handleGameComplete = (gameScore: number, gameCoins: number, levelCompleted: number) => {
    setScore(prev => prev + gameScore);
    setCoins(prev => prev + gameCoins);
    if (levelCompleted >= currentLevel) {
      setCurrentLevel(levelCompleted + 1);
    }
    setShowGameScreen(false);
  };

  const handleBackPress = () => {
    setShowGameScreen(false);
  };

  // Create zigzag roadmap positions (back to simple zigzag)
  const getRoadmapPosition = (index: number) => {
    const isEven = index % 2 === 0;
    const x = isEven ? SCREEN_WIDTH * 0.2 : SCREEN_WIDTH * 0.8;
    const y = 120 + (index * 180);
    return { x, y };
  };

  // Create proper curved connecting dots between zigzag levels
  const renderConnectingDots = () => {
    const dots = [];
    for (let i = 0; i < levels.length - 1; i++) {
      const currentPos = getRoadmapPosition(i);
      const nextPos = getRoadmapPosition(i + 1);
      
      // Create natural curved path like in reference image
      const numDots = 25; // More dots for ultra-smooth curve
      
      for (let j = 1; j < numDots; j++) {
        const t = j / numDots; // Parameter from 0 to 1
        
        // Create more natural curve control points
        const deltaX = nextPos.x - currentPos.x;
        const deltaY = nextPos.y - currentPos.y;
        
        // Control points for natural S-curve (like in reference image)
        const control1X = currentPos.x + deltaX * 0.3; // First control point
        const control1Y = currentPos.y + 75 + deltaY * 0.1;
        
        const control2X = currentPos.x + deltaX * 0.7; // Second control point  
        const control2Y = nextPos.y + 75 - deltaY * 0.1;
        
        // Cubic Bezier curve for smoother, more natural curves
        const dotX = Math.pow(1 - t, 3) * currentPos.x +
                     3 * Math.pow(1 - t, 2) * t * control1X +
                     3 * (1 - t) * Math.pow(t, 2) * control2X +
                     Math.pow(t, 3) * nextPos.x;
        
        const dotY = Math.pow(1 - t, 3) * (currentPos.y + 75) +
                     3 * Math.pow(1 - t, 2) * t * control1Y +
                     3 * (1 - t) * Math.pow(t, 2) * control2Y +
                     Math.pow(t, 3) * (nextPos.y + 75);
        
        dots.push(
          <View
            key={`dot-${i}-${j}`}
            style={[
              styles.connectingDot,
              {
                left: dotX - 3,
                top: dotY - 3,
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
      <GameScreen onBackPress={handleBackPress} />
    );
  }

  return (
    <ImageBackground 
      source={require('../images/spacebg.png')} 
      style={styles.container}
      resizeMode="cover"
    >
      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.roadmapContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Connecting dots */}
        {renderConnectingDots()}
        
        {levels.map((level, index) => {
          const isCurrent = level.id === currentLevel;
          const position = getRoadmapPosition(index);
          
          return (
            <View
              key={level.id}
              style={[
                styles.ufoLevel,
                {
                  left: position.x - 75,
                  top: position.y,
                }
              ]}
            >
              <TouchableOpacity
                onPress={() => handleLevelPress(level.id, level.isLocked)}
                activeOpacity={0.8}
                style={styles.ufoTouchable}
              >
                {/* UFO Image - Bigger and Clear */}
                <Image 
                  source={require('../images/ufo2-removebg-preview.png')} 
                  style={[
                    styles.ufoIcon,
                    { 
                      opacity: 1, // All levels are unlocked, so always full opacity
                    }
                  ]}
                  resizeMode="contain"
                />
                
                {/* Floating Level Number with Glow - Only show for current level */}
                {isCurrent && (
                  <Animated.View 
                    style={[
                      styles.floatingLevelNumber,
                      {
                        backgroundColor: '#00FF88', // Bright green for active level
                        shadowColor: '#00FF88',
                        shadowOpacity: glowAnim,
                        shadowRadius: glowAnim.interpolate({
                          inputRange: [0.3, 1],
                          outputRange: [15, 30],
                        }),
                        transform: [
                          {
                            scale: glowAnim.interpolate({
                              inputRange: [0.3, 1],
                              outputRange: [1, 1.1],
                            }),
                          }
                        ],
                      }
                    ]}
                  >
                    <Text style={[
                      styles.levelNumber,
                      styles.activeLevelNumber
                    ]}>
                      {level.id}
                    </Text>
                  </Animated.View>
                )}

                {/* Stars floating above UFO - Show for all completed levels */}
                {level.id < currentLevel && (
                  <View style={styles.starsAboveUfo}>
                    {Array.from({ length: 3 }, (_, i) => (
                      <Text
                        key={i}
                        style={[
                          styles.star,
                          { opacity: i < level.stars ? 1 : 0.3 }
                        ]}
                      >
                        ⭐
                      </Text>
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  scrollView: {
    flex: 1,
  },
  
  roadmapContainer: {
    paddingVertical: 50,
    minHeight: 3800, // More height for bigger spacing
  },
  
  connectingDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
    opacity: 0.8,
  },
  
  ufoLevel: {
    position: 'absolute',
    width: 150,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  ufoTouchable: {
    width: 150,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  ufoIcon: {
    width: 250,
    height: 250,
  },
  
  floatingLevelNumber: {
    position: 'absolute',
    top: -20,
    left: '50%',
    marginLeft: -25,
    width: 50,
    height: 50,
    backgroundColor: '#FF6B35',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  
  lockedLevelNumber: {
    position: 'absolute',
    top: -20,
    left: '50%',
    marginLeft: -25,
    width: 50,
    height: 50,
    backgroundColor: '#666666',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    opacity: 0.6,
  },
  
  levelNumber: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  
  activeLevelNumber: {
    textShadowColor: '#FFFFFF',
    textShadowRadius: 4,
  },
  
  lockIcon: {
    fontSize: 18,
  },
  
  starsAboveUfo: {
    position: 'absolute',
    top: -50,
    left: '50%',
    marginLeft: -36,
    flexDirection: 'row',
    width: 72,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  
  star: {
    fontSize: 14,
    marginHorizontal: 1,
  },
});

export default Roadmap;