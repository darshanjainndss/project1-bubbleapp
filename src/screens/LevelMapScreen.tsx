// src/screens/LevelMapScreen.tsx

import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { LevelNode } from '../components/LevelNode';
import { Level } from '../types/index';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type LevelMapScreenProps = StackScreenProps<RootStackParamList, 'LevelMap'>;

const generateLevels = (): Level[] => {
  const patterns: Level['pattern'][] = [
    'honeycomb',
    'pyramid',
    'star',
    'diamond',
    'zigzag',
    'circle',
  ];
  
  const levels: Level[] = [];
  for (let i = 1; i <= 100; i++) {
    levels.push({
      id: i,
      pattern: patterns[(i - 1) % patterns.length],
      colors: ['red', 'blue', 'green', 'yellow', 'purple'],
      targetScore: i * 1000,
      moves: 30 - Math.floor(i / 20),
      unlocked: true, // 🔓 ALL LEVELS UNLOCKED!
      completed: false,
      stars: 0,
    });
  }
  return levels;
};

export const LevelMapScreen: React.FC<LevelMapScreenProps> = ({
  navigation,
}) => {
  const [levels] = useState<Level[]>(generateLevels());

  const handleLevelPress = (level: Level) => {
    if (level.unlocked) {
      navigation.navigate('Game', { level });
    }
  };

  const renderPath = () => {
    const rows: React.ReactElement[] = [];
    let levelIndex = 0;

    for (let row = 0; row < 20; row++) {
      const isEvenRow = row % 2 === 0;
      const levelsInRow = 5;
      const rowLevels: React.ReactElement[] = [];

      for (let col = 0; col < levelsInRow; col++) {
        if (levelIndex < levels.length) {
          const level = levels[levelIndex];
          const position = isEvenRow ? col : levelsInRow - 1 - col;

          rowLevels[position] = (
            <LevelNode
              key={level.id}
              levelNumber={level.id}
              unlocked={level.unlocked}
              completed={level.completed}
              stars={level.stars}
              onPress={() => handleLevelPress(level)}
            />
          );
          levelIndex++;
        }
      }

      rows.push(
        <View key={row} style={styles.row}>
          {rowLevels}
        </View>
      );
    }

    return rows;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#4facfe', '#00f2fe']}
        style={styles.gradient}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Level Map</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '1%' }]} />
            </View>
            <Text style={styles.progressText}>1 / 100 Levels</Text>
          </View>

          <View style={styles.coinsContainer}>
            <Text style={styles.coinsText}>🪙 288</Text>
          </View>
        </View>

        {/* Level Map */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          
          {/* Top banner */}
          <View style={styles.banner}>
            <Text style={styles.bannerText}>🎯 COLLECT ITEMS</Text>
            <View style={styles.bannerProgress}>
              <View style={styles.bannerProgressBar}>
                <View style={styles.bannerProgressFill} />
              </View>
              <Text style={styles.bannerProgressText}>0/20</Text>
            </View>
            <Text style={styles.bannerReward}>🎁</Text>
          </View>

          {/* Path */}
          <View style={styles.pathContainer}>
            {renderPath()}
          </View>

          {/* Special offers */}
          <View style={styles.offersContainer}>
            <View style={[styles.offer, styles.offerLocked]}>
              <Text style={styles.offerEmoji}>🧪</Text>
              <Text style={styles.offerText}>LOCKED</Text>
              <Text style={styles.offerSubtext}>Unlock at lv.5</Text>
            </View>
            
            <View style={styles.offer}>
              <Text style={styles.offerEmoji}>💰</Text>
              <Text style={styles.offerText}>STARTER PACK</Text>
              <Text style={styles.offerTimer}>71:59:08</Text>
            </View>

            <View style={[styles.offer, styles.offerLocked]}>
              <Text style={styles.offerEmoji}>💸</Text>
              <Text style={styles.offerText}>LOCKED</Text>
              <Text style={styles.offerSubtext}>Unlock at lv.51</Text>
            </View>
          </View>
        </ScrollView>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    padding: 10,
  },
  backButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  progressBar: {
    width: 200,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
  },
  progressText: {
    color: '#FFF',
    fontSize: 12,
    marginTop: 4,
  },
  coinsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  coinsText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  banner: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    marginHorizontal: 20,
    marginVertical: 15,
    padding: 15,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#667eea',
  },
  bannerProgress: {
    flex: 1,
    marginHorizontal: 15,
  },
  bannerProgressBar: {
    height: 10,
    backgroundColor: '#E5E7EB',
    borderRadius: 5,
    overflow: 'hidden',
  },
  bannerProgressFill: {
    height: '100%',
    width: '0%',
    backgroundColor: '#10B981',
  },
  bannerProgressText: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 4,
  },
  bannerReward: {
    fontSize: 32,
  },
  pathContainer: {
    paddingHorizontal: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
  },
  offersContainer: {
    paddingHorizontal: 20,
    marginTop: 30,
    gap: 15,
  },
  offer: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 15,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  offerLocked: {
    backgroundColor: 'rgba(156, 163, 175, 0.2)',
    borderColor: 'rgba(156, 163, 175, 0.3)',
  },
  offerEmoji: {
    fontSize: 40,
  },
  offerText: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  offerSubtext: {
    fontSize: 12,
    color: '#FFF',
    opacity: 0.8,
  },
  offerTimer: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '600',
  },
});