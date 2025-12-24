// src/components/LevelNode.tsx

import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Animated, useWindowDimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

interface LevelNodeProps {
  levelNumber: number;
  unlocked: boolean;
  completed: boolean;
  stars: number;
  onPress: () => void;
}

export const LevelNode: React.FC<LevelNodeProps> = ({
  levelNumber,
  unlocked,
  completed,
  stars,
  onPress,
}) => {
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const { width } = useWindowDimensions();

  // Size scales with screen width so roadmap fits all devices
  const size = Math.min(64, width / 6);
  const radius = size / 2;

  useEffect(() => {
    if (unlocked) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(0);
    }
  }, [unlocked, pulseAnim]);

  const getGradientColors = () => {
    if (!unlocked) return ['#9CA3AF', '#6B7280'];
    if (completed) return ['#10B981', '#059669'];
    return ['#3B82F6', '#1D4ED8'];
  };

  const borderColor = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.85)'],
  });

  const borderWidth = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1.5, 3],
  });

  return (
    <TouchableOpacity
      style={[styles.container, { width: size, height: size }]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={!unlocked}>
      <Animated.View
        style={[
          styles.animatedBorder,
          {
            borderRadius: radius,
            borderColor: unlocked ? borderColor : 'transparent',
            borderWidth: unlocked ? borderWidth : 0,
          },
        ]}>
        <LinearGradient
          colors={getGradientColors()}
          style={[styles.gradient, { borderRadius: radius }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}>
          {!unlocked && (
            <View style={[styles.lockContainer, { borderRadius: radius }]}>
              <Text style={styles.lockIcon}>🔒</Text>
            </View>
          )}

          <Text style={styles.levelNumber}>{levelNumber}</Text>

          {completed && (
            <View style={styles.starsContainer}>
              {[1, 2, 3].map(star => (
                <Text key={star} style={styles.star}>
                  {star <= stars ? '⭐' : '☆'}
                </Text>
              ))}
            </View>
          )}
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 8,
  },
  animatedBorder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  gradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  lockContainer: {
    position: 'absolute',
    inset: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  lockIcon: {
    fontSize: 22,
  },
  levelNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  starsContainer: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 4,
  },
  star: {
    fontSize: 11,
    marginHorizontal: 1,
  },
});
