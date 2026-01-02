import React, { useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { ADMOB_CONFIG } from '../config/admob';

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

  const handleAdLoaded = () => {
    console.log('✅ Banner ad loaded successfully');
    setAdLoaded(true);
    setAdError(null);
  };

  const handleAdFailedToLoad = (error: any) => {
    console.log('❌ Banner ad failed to load:', error);
    setAdError(error.message || 'Ad failed to load');
    setAdLoaded(false);
  };

  return (
    <View style={[styles.container, style]}>
      <BannerAd
        unitId={ADMOB_CONFIG.BANNER_AD_UNIT_ID}
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