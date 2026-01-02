import ConfigService from '../services/ConfigService';

// Legacy configuration - will be replaced by backend config
const LEGACY_CONFIG = {
  APP_ID: 'ca-app-pub-9343780880487586~7301029574',
  BANNER_AD_UNIT_ID: __DEV__ 
    ? 'ca-app-pub-3940256099942544/6300978111' // Test banner ID
    : 'ca-app-pub-9343780880487586/4698916968', // Your real banner ID
  REWARDED_AD_UNIT_ID: __DEV__
    ? 'ca-app-pub-3940256099942544/5224354917' // Test rewarded ID
    : 'ca-app-pub-9343780880487586/4698916968', // You'll need to create a rewarded ad unit
};

// Dynamic AdMob configuration loaded from backend
let dynamicAdConfig: any = null;

// Initialize dynamic config
const initializeAdConfig = async () => {
  try {
    const config = await ConfigService.getAdConfig();
    dynamicAdConfig = config;
    return config;
  } catch (error) {
    console.error('Failed to load dynamic ad config, using legacy config:', error);
    return null;
  }
};

// Get current AdMob configuration
export const getAdMobConfig = async () => {
  if (!dynamicAdConfig) {
    await initializeAdConfig();
  }
  
  return dynamicAdConfig || {
    appId: LEGACY_CONFIG.APP_ID,
    bannerAdUnitId: LEGACY_CONFIG.BANNER_AD_UNIT_ID,
    rewardedAdUnitId: LEGACY_CONFIG.REWARDED_AD_UNIT_ID,
    maxAdContentRating: 'G',
    tagForUnderAgeOfConsent: false,
    tagForChildDirectedTreatment: false,
    rewardConfig: {
      coinsPerAd: 25,
      abilitiesPerAd: 1
    }
  };
};

// Legacy export for backward compatibility
export const ADMOB_CONFIG = LEGACY_CONFIG;

export const AD_SIZES = {
  BANNER: 'banner',
  LARGE_BANNER: 'largeBanner',
  MEDIUM_RECTANGLE: 'mediumRectangle',
  FULL_BANNER: 'fullBanner',
  LEADERBOARD: 'leaderboard',
} as const;