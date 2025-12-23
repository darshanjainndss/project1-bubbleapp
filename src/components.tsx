import React from 'react';
import { View, Dimensions, Text } from 'react-native';
import { Vector2, Bubble, GridBubble } from './types';

// AimTracker Component
type AimTrackerProps = {
  path: Vector2[];
};

export const AimTracker: React.FC<AimTrackerProps> = ({ path }) => {
  if (path.length < 2) return null;

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
        const screenX = (point.x / 400) * screenWidth;
        const screenY = (point.y / 700) * screenHeight;
        const dotSize = index === path.length - 1 ? 8 : 6;
        const opacity = Math.max(0.5, 1 - (index * 0.08));
        
        return (
          <View
            key={`dot-${index}`}
            style={{
              position: 'absolute',
              left: screenX - dotSize / 2,
              top: screenY - dotSize / 2,
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              backgroundColor: index === path.length - 1 ? '#ff6b6b' : '#38bdf8',
              opacity,
              borderWidth: 1,
              borderColor: '#ffffff80',
            }}
          />
        );
      })}
    </View>
  );
};

// BubbleGrid Component
type BubbleGridProps = {
  bubbles: (Bubble | GridBubble)[];
};

export const BubbleGrid: React.FC<BubbleGridProps> = ({ bubbles }) => {
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      {bubbles.filter(bubble => bubble.isActive).map(bubble => {
        const screenX = (bubble.position.x / 400) * screenWidth;
        const screenY = (bubble.position.y / 700) * screenHeight;
        const screenRadius = (bubble.radius / 400) * screenWidth;
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
              zIndex: isGridBubble ? 1 : 2,
            }}
          />
        );
      })}
    </View>
  );
};

// Shooter Component
type ShooterProps = {
  position: Vector2;
  currentBubbleColor?: string;
};

export const Shooter: React.FC<ShooterProps> = ({ position, currentBubbleColor = '#f97316' }) => {
  const bubbleSize = 28;
  const shooterWidth = 40;
  const shooterHeight = 60;
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

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

// HUD Component
type HUDProps = {
  score: number;
  moves: number;
  nextBubbleColor: string;
};

export const HUD: React.FC<HUDProps> = ({ score, moves, nextBubbleColor }) => {
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