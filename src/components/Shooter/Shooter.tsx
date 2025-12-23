import React from 'react';
import { View, Dimensions } from 'react-native';
import { Vector2 } from '../../types/gameTypes';

type Props = {
  position: Vector2;
  currentBubbleColor?: string;
};

const Shooter: React.FC<Props> = ({ position, currentBubbleColor = '#f97316' }) => {
  const bubbleSize = 28;
  const shooterWidth = 40;
  const shooterHeight = 60;
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  // Convert game coordinates to screen coordinates
  const screenX = (position.x / 400) * screenWidth;
  const screenY = (position.y / 700) * screenHeight;

  return (
    <View
      style={{
        position: 'absolute',
        left: screenX - shooterWidth / 2,
        top: screenY - shooterHeight / 2,
        zIndex: 10,
        alignItems: 'center',
      }}
    >
      {/* Shooter base */}
      <View
        style={{
          width: shooterWidth,
          height: shooterHeight,
          backgroundColor: '#64748b',
          borderRadius: 20,
          borderWidth: 2,
          borderColor: '#fff',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      />
      
      {/* Current bubble to shoot */}
      <View
        style={{
          position: 'absolute',
          width: bubbleSize,
          height: bubbleSize,
          borderRadius: bubbleSize / 2,
          backgroundColor: currentBubbleColor,
          borderWidth: 2,
          borderColor: '#fff',
          top: -bubbleSize / 2,
        }}
      />
    </View>
  );
};

export default Shooter;
