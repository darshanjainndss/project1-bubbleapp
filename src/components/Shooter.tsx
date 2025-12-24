// src/components/Shooter.tsx

import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated } from 'react-native';
import { Bubble } from './Bubble';
import { BubbleColor, Position, PowerUpType } from '../types/index';
import { BUBBLE_SIZE } from '../utils/patterns';

interface ShooterProps {
  currentBubble: BubbleColor;
  nextBubble: BubbleColor;
  angle: number;
  trajectoryPoints: Position[];
  position: Position;
  activePowerUp: PowerUpType | null;
  onAngleChange: (angle: number) => void;
}

const POWER_UP_GLOW_COLORS: Record<PowerUpType, string> = {
  fireball: 'rgba(255, 165, 0, 0.8)', // Orange
  bomb: 'rgba(255, 0, 0, 0.8)', // Red
  rainbow: 'rgba(128, 0, 128, 0.8)', // Purple
};

export const Shooter: React.FC<ShooterProps> = ({
  currentBubble,
  nextBubble,
  angle,
  trajectoryPoints,
  position,
  activePowerUp,
}) => {
  const glowAnim = useRef(new Animated.Value(0)).current;
  const cannonRotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (activePowerUp) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      glowAnim.stopAnimation();
      glowAnim.setValue(0);
    }
  }, [activePowerUp]);

  // Animate cannon rotation
  useEffect(() => {
    Animated.timing(cannonRotateAnim, {
      toValue: angle + Math.PI / 2, // Convert to degrees for proper rotation
      duration: 50, // Faster response
      useNativeDriver: true,
    }).start();
  }, [angle]);

  const borderColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(0,0,0,0)', POWER_UP_GLOW_COLORS[activePowerUp || 'fireball']],
  });

  const borderWidth = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 4],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.6],
  });

  return (
    <View style={styles.container}>
      {/* Trajectory dots */}
      {trajectoryPoints.map((point, index) => (
        <View
          key={index}
          style={[
            styles.trajectoryDot,
            {
              left: point.x - 3,
              top: point.y - 3,
              opacity: Math.max(0.2, 1 - index * 0.08),
              transform: [{ scale: Math.max(0.5, 1 - index * 0.05) }],
            },
          ]}
        />
      ))}

      {/* Shooter base */}
      <View
        style={[
          styles.shooterBase,
          {
            left: position.x - 40,
            top: position.y - 20,
          },
        ]}>
        <View style={styles.baseInner} />
      </View>

      {/* Shooter cannon */}
      <Animated.View
        style={[
          styles.shooterCannon,
          {
            left: position.x - 6,
            top: position.y - 50,
            transform: [
              { translateY: 25 }, // Move to rotation point
              { rotate: cannonRotateAnim.interpolate({
                inputRange: [0, 2 * Math.PI],
                outputRange: ['0deg', '360deg'],
              }) },
              { translateY: -25 }, // Move back
            ],
          },
        ]}>
        <View style={styles.cannonInner} />
      </Animated.View>

      {/* Power-up glow effect */}
      {activePowerUp && (
        <Animated.View
          style={[
            styles.powerUpGlow,
            {
              left: position.x - BUBBLE_SIZE,
              top: position.y - BUBBLE_SIZE,
              opacity: glowOpacity,
              backgroundColor: POWER_UP_GLOW_COLORS[activePowerUp],
            },
          ]}
        />
      )}

      {/* Current bubble */}
      <Animated.View
        style={[
          styles.currentBubble,
          {
            left: position.x - BUBBLE_SIZE / 2,
            top: position.y - BUBBLE_SIZE / 2,
            borderColor: activePowerUp ? borderColor : 'transparent',
            borderWidth: activePowerUp ? borderWidth : 0,
            borderRadius: BUBBLE_SIZE / 2,
          },
        ]}>
        <Bubble color={currentBubble} />
      </Animated.View>

      {/* Next bubble preview */}
      <View
        style={[
          styles.nextBubble,
          {
            left: position.x - 15,
            top: position.y + 50,
          },
        ]}>
        <View style={styles.nextBubbleContainer}>
          <Bubble color={nextBubble} size={30} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
  },
  trajectoryDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  shooterBase: {
    position: 'absolute',
    width: 80,
    height: 40,
    backgroundColor: '#8B4513',
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#654321',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  baseInner: {
    width: 60,
    height: 20,
    backgroundColor: '#A0522D',
    borderRadius: 10,
  },
  shooterCannon: {
    position: 'absolute',
    width: 12,
    height: 60,
    backgroundColor: '#654321',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#4A4A4A',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  cannonInner: {
    width: 8,
    height: 50,
    backgroundColor: '#8B4513',
    borderRadius: 4,
    margin: 2,
    marginTop: 4,
  },
  powerUpGlow: {
    position: 'absolute',
    width: BUBBLE_SIZE * 2,
    height: BUBBLE_SIZE * 2,
    borderRadius: BUBBLE_SIZE,
  },
  currentBubble: {
    position: 'absolute',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  nextBubble: {
    position: 'absolute',
  },
  nextBubbleContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 20,
    padding: 5,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
});