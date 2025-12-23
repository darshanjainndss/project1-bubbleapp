import React, { useCallback, useMemo } from 'react';
import {
  View,
  PanResponder,
  Dimensions,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { AimTracker, BubbleGrid, Shooter, HUD, GameOver, LevelComplete } from './components';
import { useGameLoop } from './useGameLoop';
import { useGameStore } from './store';
import { LEVEL_CONFIG } from './game';

const BubbleScreen = () => {
  const {
    update,
    bubbles,
    shooterPosition,
    aimPath,
    currentBubbleColor,
    nextBubbleColor,
    score,
    moves,
    combo,
    gameOver,
    level,
    bubblesCleared,
    patternName,
    setAimTargetFromTouch,
    fireBubble,
    resetGame,
    nextLevel,
  } = useGameStore();

  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  // Game loop
  useGameLoop(update);

  // Scale factors for coordinate conversion
  const scaleX = useMemo(() => 400 / screenWidth, [screenWidth]);
  const scaleY = useMemo(() => 700 / screenHeight, [screenHeight]);

  // Get level config
  const levelConfig = useMemo(() => {
    return LEVEL_CONFIG[Math.min(level, 100)] || LEVEL_CONFIG[1];
  }, [level]);

  // Determine if showing level complete or game over
  const isLevelComplete = useMemo(() => {
    return gameOver && bubblesCleared >= levelConfig.bubblesToClear && level < 100;
  }, [gameOver, bubblesCleared, levelConfig.bubblesToClear, level]);

  const isGameOver = useMemo(() => {
    return gameOver && !isLevelComplete;
  }, [gameOver, isLevelComplete]);

  // Pan responder for touch handling
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !gameOver,
        onMoveShouldSetPanResponder: () => !gameOver,

        onPanResponderGrant: (evt) => {
          const { locationX, locationY } = evt.nativeEvent;
          const gameX = locationX * scaleX;
          const gameY = locationY * scaleY;

          // Allow aiming in upper 80% of screen
          if (gameY < shooterPosition.y - 30) {
            setAimTargetFromTouch({ x: gameX, y: gameY });
          }
        },

        onPanResponderMove: (evt) => {
          const { locationX, locationY } = evt.nativeEvent;
          const gameX = locationX * scaleX;
          const gameY = locationY * scaleY;

          // Allow aiming in upper 80% of screen
          if (gameY < shooterPosition.y - 30) {
            setAimTargetFromTouch({ x: gameX, y: gameY });
          }
        },

        onPanResponderRelease: () => {
          if (!gameOver) {
            fireBubble();
          }
        },
      }),
    [scaleX, scaleY, shooterPosition.y, gameOver, setAimTargetFromTouch, fireBubble]
  );

  const handleRetry = useCallback(() => {
    resetGame();
  }, [resetGame]);

  const handleContinue = useCallback(() => {
    nextLevel();
  }, [nextLevel]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#0f172a"
        translucent={false}
      />

      {/* HUD - Score, Moves, Next Bubble, Progress - MOVED TO TOP */}
      <HUD
        score={score}
        moves={moves}
        combo={combo}
        nextBubbleColor={nextBubbleColor}
        level={level}
        gameOver={gameOver}
        bubblesCleared={bubblesCleared}
        bubblesToClear={levelConfig.bubblesToClear}
        patternName={patternName}
      />

      {/* Game Area */}
      <View style={styles.gameArea} {...panResponder.panHandlers}>
        {/* Background gradient effect */}
        <View style={styles.backgroundGradient} />

        {/* Game grid */}
        <BubbleGrid bubbles={bubbles} />

        {/* Aim path visualization */}
        {!gameOver && <AimTracker path={aimPath} />}

        {/* Shooter cannon - ENHANCED FOR VISIBILITY */}
        <Shooter
          position={shooterPosition}
          currentBubbleColor={currentBubbleColor}
          nextBubbleColor={nextBubbleColor}
        />

        {/* Level Complete Modal */}
        {isLevelComplete && (
          <LevelComplete
            level={level}
            score={score}
            bubblesCleared={bubblesCleared}
            patternName={patternName}
            onContinue={handleContinue}
          />
        )}

        {/* Game Over Modal */}
        {isGameOver && (
          <GameOver score={score} level={level} onRetry={handleRetry} />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  gameArea: {
    flex: 1,
    backgroundColor: '#1a1f35',
    position: 'relative',
    overflow: 'hidden',
  },
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.3)',
  },
});

export default BubbleScreen;