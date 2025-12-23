import React from 'react';
import { View, Dimensions } from 'react-native';
import { Vector2 } from '../../types/gameTypes';

type Props = {
  path: Vector2[];
};

const AimTracker: React.FC<Props> = ({ path }) => {
  if (path.length < 2) {
    return null;
  }

  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
      }}
    >
      {path.map((point, index) => {
        // Convert game coordinates to screen coordinates
        const screenX = (point.x / 400) * screenWidth;
        const screenY = (point.y / 700) * screenHeight;
        
        return (
          <View
            key={`dot-${index}`}
            style={{
              position: 'absolute',
              left: screenX - 2,
              top: screenY - 2,
              width: 4,
              height: 4,
              borderRadius: 2,
              backgroundColor: '#38bdf8',
              opacity: Math.max(0.3, 1 - (index * 0.1)), // Fade out along path
            }}
          />
        );
      })}
    </View>
  );
};

export default AimTracker;
