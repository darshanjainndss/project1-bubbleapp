import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ScrollView,
  SafeAreaView,
  Animated,
  Dimensions,
  StatusBar,
  RefreshControl,
} from 'react-native';
import MaterialIcon from './MaterialIcon';
import SpaceBackground from './SpaceBackground';
import { GAME_ICONS, ICON_COLORS, ICON_SIZES } from '../config/icons';
import BackendService from '../services/BackendService';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

interface LeaderboardEntry {
  userId: string;
  displayName: string;
  profilePicture?: string;
  highScore: number;
  totalScore: number;
  gamesWon: number;
  rank: number;
}

interface UserGameData {
  userId: string;
  totalScore: number;
  highScore: number;
  totalCoins: number;
  currentLevel: number;
  gamesPlayed: number;
  gamesWon: number;
  abilities: {
    lightning: number;
    bomb: number;
    freeze: number;
    fire: number;
  };
  achievements: string[];
  completedLevels: number[];
  levelStars: Record<number, number>;
  lastPlayedAt: string;
  rank?: number;
}

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
  const { user } = useAuth();
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [userGameData, setUserGameData] = useState<UserGameData | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [fadeAnim] = useState(new Animated.Value(0));

  // Get current user ID from backend service (MongoDB ObjectId)
  const getCurrentUserId = () => {
    const backendUser = BackendService.getCurrentUser();
    return backendUser?.id || userId;
  };

  const loadData = useCallback(async (isRefresh = false) => {
    if (!isVisible) return;

    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    setError(null);

    try {
      if (user) {
        await BackendService.ensureAuthenticated(user);
      }

      const limit = 1000;
      const leaderboardResult = await BackendService.getLeaderboard(limit);

      if (leaderboardResult.success && leaderboardResult.leaderboard) {
        let data = [...leaderboardResult.leaderboard];
        const currentUserId = getCurrentUserId();

        if (currentUserId && currentUserScore > 0) {
          const userIndex = data.findIndex(entry => entry.userId === currentUserId);
          if (userIndex !== -1) {
            if (currentUserScore > data[userIndex].totalScore) {
              data[userIndex] = { ...data[userIndex], totalScore: currentUserScore };
            }
          } else {
            // Get user email for display name
            const userEmail = user?.email || 'User';
            const displayName = userEmail.split('@')[0];
            
            data.push({
              userId: currentUserId,
              displayName: displayName,
              totalScore: currentUserScore,
              highScore: currentUserScore,
              gamesWon: 0,
              rank: 999
            });
          }
          data.sort((a, b) => b.totalScore - a.totalScore);
          data = data.map((entry, index) => ({
            ...entry,
            rank: index + 1
          }));
        }
        
        setLeaderboardData(data);
        setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      } else {
        setError(leaderboardResult.error || 'Failed to sync with galactic servers');
      }

      if (BackendService.isAuthenticated()) {
        const userDataResult = await BackendService.getUserGameData();
        if (userDataResult.success && userDataResult.data) {
          setUserGameData(userDataResult.data);
        }
      }
    } catch (error) {
      setError('Communication link failure');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isVisible, user, userId, currentUserScore]);

  useEffect(() => {
    if (isVisible) {
      loadData();
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [isVisible, loadData]);

  const onRefresh = () => loadData(true);

  const getRankStyle = (rank: number) => {
    if (rank === 1) return { color: '#FFD700', icon: 'military-tech', label: 'CHAMPION' };
    if (rank === 2) return { color: '#C0C0C0', icon: 'emoji-events', label: 'ELITE' };
    if (rank === 3) return { color: '#CD7F32', icon: 'emoji-events', label: 'PRO' };
    return { color: '#00E0FF', icon: 'person', label: 'EXPLORER' };
  };

  const renderLeaderboardItem = ({ item }: { item: LeaderboardEntry }) => {
    const { color, icon } = getRankStyle(item.rank);
    const currentUserId = getCurrentUserId();
    const isCurrentUser = item.userId === currentUserId;

    return (
      <View style={[
        styles.itemContainer,
        isCurrentUser && styles.currentUserItem
      ]}>
        <View style={styles.rankBadge}>
          <Text style={[styles.rankNumber, { color }]}>{item.rank}</Text>
        </View>

        <View style={styles.userInfo}>
          <Text style={[styles.userName, isCurrentUser && { color: '#00FF88' }]} numberOfLines={1}>
            {isCurrentUser ? 'YOU' : item.displayName.toUpperCase()}
          </Text>
        </View>

        <View style={styles.scoreInfo}>
          <Text style={[styles.totalScoreText, { color: isCurrentUser ? '#00FF88' : '#FFF' }]}>
            {item.totalScore.toLocaleString()}
          </Text>
          <Text style={styles.ptsText}>PTS</Text>
        </View>
      </View>
    );
  };

  // Removed TopThreePodium for simplified UI

  if (!isVisible) return null;

  return (
    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={onClose}>
              <MaterialIcon name="arrow-back-ios" family="material" size={20} color="#FFF" />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>GALACTIC RANKINGS</Text>
              <Text style={styles.headerSubtitle}>
                GLOBAL LEADERBOARD {lastUpdated ? `• ${lastUpdated}` : ''}
              </Text>
            </View>
            <TouchableOpacity style={styles.refreshBtn} onPress={() => loadData()}>
              <MaterialIcon name="refresh" family="material" size={24} color="#00E0FF" />
            </TouchableOpacity>
          </View>

          {/* User Summary Card */}
          {userGameData && (
            <View style={styles.userSummaryCard}>
              <View style={styles.userMainInfo}>
                <View style={styles.userAvatar}>
                  <MaterialIcon name="account-circle" family="material" size={60} color="#00FF88" />
                  <View style={styles.levelBadge}>
                    <Text style={styles.levelBadgeText}>{userGameData.currentLevel}</Text>
                  </View>
                </View>
                <View style={styles.userTexts}>
                  <Text style={styles.greeting}>{(user?.email || 'User').split('@')[0]}</Text>
                  <View style={styles.rankRow}>
                    <Text style={styles.rankLabel}>CURRENT RANK</Text>
                    <Text style={styles.rankValue}>#{userGameData.rank || '---'}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.userStatsGrid}>
                <View style={styles.userGridItem}>
                  <Text style={styles.gridLabel}>TOTAL SCORE</Text>
                  <Text style={styles.gridValue}>{userGameData.totalScore.toLocaleString()}</Text>
                </View>
                <View style={styles.userGridItem}>
                  <Text style={styles.gridLabel}>WINS</Text>
                  <Text style={styles.gridValue}>{userGameData.gamesWon}</Text>
                </View>
                <View style={styles.userGridItem}>
                  <Text style={styles.gridLabel}>COINS</Text>
                  <Text style={[styles.gridValue, { color: '#FFD700' }]}>{userGameData.totalCoins}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Leaderboard List */}
          {loading ? (
            <View style={styles.centered}>
              <Animated.View style={styles.loadingPulse}>
                <MaterialIcon name="rocket-launch" family="material" size={50} color="#00E0FF" />
              </Animated.View>
              <Text style={styles.loadingText}>SYNCING WITH SPACE COMMAND...</Text>
            </View>
          ) : error ? (
            <View style={styles.centered}>
              <MaterialIcon name="error-outline" family="material" size={60} color="#FF6B6B" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={() => loadData()}>
                <Text style={styles.retryText}>RETRY LINK</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={leaderboardData}
              renderItem={renderLeaderboardItem}
              keyExtractor={(item) => item.userId}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor="#00E0FF"
                  colors={["#00E0FF"]}
                />
              }
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </SafeAreaView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#05050A',
    zIndex: 2000,
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 15,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    marginTop: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 5,
  },
  headerTitleContainer: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 2,
  },
  headerSubtitle: {
    color: '#00E0FF',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 3,
    marginTop: 2,
  },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 224, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // User Card
  userSummaryCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 16,
  },
  userMainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  userAvatar: {
    position: 'relative',
    marginRight: 15,
  },
  levelBadge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: '#00E0FF',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 2,
    borderColor: '#05050A',
  },
  levelBadgeText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '900',
  },
  userTexts: {
    flex: 1,
  },
  greeting: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankLabel: {
    color: '#888',
    fontSize: 10,
    fontWeight: 'bold',
    marginRight: 8,
  },
  rankValue: {
    color: '#00FF88',
    fontSize: 14,
    fontWeight: '900',
    fontFamily: 'monospace',
  },
  userStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    paddingTop: 15,
  },
  userGridItem: {
    alignItems: 'center',
    flex: 1,
  },
  gridLabel: {
    color: '#666',
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  gridValue: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
    fontFamily: 'monospace',
  },

  // Podium styles removed as component was removed

  // List Items
  listContent: {
    paddingBottom: 30,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  currentUserItem: {
    backgroundColor: 'rgba(0, 255, 136, 0.12)',
    borderColor: 'rgba(0, 255, 136, 0.4)',
    borderWidth: 2,
  },
  rankBadge: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 25,
  },
  rankNumber: {
    fontSize: 18,
    fontWeight: '900',
    fontFamily: 'monospace',
    color: '#FFF',
  },
  userInfo: {
    flex: 1,
    paddingHorizontal: 5,
  },
  userName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  scoreInfo: {
    alignItems: 'flex-end',
    minWidth: 100,
  },
  totalScoreText: {
    fontSize: 20,
    fontWeight: '900',
    fontFamily: 'monospace',
    color: '#FFF',
  },
  ptsText: {
    color: '#888',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginTop: 2,
  },

  // States
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  loadingPulse: {
    marginBottom: 20,
    opacity: 0.8,
  },
  loadingText: {
    color: '#00E0FF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 3,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    paddingHorizontal: 40,
  },
  retryBtn: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderWidth: 1,
    borderColor: '#FF6B6B',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryText: {
    color: '#FF6B6B',
    fontWeight: 'bold',
    letterSpacing: 2,
  }
});

export default Leaderboard;