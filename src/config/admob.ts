// Set to true for development/testing, false for production
const USE_TEST_ADS = __DEV__;

export const ADMOB_CONFIG = {
  APP_ID: 'ca-app-pub-9343780880487586~7301029574',
  BANNER_AD_UNIT_ID: USE_TEST_ADS 
    ? 'ca-app-pub-3940256099942544/6300978111' // Test banner ID
    : 'ca-app-pub-9343780880487586/4698916968', // Your real banner ID
  REWARDED_AD_UNIT_ID: USE_TEST_ADS
    ? 'ca-app-pub-3940256099942544/5224354917' // Test rewarded ID
    : 'ca-app-pub-9343780880487586/4698916968', // You'll need to create a rewarded ad unit
};

export const AD_SIZES = {
  BANNER: 'banner',
  LARGE_BANNER: 'largeBanner',
  MEDIUM_RECTANGLE: 'mediumRectangle',
  FULL_BANNER: 'fullBanner',
  LEADERBOARD: 'leaderboard',
} as const;