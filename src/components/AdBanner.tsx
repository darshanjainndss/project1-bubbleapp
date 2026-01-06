import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import ConfigService from '../services/ConfigService';

interface AdBannerProps {
  size?: BannerAdSize;
  style?: any;
}

const AdBanner: React.FC<AdBannerProps> = ({
  size = BannerAdSize.BANNER,
  style
}) => {
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState<string | null>(null);
  const [adUnitId, setAdUnitId] = useState<string | null>(null);

  useEffect(() => {
    const fetchAdId = async () => {
      try {
        const units = await ConfigService.getAdUnits();
        if (units.banner) {
          setAdUnitId(units.banner);
        } else {
          // Fallback to test ID if no ID is found in backend
          setAdUnitId(TestIds.BANNER);
        }
      } catch (error) {
        console.error('Error fetching banner ad ID:', error);
        setAdUnitId(TestIds.BANNER);
      }
    };

    fetchAdId();
  }, []);

  const handleAdLoaded = () => {
    console.log('✅ Banner ad loaded successfully');
    setAdLoaded(true);
    setAdError(null);
  };

  const handleAdFailedToLoad = (error: any) => {
    console.log('❌ Banner ad failed to load:', error);

    // If we were using a custom ID and it failed, fallback to test ID
    if (adUnitId && adUnitId !== TestIds.BANNER) {
      console.log('⚠️ Falling back to test ID due to load failure');
      setAdUnitId(TestIds.BANNER);
      return;
    }

    setAdError(error.message || 'Ad failed to load');
    setAdLoaded(false);
  };

  if (!adUnitId) return null;

  return (
    <View style={[styles.container, style]}>
      <BannerAd
        unitId={adUnitId}
        size={size}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
        onAdLoaded={handleAdLoaded}
        onAdFailedToLoad={handleAdFailedToLoad}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    minHeight: 50,
  },
  debugInfo: {
    position: 'absolute',
    top: -40,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#00E0FF',
  },
  debugText: {
    color: '#00E0FF',
    fontSize: 10,
    fontFamily: 'monospace',
  },
});

export default AdBanner;