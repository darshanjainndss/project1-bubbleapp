import React from 'react';
import { View, PanResponder, Dimensions, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AimTracker, BubbleGrid, Shooter, HUD } from './components';
import { useGameLoop } from './hooks';
import { useGameStore } from './store';

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
    setAimTargetFromTouch, 
    fireBubble 
  } = useGameStore();
  
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  useGameLoop(update);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    
    onPanResponderGrant: (evt) => {
      const { locationX, locationY } = evt.nativeEvent;
      const gameX = (locationX / screenWidth) * 400;
      const gameY = (locationY / screenHeight) * 700;
      
      if (gameY < shooterPosition.y - 20) {
        setAimTargetFromTouch({ x: gameX, y: gameY });
      }
    },
    
    onPanResponderMove: (evt) => {
      const { locationX, locationY } = evt.nativeEvent;
      const gameX = (locationX / screenWidth) * 400;
      const gameY = (locationY / screenHeight) * 700;
      
      if (gameY < shooterPosition.y - 20) {
        setAimTargetFromTouch({ x: gameX, y: gameY });
      }
    },
    
    onPanResponderRelease: () => {
      fireBubble();
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.gameArea} {...panResponder.panHandlers}>
        <BubbleGrid bubbles={bubbles} />
        <AimTracker path={aimPath} />
        <Shooter position={shooterPosition} currentBubbleColor={currentBubbleColor} />
        
        {/* Debug info */}
        <View style={styles.debug}>
          <Text style={styles.debugText}>
            Total: {bubbles.length} | Grid: {bubbles.filter(b => 'isGridBubble' in b && b.isGridBubble).length} | Shot: {bubbles.filter(b => !('isGridBubble' in b) || !b.isGridBubble).length}
          </Text>
          <Text style={styles.debugText}>
            Shooter: {shooterPosition.x.toFixed(0)}, {shooterPosition.y.toFixed(0)}
          </Text>
          <Text style={styles.debugText}>
            Aim Path: {aimPath.length}
          </Text>
          <View style={styles.colorIndicator}>
            <Text style={styles.debugText}>Current:</Text>
            <View style={[styles.colorDot, { backgroundColor: currentBubbleColor }]} />
          </View>
        </View>
      </View>
      
      <HUD score={score} moves={moves} nextBubbleColor={nextBubbleColor} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  gameArea: {
    flex: 1,
    backgroundColor: '#16213e',
  },
  debug: {
    position: 'absolute',
    top: 50,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    borderRadius: 5,
  },
  debugText: {
    color: 'white',
    fontSize: 12,
  },
  colorIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fff',
    marginLeft: 5,
  },
});

export default BubbleScreen;