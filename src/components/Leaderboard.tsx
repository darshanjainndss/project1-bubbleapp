import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
} from 'react-native';
import MaterialIcon from './MaterialIcon';
import { GAME_ICONS, ICON_COLORS, ICON_SIZES } from '../config/icons';
import StorageService, { LeaderboardEntry } from '../services/StorageService';

interface LeaderboardProps {
  isVisible: boolean;
  onClose: () => void;
  currentUserScore?: number;
  userId?: string;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ 
  isVisible, 
  onClose, 
  currentUserScore = 0,
  userId 
}) => {
  const [leaderboardData, setLeaderboardData] = useState<(LeaderboardEntry & { rank: number })[]>([]);
  const [loading, setLoading] = useState(false);

  // Load leaderboard data - internal loading only
  useEffect(() => {
    const loadLeaderboard = async () => {
      if (isVisible) {
        setLoading(true);
        try {
          const data = await StorageService.getLeaderboard();
          // Add rank to each entry and sort by score only
          const rankedData: (LeaderboardEntry & { rank: number })[] = data
            .sort((a, b) => b.score - a.score) // Sort by score descending
            .map((entry, index) => ({
              ...entry,
              rank: index + 1,
            }));
          setLeaderboardData(rankedData);
        } catch (error) {
          console.error('Error loading leaderboard:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    // Small delay to prevent immediate loading flash
    if (isVisible) {
      setTimeout(loadLeaderboard, 100);
    }
  }, [isVisible]);

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return '#FFD700'; // Gold
      case 2: return '#C0C0C0'; // Silver  
      case 3: return '#CD7F32'; // Bronze
      default: return '#00E0FF'; // Cyan
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return { name: 'emoji-events', family: 'material' as const }; // Gold trophy
      case 2: return { name: 'emoji-events', family: 'material' as const }; // Silver trophy  
      case 3: return { name: 'emoji-events', family: 'material' as const }; // Bronze trophy
      default: return { name: 'person', family: 'material' as const };
    }
  };

  const renderLeaderboardItem = ({ item }: { item: LeaderboardEntry & { rank: number } }) => {
    const rankColor = getRankColor(item.rank);
    const rankIcon = getRankIcon(item.rank);
    const isTopThree = item.rank <= 3;
    const isCurrentUser = item.userId === userId;

    return (
      <View style={[
        styles.leaderboardItem, 
        isTopThree && styles.topThreeItem,
        isCurrentUser && styles.currentUserItem
      ]}>
        {/* Rank Section */}
        <View style={[styles.rankSection, { borderColor: rankColor }]}>
          <MaterialIcon
            name={rankIcon.name}
            family={rankIcon.family}
            size={isTopThree ? ICON_SIZES.LARGE : ICON_SIZES.MEDIUM}
            color={rankColor}
          />
          <Text style={[styles.rankText, { color: rankColor }]}>#{item.rank}</Text>
        </View>

        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarPlaceholder}>
            <MaterialIcon
              name="person"
              family="material"
              size={ICON_SIZES.LARGE}
              color={isCurrentUser ? ICON_COLORS.SUCCESS : ICON_COLORS.SECONDARY}
            />
          </View>
        </View>

        {/* Player Info Section */}
        <View style={styles.playerInfoSection}>
          <Text style={[styles.username, isCurrentUser && { color: '#00FF88' }]}>
            {isCurrentUser ? 'You' : item.username}
          </Text>
          <View style={styles.playerStats}>
            <View style={styles.statItem}>
              <Text style={styles.levelText}>Level {item.level}</Text>
            </View>
          </View>
        </View>

        {/* Score Section - Main focus */}
        <View style={styles.scoreSection}>
          <Text style={[styles.scoreText, { color: rankColor }]}>
            {item.score.toLocaleString()}
          </Text>
          <Text style={styles.scoreLabel}>SCORE</Text>
        </View>
      </View>
    );
  };

  if (!isVisible) return null;

  return (
    <View style={styles.leaderboardOverlay}>
      <View style={styles.leaderboardModal}>
        {/* Header */}
        <View style={styles.leaderboardHeader}>
          <Text style={styles.leaderboardTitle}>LEADERBOARD</Text>
          <TouchableOpacity style={styles.leaderboardCloseBtn} onPress={onClose}>
            <MaterialIcon
              name={GAME_ICONS.CLOSE.name}
              family={GAME_ICONS.CLOSE.family}
              size={ICON_SIZES.MEDIUM}
              color={ICON_COLORS.WHITE}
            />
          </TouchableOpacity>
        </View>

        {/* Current User Score */}
        <View style={styles.currentUserSection}>
          <MaterialIcon
            name="person"
            family="material"
            size={ICON_SIZES.MEDIUM}
            color={ICON_COLORS.SUCCESS}
          />
          <Text style={styles.currentUserText}>Your Score: {currentUserScore.toLocaleString()}</Text>
        </View>

        {/* Leaderboard List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <MaterialIcon
              name="refresh"
              family="material"
              size={ICON_SIZES.LARGE}
              color={ICON_COLORS.PRIMARY}
            />
            <Text style={styles.loadingText}>Loading leaderboard...</Text>
          </View>
        ) : (
          <FlatList
            data={leaderboardData}
            renderItem={renderLeaderboardItem}
            keyExtractor={(item) => item.userId}
            style={styles.leaderboardList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialIcon
                  name="leaderboard"
                  family="material"
                  size={ICON_SIZES.XLARGE}
                  color={ICON_COLORS.DISABLED}
                />
                <Text style={styles.emptyText}>No players yet!</Text>
                <Text style={styles.emptySubtext}>Be the first to set a score!</Text>
              </View>
            }
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Modal Overlay (same as shop)
  leaderboardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  leaderboardModal: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: 'rgba(20, 20, 30, 0.95)',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#00E0FF',
    padding: 20,
  },
  
  // Header (same as shop)
  leaderboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  leaderboardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1,
  },
  leaderboardCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.5)',
  },

  // Current User Section
  currentUserSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    padding: 10,
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 136, 0.3)',
    gap: 8,
  },
  currentUserText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00FF88',
  },

  // Leaderboard List
  leaderboardList: {
    flex: 1,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  topThreeItem: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  currentUserItem: {
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    borderColor: 'rgba(0, 255, 136, 0.3)',
  },

  // Rank Section
  rankSection: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    marginRight: 15,
    borderRightWidth: 1,
    paddingRight: 15,
  },
  rankText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 2,
  },

  // Avatar Section
  avatarSection: {
    marginRight: 15,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },

  // Player Info Section
  playerInfoSection: {
    flex: 1,
    marginRight: 15,
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  playerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#FFD700',
    fontWeight: 'bold',
  },
  levelText: {
    fontSize: 12,
    color: '#00E0FF',
    fontWeight: 'bold',
  },

  // Score Section
  scoreSection: {
    alignItems: 'flex-end',
  },
  scoreText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  scoreLabel: {
    fontSize: 10,
    color: '#aaa',
    fontWeight: 'bold',
    letterSpacing: 1,
  },

  // Loading and Empty States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#aaa',
    marginTop: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 5,
  },
});

export default Leaderboard;