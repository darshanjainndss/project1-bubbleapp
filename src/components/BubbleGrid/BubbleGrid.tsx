import React from 'react';
import { View, Dimensions } from 'react-native';
import { Bubble } from '../../types/gameTypes';
import { GridBubble } from '../../utils/gridManager';

type Props = {
  bubbles: (Bubble | GridBubble)[];
};

const BubbleGrid: React.FC<Props> = ({ bubbles }) => {
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      {bubbles.filter(bubble => bubble.isActive).map(bubble => {
        // Convert game coordinates to screen coordinates
        const screenX = (bubble.position.x / 400) * screenWidth;
        const screenY = (bubble.position.y / 700) * screenHeight;
        const screenRadius = (bubble.radius / 400) * screenWidth; // Scale radius too
        
        // Different styling for grid vs shot bubbles
        const isGridBubble = 'isGridBubble' in bubble && bubble.isGridBubble;
        
        return (
          <View
            key={bubble.id}
            style={{
              position: 'absolute',
              width: screenRadius * 2,
              height: screenRadius * 2,
              borderRadius: screenRadius,
              backgroundColor: bubble.color,
              left: screenX - screenRadius,
              top: screenY - screenRadius,
              borderWidth: isGridBubble ? 1 : 2,
              borderColor: isGridBubble ? '#ffffff40' : '#ffffff80',
              zIndex: isGridBubble ? 1 : 2, // Shot bubbles appear above grid bubbles
            }}
          />
        );
      })}
    </View>
  );
};

export default BubbleGrid;
