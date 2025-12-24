// src/components/Bubble.tsx

import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { BubbleColor } from '../types/index';
import { BUBBLE_SIZE } from '../utils/patterns';

interface BubbleProps {
  color: BubbleColor;
  size?: number;
  isPopping?: boolean;
  onPop?: () => void;
}

const COLOR_MAP: Record<BubbleColor, string[]> = {
  red: ['#FF6B6B', '#FF4757'],
  blue: ['#74B9FF', '#0984E3'],
  green: ['#00B894', '#00A085'],
  yellow: ['#FDCB6E', '#E17055'],
  purple: ['#A29BFE', '#6C5CE7'],
  orange: ['#FD79A8', '#E84393'],
  pink: ['#FF7675', '#E17055'],
  cyan: ['#00CEC9', '#00B894'],
};

export const Bubble: React.FC<BubbleProps> = ({
  color,
  size = BUBBLE_SIZE,
  isPopping = false,
  onPop,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Entry animation
  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, []);

  // Pop animation
  useEffect(() => {
    if (isPopping) {
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.3,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onPop?.();
      });
    }
  }, [isPopping]);

  const colors = COLOR_MAP[color];
  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          transform: [
            { scale: scaleAnim },
            { rotate: rotation },
          ],
          opacity: opacityAnim,
        },
      ]}>
      <LinearGradient
        colors={colors}
        style={styles.gradient}
        start={{ x: 0.2, y: 0.2 }}
        end={{ x: 0.8, y: 0.8 }}>
        <View style={[styles.shine, { 
          width: size * 0.3, 
          height: size * 0.3,
          borderRadius: size * 0.15,
          top: size * 0.15,
          left: size * 0.25,
        }]} />
        <View style={[styles.highlight, {
          width: size * 0.15,
          height: size * 0.15,
          borderRadius: size * 0.075,
          top: size * 0.2,
          left: size * 0.3,
        }]} />
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  gradient: {
    width: '100%',
    height: '100%',
    borderRadius: 1000,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  shine: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  highlight: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
});