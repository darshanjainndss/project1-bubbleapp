import React from 'react';
import { View, PanResponder, Dimensions, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Shooter from '../../components/Shooter';
import BubbleGrid from '../../components/BubbleGrid';
import AimTracker from '../../components/AimTracker';
import HUD from '../../components/HUD';
import { styles } from './styles';
import { useGameLoop } from '../../utils/useGameLoop';
import { useGameStore } from '../../types/gameStore';

const BubbleScreen = () => {
  const { update, bubbles, shooterPosition, aimPath, currentBubbleColor, setAimTargetFromTouch, fireBubble } = useGameStore();
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  useGameLoop(update);

  // Create pan responder for touch controls
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    
    onPanResponderGrant: (evt) => {
      const { locationX, locationY } = evt.nativeEvent;
      // Convert screen coordinates to game coordinates
      const gameX = (locationX / screenWidth) * 400;
      const gameY = (locationY / screenHeight) * 700;
      
      // Only allow aiming upward (prevent shooting down)
      if (gameY < shooterPosition.y - 20) {
        setAimTargetFromTouch({ x: gameX, y: gameY });
      }
    },
    
    onPanResponderMove: (evt) => {
      const { locationX, locationY } = evt.nativeEvent;
      // Convert screen coordinates to game coordinates
      const gameX = (locationX / screenWidth) * 400;
      const gameY = (locationY / screenHeight) * 700;
      
      // Only allow aiming upward (prevent shooting down)
      if (gameY < shooterPosition.y - 20) {
        setAimTargetFromTouch({ x: gameX, y: gameY });
      }
    },
    
    onPanResponderRelease: () => {
      // Fire the bubble when touch is released
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
        <View style={{
          position: 'absolute',
          top: 50,
          left: 10,
          backgroundColor: 'rgba(0,0,0,0.7)',
          padding: 10,
          borderRadius: 5,
        }}>
          <Text style={{ color: 'white', fontSize: 12 }}>
            Total: {bubbles.length} | Grid: {bubbles.filter(b => 'isGridBubble' in b && b.isGridBubble).length} | Shot: {bubbles.filter(b => !('isGridBubble' in b) || !b.isGridBubble).length}
          </Text>
          <Text style={{ color: 'white', fontSize: 12 }}>
            Shooter: {shooterPosition.x.toFixed(0)}, {shooterPosition.y.toFixed(0)}
          </Text>
          <Text style={{ color: 'white', fontSize: 12 }}>
            Aim Path: {aimPath.length}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            <Text style={{ color: 'white', fontSize: 12, marginRight: 5 }}>
              Current:
            </Text>
            <View
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: currentBubbleColor,
                borderWidth: 1,
                borderColor: '#fff',
              }}
            />
          </View>
          {/* Show active shot bubbles with velocity */}
          {bubbles.filter(b => b.isActive && (!('isGridBubble' in b) || !b.isGridBubble) && b.id.startsWith('shot')).map(bubble => (
            <Text key={bubble.id} style={{ color: 'yellow', fontSize: 10 }}>
              Shot: vx={bubble.velocity.x.toFixed(0)}, vy={bubble.velocity.y.toFixed(0)}
            </Text>
          ))}
        </View>
      </View>
      <HUD />
    </SafeAreaView>
  );
};

export default BubbleScreen;
