import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TouchableOpacity, Text, View, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { RewardedAd, AdEventType, RewardedAdEventType, TestIds } from 'react-native-google-mobile-ads';
import MaterialIcon from './MaterialIcon';
import ConfigService from '../../services/ConfigService';
import { GAME_ICONS, ICON_COLORS, ICON_SIZES } from '../../config/icons';

interface RewardedAdButtonProps {
  onReward: (amount: number) => void;
  rewardAmount?: number;
  style?: any;
  disabled?: boolean;
}

const RewardedAdButton: React.FC<RewardedAdButtonProps> = ({
  onReward,
  rewardAmount = 0,
  style,
  disabled = false
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [rewardedAd, setRewardedAd] = useState<RewardedAd | null>(null);
  const [adUnitIds, setAdUnitIds] = useState<string[]>([]);
  const [displayRewardAmount, setDisplayRewardAmount] = useState(rewardAmount || 0);

  const timerRef: { current: any } = useRef<any>(null);
  const adsRef = useRef<RewardedAd[]>([]);
  const isLoadedRef = useRef(false);

  // Sync prop changes with local state
  useEffect(() => {
    if (rewardAmount) {
      setDisplayRewardAmount(rewardAmount);
    }
  }, [rewardAmount]);

  // Initialize and fetch ad unit IDs and reward config
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [units, adConfig] = await Promise.all([
          ConfigService.getAdUnits(),
          ConfigService.getAdConfig()
        ]);

        console.log('📦 RewardedAdButton: Fetched data from service');
        console.log('📦 AdUnits data:', units);

        // Prioritize rewardedAmount from AdUnit collection (database)
        if (!rewardAmount) {
          if (units?.rewardedAmount) {
            console.log('💰 Using rewardedAmount from AdUnit collection:', units.rewardedAmount);
            setDisplayRewardAmount(units.rewardedAmount);
          } else if (adConfig?.rewardConfig?.coinsPerAd) {
            console.log('💰 Fallback to adConfig.rewardConfig.coinsPerAd:', adConfig.rewardConfig.coinsPerAd);
            setDisplayRewardAmount(adConfig.rewardConfig.coinsPerAd);
          } else {
            console.log('💰 Using default reward amount: 50');
            setDisplayRewardAmount(50);
          }
        }

        const ids = units.rewardedList && units.rewardedList.length > 0
          ? units.rewardedList
          : [units.rewarded || TestIds.REWARDED];

        console.log(`🎯 RewardedAdButton: Using ${ids.length} ad units for the race:`, ids);
        setAdUnitIds(ids);
      } catch (error) {
        console.error('❌ RewardedAdButton: Error fetching ad units:', error);
        setAdUnitIds([TestIds.REWARDED]);
        if (!rewardAmount) {
          setDisplayRewardAmount(50); // Fallback to default
        }
      }
    };

    fetchData();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      // Cleanup any active ads
      adsRef.current = [];
    };
  }, []);

  const startAdLoadRace = async () => {
    if (isLoading || isLoaded) return;

    setIsLoading(true);
    setCountdown(10);
    isLoadedRef.current = false;

    // Start 10 second timer
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          if (!isLoadedRef.current) {
            setIsLoading(false);
            Alert.alert('Timeout', 'Failed to load ad within 10 seconds. Please try again.');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    console.log(`🚀 Starting ad load race with ${adUnitIds.length} IDs...`);

    // Create and load multiple ad instances
    const currentAds: RewardedAd[] = adUnitIds.map(id => {
      const ad = RewardedAd.createForAdRequest(id, {
        requestNonPersonalizedAdsOnly: true,
      });

      const unsubLoaded = ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
        if (!isLoadedRef.current) {
          console.log(`🏆 WINNER! Ad ID loaded first: ${id}`);
          isLoadedRef.current = true;
          setIsLoaded(true);
          setIsLoading(false);
          setRewardedAd(ad);
          if (timerRef.current) clearInterval(timerRef.current);

          // Show the ad immediately as requested
          ad.show();
        }
        unsubLoaded();
      });

      const unsubError = ad.addAdEventListener(AdEventType.ERROR, (error) => {
        console.log(`❌ Ad ID failed to load: ${id}`, error);
        unsubError();
      });

      const unsubEarned = ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (reward) => {
        console.log('🎉 User earned reward from race ad:', reward);
        onReward(displayRewardAmount);
        resetState();
        unsubEarned();
      });

      const unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
        console.log('📱 Rewarded ad closed');
        resetState();
        unsubClosed();
      });

      ad.load();
      return ad;
    });

    adsRef.current = currentAds;
  };

  const resetState = () => {
    setIsLoaded(false);
    setIsLoading(false);
    setCountdown(0);
    setRewardedAd(null);
    isLoadedRef.current = false;
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const showAd = () => {
    if (isLoaded && rewardedAd) {
      rewardedAd.show();
    } else {
      startAdLoadRace();
    }
  };

  return (
    <TouchableOpacity
      style={[styles.rewardButton, style, (disabled || (isLoading && countdown === 0)) && styles.disabled]}
      onPress={showAd}
      disabled={disabled || isLoading}
    >
      <View style={styles.iconContainer}>
        {isLoading ? (
          <View style={styles.timerCircle}>
            <Text style={styles.countdownText}>{countdown}</Text>
          </View>
        ) : (
          <MaterialIcon
            name="play-circle-filled"
            family="material"
            size={ICON_SIZES.MEDIUM}
            color={disabled ? ICON_COLORS.DISABLED : ICON_COLORS.SUCCESS}
          />
        )}
      </View>

      <View style={styles.textContainer}>
        <Text style={[styles.rewardText, (disabled) && styles.disabledText]}>
          {isLoading ? 'LOADING AD...' : 'WATCH AD'}
        </Text>
        <Text style={[styles.rewardAmount, (disabled) && styles.disabledText]}>
          +{displayRewardAmount} COINS
        </Text>
      </View>

      {isLoading && (
        <View style={styles.loadingIndicator}>
          <ActivityIndicator size="small" color="#00E0FF" />
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
    minHeight: 64,
  },
  disabled: {
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    borderColor: '#666',
  },
  iconContainer: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#00E0FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownText: {
    color: '#00E0FF',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'monospace',
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
    marginLeft: 8,
  },
});

export default RewardedAdButton;