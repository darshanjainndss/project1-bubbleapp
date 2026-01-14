import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import MaterialIcon from './MaterialIcon';
import { GAME_ICONS, ICON_COLORS } from '../config/icons';
import BackendService from '../services/BackendService';

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
      <View style={styles.rewardsCard}>
        <View style={styles.cardRow}>
          <View style={styles.rewardInfo}>
            <View style={styles.iconContainer}>
              <MaterialIcon name="bolt" family="material" size={18} color="#ff9900ff" />
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
            style={styles.withdrawButton} 
            onPress={onWithdrawPress}
            disabled={loading || claimedEarnings === 0}
          >
            <MaterialIcon name="account-balance-wallet" family="material" size={16} color="#FFF" />
            <Text style={styles.withdrawButtonText}>WITHDRAW</Text>
          </TouchableOpacity>
        </View>
      </View>

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
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 136, 0.2)',
    padding: 12,
    marginBottom: 10,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rewardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 153, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  rewardDetails: {
    flex: 1,
  },
  rewardAmount: {
    fontSize: SCREEN_WIDTH > 380 ? 14 : 12,
    fontWeight: '700',
    color: '#00FF88',
    fontFamily: 'monospace',
  },
  rewardLabel: {
    fontSize: SCREEN_WIDTH > 380 ? 11 : 10,
    color: '#64748B',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  withdrawButton: {
    backgroundColor: '#FF6B35',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginLeft: 8,
  },
  withdrawButtonText: {
    color: '#FFF',
    fontSize: SCREEN_WIDTH > 380 ? 12 : 11,
    fontWeight: '700',
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  historyRow: {
    flexDirection: 'row',
    gap: 6,
  },
  historyButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyButtonText: {
    color: '#FFF',
    fontSize: SCREEN_WIDTH > 380 ? 12 : 11,
    fontWeight: '600',
    marginLeft: 6,
  },
});

export default RewardsCard;