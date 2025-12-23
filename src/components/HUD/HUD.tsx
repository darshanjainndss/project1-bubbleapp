import React from 'react';
import { View, Text } from 'react-native';
import { useGameStore } from '../../types/gameStore';

const HUD = () => {
  const { score, moves, nextBubbleColor } = useGameStore();

  return (
    <View
      style={{
        width: '100%',
        padding: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <Text style={{ color: 'white', fontSize: 16 }}>Score: {score}</Text>
      
      <View style={{ alignItems: 'center' }}>
        <Text style={{ color: 'white', fontSize: 12, marginBottom: 4 }}>Next</Text>
        <View
          style={{
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: nextBubbleColor,
            borderWidth: 1,
            borderColor: '#fff',
          }}
        />
      </View>
      
      <Text style={{ color: 'white', fontSize: 16 }}>Moves: {moves}</Text>
    </View>
  );
};

export default HUD;
