import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ScrollView,
} from 'react-native';
import MaterialIcon from './MaterialIcon';
import { GAME_ICONS, ICON_COLORS, ICON_SIZES } from '../config/icons';
import BackendService from '../services/BackendService';
import { useAuth } from '../context/AuthContext';

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
  const { user } = useAuth(); // Get Firebase user
  // Dummy data for testing/fallback
  const dummyLeaderboardData: LeaderboardEntry[] = [
    {
      userId: 'dummy1',
      displayName: 'Charlie Pro',
      highScore: 3000,
      totalScore: 18000,
      gamesWon: 12,
      rank: 1,
    },
    {
      userId: 'dummy2',
      displayName: 'Alice Champion',
      highScore: 2500,
      totalScore: 15000,
      gamesWon: 8,
      rank: 2,
    },
    {
      userId: 'dummy3',
      displayName: 'Bob Master',
      highScore: 2200,
      totalScore: 12000,
      gamesWon: 6,
      rank: 3,
    },
    {
      userId: 'dummy4',
      displayName: 'Diana Expert',
      highScore: 1800,
      totalScore: 9000,
      gamesWon: 5,
      rank: 4,
    },
    {
      userId: 'dummy5',
      displayName: 'Eve Rookie',
      highScore: 1200,
      totalScore: 5000,
      gamesWon: 3,
      rank: 5,
    },
  ];

  // Dummy user game data
  const dummyUserGameData: UserGameData = {
    userId: 'current-user',
    totalScore: 850,
    highScore: 850,
    totalCoins: 150,
    currentLevel: 2,
    gamesPlayed: 3,
    gamesWon: 2,
    abilities: {
      lightning: 2,
      bomb: 2,
      freeze: 2,
      fire: 2,
    },
    achievements: [],
    lastPlayedAt: new Date().toISOString(),
    rank: 6,
  };

  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>(dummyLeaderboardData);
  const [userGameData, setUserGameData] = useState<UserGameData | null>(dummyUserGameData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load leaderboard data and user game data from backend
  useEffect(() => {
    const loadData = async () => {
      if (isVisible) {
        setLoading(true);
        setError(null);
        
        try {
          console.log('🔍 Loading leaderboard data...');
          
          // Load leaderboard data (public endpoint, no auth required)
          const leaderboardResult = await BackendService.getLeaderboard(50);
          console.log('📊 Leaderboard result:', leaderboardResult);
          
          if (leaderboardResult.success && leaderboardResult.leaderboard && leaderboardResult.leaderboard.length > 0) {
            console.log('✅ Leaderboard data loaded:', leaderboardResult.leaderboard.length, 'entries');
            let leaderboard = leaderboardResult.leaderboard;
            
            // If user is authenticated but not in leaderboard, add them
            if (user && userGameData && !leaderboard.find(entry => entry.userId === user.uid)) {
              const userEntry: LeaderboardEntry = {
                userId: user.uid,
                displayName: user.displayName || user.email || 'You',
                highScore: userGameData.highScore,
                totalScore: userGameData.totalScore,
                gamesWon: userGameData.gamesWon,
                rank: leaderboard.length + 1,
              };
              leaderboard = [...leaderboard, userEntry];
            }
            
            setLeaderboardData(leaderboard);
          } else {
            console.log('⚠️ No backend data, using dummy data');
            let dummyData = [...dummyLeaderboardData];
            
            // Add current user to dummy data if authenticated
            if (user && userGameData) {
              const userEntry: LeaderboardEntry = {
                userId: user.uid,
                displayName: user.displayName || user.email || 'You',
                highScore: userGameData.highScore,
                totalScore: userGameData.totalScore,
                gamesWon: userGameData.gamesWon,
                rank: dummyData.length + 1,
              };
              dummyData = [...dummyData, userEntry];
            }
            
            setLeaderboardData(dummyData);
          }

          // Load user game data (requires authentication)
          if (BackendService.isAuthenticated()) {
            console.log('🔍 Loading user game data...');
            const userDataResult = await BackendService.getUserGameData();
            console.log('👤 User data result:', userDataResult);
            
            if (userDataResult.success && userDataResult.data) {
              console.log('✅ User game data loaded:', userDataResult.data);
              setUserGameData(userDataResult.data);
            } else {
              console.log('⚠️ No user data, using dummy data');
              setUserGameData(dummyUserGameData);
            }
          } else {
            console.log('⚠️ User not authenticated, using dummy data');
            // If we have a Firebase user, create personalized dummy data
            if (user) {
              const personalizedData = {
                ...dummyUserGameData,
                userId: user.uid,
                displayName: user.displayName || user.email || 'You',
              };
              setUserGameData(personalizedData);
            } else {
              setUserGameData(dummyUserGameData);
            }
          }
        } catch (error) {
          console.error('💥 Error loading data:', error);
          console.log('🔄 Falling back to dummy data');
          
          let dummyData = [...dummyLeaderboardData];
          let userData = { ...dummyUserGameData };
          
          // Personalize dummy data if user is authenticated
          if (user) {
            userData = {
              ...dummyUserGameData,
              userId: user.uid,
            };
            
            const userEntry: LeaderboardEntry = {
              userId: user.uid,
              displayName: user.displayName || user.email || 'You',
              highScore: userData.highScore,
              totalScore: userData.totalScore,
              gamesWon: userData.gamesWon,
              rank: dummyData.length + 1,
            };
            dummyData = [...dummyData, userEntry];
          }
          
          setLeaderboardData(dummyData);
          setUserGameData(userData);
        } finally {
          setLoading(false);
        }
      }
    };

    if (isVisible) {
      loadData();
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

  const renderLeaderboardItem = ({ item }: { item: LeaderboardEntry }) => {
    const rankColor = getRankColor(item.rank);
    const rankIcon = getRankIcon(item.rank);
    const isTopThree = item.rank <= 3;
    const isCurrentUser = item.userId === (user?.uid || userId); // Use Firebase UID

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
            {isCurrentUser ? 'You' : item.displayName}
          </Text>
          <View style={styles.playerStats}>
            <View style={styles.statItem}>
              <Text style={styles.levelText}>Games Won: {item.gamesWon}</Text>
            </View>
            {item.totalScore && (
              <View style={styles.statItem}>
                <Text style={styles.statText}>Total: {item.totalScore.toLocaleString()}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Score Section - Main focus */}
        <View style={styles.scoreSection}>
          <Text style={[styles.scoreText, { color: rankColor }]}>
            {item.highScore.toLocaleString()}
          </Text>
          <Text style={styles.scoreLabel}>HIGH SCORE</Text>
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

        {/* Current User Score and Abilities */}
        <View style={styles.currentUserSection}>
          <MaterialIcon
            name="person"
            family="material"
            size={ICON_SIZES.MEDIUM}
            color={ICON_COLORS.SUCCESS}
          />
          <View style={styles.currentUserInfo}>
            <Text style={styles.currentUserText}>
              Your Score: {userGameData?.highScore?.toLocaleString() || currentUserScore.toLocaleString()}
            </Text>
            {userGameData && (
              <View style={styles.userStatsRow}>
                <Text style={styles.userStatText}>Rank: #{userGameData.rank || 'Unranked'}</Text>
                <Text style={styles.userStatText}>Games Won: {userGameData.gamesWon}</Text>
                <Text style={styles.userStatText}>Level: {userGameData.currentLevel}</Text>
              </View>
            )}
            {userGameData && (
              <View style={styles.userAbilities}>
                <Text style={styles.abilitiesTitle}>Abilities:</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.abilitiesScrollContent}
                >
                  <View style={styles.abilitiesRow}>
                    <View style={styles.abilityItem}>
                      <MaterialIcon name="flash-on" family="material" size={16} color="#FFD700" />
                      <Text style={styles.abilityCount}>{userGameData.abilities.lightning}</Text>
                    </View>
                    <View style={styles.abilityItem}>
                      <MaterialIcon name="whatshot" family="material" size={16} color="#FF4500" />
                      <Text style={styles.abilityCount}>{userGameData.abilities.bomb}</Text>
                    </View>
                    <View style={styles.abilityItem}>
                      <MaterialIcon name="ac-unit" family="material" size={16} color="#00BFFF" />
                      <Text style={styles.abilityCount}>{userGameData.abilities.freeze}</Text>
                    </View>
                    <View style={styles.abilityItem}>
                      <MaterialIcon name="local-fire-department" family="material" size={16} color="#FF6347" />
                      <Text style={styles.abilityCount}>{userGameData.abilities.fire}</Text>
                    </View>
                  </View>
                </ScrollView>
                <Text style={styles.coinsText}>Coins: {userGameData.totalCoins}</Text>
              </View>
            )}
          </View>
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
        ) : error ? (
          <View style={styles.errorContainer}>
            <MaterialIcon
              name="error"
              family="material"
              size={ICON_SIZES.LARGE}
              color={ICON_COLORS.ERROR}
            />
            <Text style={styles.errorText}>Failed to load leaderboard</Text>
            <Text style={styles.errorSubtext}>{error}</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => {
                if (isVisible) {
                  setError(null);
                  // Trigger reload by toggling loading state
                  setLoading(true);
                  setTimeout(() => setLoading(false), 100);
                }
              }}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={leaderboardData}
            renderItem={renderLeaderboardItem}
            keyExtractor={(item, index) => item.userId || `leaderboard-${index}`}
            style={styles.leaderboardList}
            contentContainerStyle={styles.leaderboardListContent}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
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
    width: '92%',
    backgroundColor: 'rgba(5, 5, 10, 0.98)',
    borderTopLeftRadius: 40,
    borderBottomRightRadius: 40,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 10,
    borderWidth: 2,
    borderColor: '#00E0FF',
    paddingHorizontal: 12,
    paddingVertical: 14,
    shadowColor: '#00E0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 25,
    elevation: 15,
    overflow: 'hidden',
    maxHeight: 600, // Ensure modal doesn't take full screen
  },
  
  // Header (same as roadmap header)
  leaderboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 15,
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  leaderboardTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 2,
    lineHeight: 24,
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

  // Current User Section (roadmap card style)
  currentUserSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 15,
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 136, 0.3)',
    gap: 12,
  },
  currentUserInfo: {
    flex: 1,
  },
  currentUserText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00FF88',
    marginBottom: 8,
  },
  userStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 5,
  },
  userStatText: {
    fontSize: 12,
    color: '#00E0FF',
    fontWeight: 'bold',
  },
  userAbilities: {
    gap: 8,
  },
  abilitiesScrollContent: {
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  abilitiesTitle: {
    fontSize: 12,
    color: '#aaa',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  abilitiesRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
    alignItems: 'center',
  },
  abilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: 4,
    minWidth: 50,
  },
  abilityCount: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  coinsText: {
    fontSize: 12,
    color: '#FFD700',
    fontWeight: '700',
    fontFamily: 'monospace',
  },

  // Leaderboard List
  leaderboardList: {
    flex: 1,
    maxHeight: 350, // Limit height to ensure scrolling works
  },
  leaderboardListContent: {
    paddingBottom: 10,
    flexGrow: 1,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  topThreeItem: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderColor: 'rgba(255, 215, 0, 0.4)',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  currentUserItem: {
    backgroundColor: 'rgba(0, 255, 136, 0.15)',
    borderColor: 'rgba(0, 255, 136, 0.4)',
    shadowColor: '#00FF88',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
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
    minHeight: 200,
  },
  loadingText: {
    fontSize: 16,
    color: '#aaa',
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    minHeight: 200,
  },
  errorText: {
    fontSize: 18,
    color: '#FF6B6B',
    fontWeight: 'bold',
    marginTop: 15,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 5,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  retryButton: {
    marginTop: 15,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(0, 224, 255, 0.2)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 224, 255, 0.5)',
  },
  retryButtonText: {
    color: '#00E0FF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    minHeight: 200,
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