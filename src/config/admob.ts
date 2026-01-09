import ConfigService from '../services/ConfigService';

// Legacy configuration - fallback only if backend fails
// All IDs should be fetched from backend for security and flexibility
const LEGACY_CONFIG = {
  APP_ID: 'ca-app-pub-placeholder',
  BANNER_AD_UNIT_ID: 'ca-app-pub-placeholder',
  REWARDED_AD_UNIT_ID: 'ca-app-pub-placeholder',
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