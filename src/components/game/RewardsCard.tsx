import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import MaterialIcon from '../common/MaterialIcon';
import { GAME_ICONS, ICON_COLORS } from '../../config/icons';
import BackendService from '../../services/BackendService';
import LinearGradient from 'react-native-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface RewardsCardProps {
  onWithdrawPress: () => void;
  onRewardHistoryPress: () => void;
  onWithdrawHistoryPress: () => void;
  style?: any;
}

const RewardsCard: React.FC<RewardsCardProps> = ({
  onWithdrawPress,
  onRewardHistoryPress,
  onWithdrawHistoryPress,
  style,
}) => {
  const [claimedEarnings, setClaimedEarnings] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEarnings();
  }, []);

  const loadEarnings = async () => {
    try {
      setLoading(true);
      const result = await BackendService.getRewardHistoryOnly();
      if (result.success && result.history) {
        const total = result.history
          .filter(r => r.status === 'claimed')
          .reduce((sum, r) => sum + (r.reward || r.scoreEarning || 0), 0);
        setClaimedEarnings(total);
      }
    } catch (error) {
      console.error('Failed to load earnings for rewards card:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, style]}>
      {/* Compact Rewards Card */}
      {/* <LinearGradient
        colors={['rgba(0, 255, 136, 0.12)', 'rgba(0, 255, 136, 0.03)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.rewardsCard}
      >
        <View style={styles.cardRow}>
          <View style={styles.rewardInfo}>
            <View style={styles.iconContainer}>
              <MaterialIcon name="bolt" family="material" size={20} color="#FFD700" />
            </View>
            <View style={styles.rewardDetails}>
              {loading ? (
                <ActivityIndicator size="small" color="#00FF88" />
              ) : (
                <>
                  <Text style={styles.rewardAmount}>
                    {claimedEarnings.toLocaleString(undefined, {
                      minimumFractionDigits: 8,
                      maximumFractionDigits: 8
                    })} SHIB
                  </Text>
                  <Text style={styles.rewardLabel}>Available Rewards</Text>
                </>
              )}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.withdrawButton, (loading || claimedEarnings === 0) && styles.disabledButton]}
            onPress={onWithdrawPress}
            disabled={loading || claimedEarnings === 0}
          >
            <LinearGradient
              colors={['#FF8C00', '#FF4500']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.withdrawGradient}
            >
              <MaterialIcon name="account-balance-wallet" family="material" size={14} color="#FFF" />
              <Text style={styles.withdrawButtonText}>WITHDRAW</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient> */}

      {/* History Actions Row */}
      <View style={styles.historyRow}>
        <TouchableOpacity style={styles.historyButton} onPress={onRewardHistoryPress}>
          <MaterialIcon name="history" family="material" size={16} color="#FFD700" />
          <Text style={styles.historyButtonText}>Rewards</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.historyButton} onPress={onWithdrawHistoryPress}>
          <MaterialIcon name="receipt-long" family="material" size={16} color="#00E0FF" />
          <Text style={styles.historyButtonText}>Withdrawals</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  rewardsCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 136, 0.2)',
    padding: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  cardRow: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 16,
  },
  rewardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  rewardDetails: {
    flex: 1,
  },
  rewardAmount: {
    fontSize: SCREEN_WIDTH > 380 ? 16 : 14,
    fontWeight: '900',
    color: '#00FF88',
    fontFamily: 'monospace',
  },
  rewardLabel: {
    fontSize: SCREEN_WIDTH > 380 ? 10 : 9,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '700',
  },
  withdrawButton: {
    borderRadius: 12,
    overflow: 'hidden',
    width: '100%',
    elevation: 4,
    shadowColor: '#FF4500',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  withdrawGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 8,
  },
  disabledButton: {
    opacity: 0.5,
    elevation: 0,
  },
  withdrawButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  historyRow: {
    flexDirection: 'row',
    gap: 10,
  },
  historyButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  historyButtonText: {
    color: '#FFF',
    fontSize: SCREEN_WIDTH > 380 ? 13 : 11,
    fontWeight: '700',
  },
});

export default RewardsCard;