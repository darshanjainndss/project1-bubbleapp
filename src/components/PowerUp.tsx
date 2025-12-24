// src/components/PowerUp.tsx

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { PowerUpType } from '../types/index';

interface PowerUpProps {
  type: PowerUpType;
  count: number;
  active: boolean;
  onPress: () => void;
}

const POWER_UP_CONFIG = {
  fireball: {
    emoji: '🔥',
    name: 'Fireball',
    colors: ['#FF6B35', '#F7931E'],
  },
  bomb: {
    emoji: '💣',
    name: 'Bomb',
    colors: ['#FF4757', '#C44569'],
  },
  rainbow: {
    emoji: '🌈',
    name: 'Rainbow',
    colors: ['#5F27CD', '#341F97'],
  },
} as const;

export const PowerUp: React.FC<PowerUpProps> = ({
  type,
  count,
  active,
  onPress,
}) => {
  const { width } = useWindowDimensions();
  const config = POWER_UP_CONFIG[type];
  const isDisabled = count <= 0;

  // Responsive size: 3 power-ups side-by-side with margins
  const size = Math.min(90, (width - 32) / 3 - 8);

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          width: size,
          height: size,
        },
        active && styles.activeContainer,
        isDisabled && styles.disabledContainer,
      ]}
      onPress={onPress}
      activeOpacity={0.9}
      disabled={isDisabled}>
      <LinearGradient
        colors={isDisabled ? ['#9CA3AF', '#6B7280'] : config.colors}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}>
        <Text style={styles.emoji}>{config.emoji}</Text>
        <Text style={styles.name} numberOfLines={1}>
          {config.name}
        </Text>
        <View style={styles.countContainer}>
          <Text style={styles.count}>{count}</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 18,
    overflow: 'hidden',
    marginHorizontal: 4,
  },
  activeContainer: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.04 }],
  },
  disabledContainer: {
    opacity: 0.5,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  emoji: {
    fontSize: 26,
    marginBottom: 4,
  },
  name: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF',
    textAlign: 'center',
  },
  countContainer: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 10,
    minWidth: 22,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  count: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },
});
