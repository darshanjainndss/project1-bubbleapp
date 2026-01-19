import React, { useRef, useEffect } from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  Animated,
  StyleSheet,
} from 'react-native';
import MaterialIcon from './MaterialIcon';

interface HelpButtonProps {
  onPress: () => void;
}

const HelpButton: React.FC<HelpButtonProps> = ({ onPress }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulse animation
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1500,
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: false,
        }),
      ])
    );

    // Glow animation
    const glowAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    );

    pulseAnimation.start();
    glowAnimation.start();

    return () => {
      pulseAnimation.stop();
      glowAnimation.stop();
    };
  }, []);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.9],
  });

  const glowRadius = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [10, 20],
  });

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.6}
    >
      <Animated.View
        style={[
          styles.helpButton,
          {
            transform: [{ scale: pulseAnim }],
            shadowOpacity: glowOpacity,
            shadowRadius: glowRadius,
          },
        ]}
      >
        <View style={styles.iconContainer}>
          <MaterialIcon
            name="info"
            family="material"
            size={24}
            color="#00E0FF"
          />
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  helpButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(5, 15, 25, 0.95)',
    borderWidth: 1.5,
    borderColor: '#00E0FF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00E0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 15,
    elevation: 12,
  },
  iconContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(0, 224, 255, 0.12)',
  },
  helpLabel: {
    color: '#00E0FF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 224, 255, 0.9)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
    marginTop: 4,
  },
});

export default HelpButton;