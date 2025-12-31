import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, View, StyleSheet, Alert } from 'react-native';
import { RewardedAd, AdEventType, RewardedAdEventType, TestIds } from 'react-native-google-mobile-ads';
import MaterialIcon from './MaterialIcon';
import { ADMOB_CONFIG } from '../config/admob';
import { GAME_ICONS, ICON_COLORS, ICON_SIZES } from '../config/icons';

interface RewardedAdButtonProps {
  onReward: (amount: number) => void;
  rewardAmount?: number;
  style?: any;
  disabled?: boolean;
}

const RewardedAdButton: React.FC<RewardedAdButtonProps> = ({
  onReward,
  rewardAmount = 50,
  style,
  disabled = false
}) => {
  const [rewardedAd, setRewardedAd] = useState<RewardedAd | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const ad = RewardedAd.createForAdRequest(ADMOB_CONFIG.REWARDED_AD_UNIT_ID, {
      requestNonPersonalizedAdsOnly: true,
    });

    const unsubscribeLoaded = ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
      console.log('✅ Rewarded ad loaded');
      setIsLoaded(true);
      setIsLoading(false);
    });

    const unsubscribeEarned = ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (reward) => {
      console.log('🎉 User earned reward:', reward);
      onReward(rewardAmount);
    });

    const unsubscribeClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
      console.log('📱 Rewarded ad closed');
      // Load a new ad for next time
      loadAd();
    });

    const unsubscribeError = ad.addAdEventListener(AdEventType.ERROR, (error) => {
      console.log('❌ Rewarded ad error:', error);
      setIsLoading(false);
      setIsLoaded(false);
    });

    setRewardedAd(ad);
    loadAd();

    return () => {
      unsubscribeLoaded();
      unsubscribeEarned();
      unsubscribeClosed();
      unsubscribeError();
    };
  }, []);

  const loadAd = () => {
    if (rewardedAd) {
      setIsLoading(true);
      setIsLoaded(false);
      rewardedAd.load();
    }
  };

  const showAd = () => {
    if (rewardedAd && isLoaded) {
      rewardedAd.show();
    } else {
      Alert.alert(
        'Ad Not Ready',
        'The rewarded ad is still loading. Please try again in a moment.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <TouchableOpacity
      style={[styles.rewardButton, style, disabled && styles.disabled]}
      onPress={showAd}
      disabled={disabled || !isLoaded}
    >
      <MaterialIcon
        name="play-circle-filled"
        family="material"
        size={ICON_SIZES.MEDIUM}
        color={isLoaded ? ICON_COLORS.SUCCESS : ICON_COLORS.DISABLED}
      />
      <View style={styles.textContainer}>
        <Text style={[styles.rewardText, !isLoaded && styles.disabledText]}>
          WATCH AD
        </Text>
        <Text style={[styles.rewardAmount, !isLoaded && styles.disabledText]}>
          +{rewardAmount} COINS
        </Text>
      </View>
      
      {isLoading && (
        <View style={styles.loadingIndicator}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  rewardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    borderWidth: 2,
    borderColor: '#00FF88',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginVertical: 8,
  },
  disabled: {
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    borderColor: '#666',
  },
  textContainer: {
    marginLeft: 12,
    flex: 1,
  },
  rewardText: {
    color: '#00FF88',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  rewardAmount: {
    color: '#FFD60A',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  disabledText: {
    color: '#666',
  },
  loadingIndicator: {
    position: 'absolute',
    right: 12,
  },
  loadingText: {
    color: '#00E0FF',
    fontSize: 10,
    fontFamily: 'monospace',
  },
});

export default RewardedAdButton;