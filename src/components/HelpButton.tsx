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
      activeOpacity={0.7}
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
            name="help-outline"
            family="material"
            size={22}
            color="#00E0FF"
          />
        </View>
      </Animated.View>
      <Text style={styles.helpLabel}>GUIDE</Text>
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(5, 15, 25, 0.9)',
    borderWidth: 2,
    borderColor: '#00E0FF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00E0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 10,
    marginBottom: 4,
  },
  iconContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(0, 224, 255, 0.15)',
  },
  helpLabel: {
    color: '#00E0FF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 224, 255, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
});

export default HelpButton;