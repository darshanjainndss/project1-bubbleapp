import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { RewardedAd, AdEventType, RewardedAdEventType, TestIds } from 'react-native-google-mobile-ads';
import { ADMOB_CONFIG } from '../config/admob';

interface SimpleRewardedAdButtonProps {
  onReward: (amount: number) => void;
  rewardAmount?: number;
}

const SimpleRewardedAdButton: React.FC<SimpleRewardedAdButtonProps> = ({
  onReward,
  rewardAmount = 50
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
      Alert.alert('Reward Earned!', `You earned ${rewardAmount} coins!`, [{ text: 'OK' }]);
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
      Alert.alert('Ad Error', 'Failed to load ad. Please try again later.', [{ text: 'OK' }]);
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

  const getButtonText = () => {
    if (isLoading) return 'Loading Ad...';
    if (isLoaded) return `WATCH AD (+${rewardAmount} Coins)`;
    return 'Ad Not Ready';
  };

  const getButtonStyle = () => {
    if (isLoaded) return [styles.button, styles.buttonReady];
    if (isLoading) return [styles.button, styles.buttonLoading];
    return [styles.button, styles.buttonDisabled];
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={showAd}
      disabled={!isLoaded}
    >
      <Text style={styles.buttonText}>{getButtonText()}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    borderWidth: 2,
  },
  buttonReady: {
    backgroundColor: '#00FF88',
    borderColor: '#00CC66',
  },
  buttonLoading: {
    backgroundColor: '#FFD60A',
    borderColor: '#FFC107',
  },
  buttonDisabled: {
    backgroundColor: '#666',
    borderColor: '#444',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'monospace',
  },
});

export default SimpleRewardedAdButton;