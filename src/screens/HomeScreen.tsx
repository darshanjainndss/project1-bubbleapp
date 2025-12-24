// src/screens/HomeScreen.tsx

import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
  Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type HomeScreenProps = StackScreenProps<RootStackParamList, 'Home'>;

const BubbleAnimation: React.FC<{
  style: any;
  emoji: string;
  delay: number;
  duration: number;
}> = ({ style, emoji, delay, duration }) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const floatAnim = React.useRef(new Animated.Value(0)).current;
  const rotateAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const startAnimations = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.1,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: duration,
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, {
            toValue: 1,
            duration: duration * 1.5,
            useNativeDriver: true,
          }),
          Animated.timing(floatAnim, {
            toValue: 0,
            duration: duration * 1.5,
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: duration * 5,
          useNativeDriver: true,
        }),
        { iterations: -1 }
      ).start();
    };

    setTimeout(startAnimations, delay);
  }, []);

  const translateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -20],
  });

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        style,
        {
          transform: [
            { scale: scaleAnim },
            { translateY: translateY },
            { rotate: rotate },
          ],
        },
      ]}>
      <Text style={styles.bubbleEmoji}>{emoji}</Text>
    </Animated.View>
  );
};


export const HomeScreen: React.FC<HomeScreenProps> = ({
  navigation,
}) => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb']}
        style={styles.gradient}>
        
        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>🎯</Text>
          <Text style={styles.titleText}>Bubble</Text>
          <Text style={styles.titleText}>Shooter</Text>
        </View>

        {/* Animated bubbles decoration */}
        <View style={styles.bubblesContainer}>
          <BubbleAnimation style={[styles.bubble, styles.bubble1]} emoji="🔴" delay={0} duration={1000} />
          <BubbleAnimation style={[styles.bubble, styles.bubble2]} emoji="🔵" delay={500} duration={1200} />
          <BubbleAnimation style={[styles.bubble, styles.bubble3]} emoji="🟢" delay={200} duration={900} />
          <BubbleAnimation style={[styles.bubble, styles.bubble4]} emoji="🟡" delay={800} duration={1100} />
        </View>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.playButton}
            onPress={() => navigation.navigate('LevelMap')}>
            <LinearGradient
              colors={['#10B981', '#059669']}
              style={styles.buttonGradient}>
              <Text style={styles.playButtonText}>START</Text>
              <Text style={styles.playButtonIcon}>▶️</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.secondaryButtons}>
            <TouchableOpacity style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>⚙️ Settings</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>🏆 Leaderboard</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>1</Text>
            <Text style={styles.statLabel}>Level</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Stars</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>High Score</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 60,
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  title: {
    fontSize: 80,
    marginBottom: 10,
  },
  titleText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
  },
  bubblesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bubble: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  bubble1: { top: 50, left: 30 },
  bubble2: { top: 100, right: 30 },
  bubble3: { bottom: 150, left: 50 },
  bubble4: { bottom: 100, right: 60 },
  bubbleEmoji: {
    fontSize: 40,
  },
  buttonContainer: {
    paddingHorizontal: 40,
    gap: 20,
  },
  playButton: {
    height: 70,
    borderRadius: 35,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  playButtonText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    letterSpacing: 2,
  },
  playButtonIcon: {
    fontSize: 28,
  },
  secondaryButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  secondaryButton: {
    flex: 1,
    height: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  secondaryButtonText: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  statBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 15,
    minWidth: 90,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#FFF',
    marginTop: 5,
    opacity: 0.9,
  },
});
