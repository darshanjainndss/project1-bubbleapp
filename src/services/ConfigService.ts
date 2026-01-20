import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import BackendService, { AbilityConfig, AdConfig, GameConfig } from './BackendService';

// Cache keys
const ABILITIES_CACHE_KEY = 'cached_abilities_config';
const AD_CONFIG_CACHE_KEY = 'cached_ad_config';
const AD_UNITS_CACHE_KEY = 'cached_ad_units';
const GAME_CONFIG_CACHE_KEY = 'cached_game_config';
const CONFIG_TIMESTAMP_KEY = 'config_cache_timestamp';

// Cache duration (5 minutes in development, 2 minutes in production for better performance)
const CACHE_DURATION = __DEV__ ? 5 * 60 * 1000 : 2 * 60 * 1000; // 5 min dev, 2 min prod


// Fallback configurations (in case backend is unavailable)
const FALLBACK_ABILITIES: AbilityConfig[] = [];

const FALLBACK_AD_CONFIG: AdConfig = {
  platform: Platform.OS as 'android' | 'ios',
  appId: 'ca-app-pub-placeholder',
  maxAdContentRating: 'G',
  tagForUnderAgeOfConsent: false,
  tagForChildDirectedTreatment: false,
  rewardConfig: {
    coinsPerAd: 50,
    abilitiesPerAd: 1
  }
};

class ConfigService {
  private abilitiesConfig: AbilityConfig[] | null = null;
  private adConfig: AdConfig | null = null;
  private adUnits: { banner: string | null; rewarded: string | null; rewardedList?: string[]; rewardedAmount?: number } | null = null;
  private gameConfig: GameConfig | null = null;
  private isLoading = false;


  // ============================================================================
  // CACHE MANAGEMENT
  // ============================================================================

  private async isCacheValid(): Promise<boolean> {
    try {
      const timestamp = await AsyncStorage.getItem(CONFIG_TIMESTAMP_KEY);
      if (!timestamp) return false;

      const cacheTime = parseInt(timestamp, 10);
      const now = Date.now();

      return (now - cacheTime) < CACHE_DURATION;
    } catch (error) {
      console.error('Error checking cache validity:', error);
      return false;
    }
  }

  private async setCacheTimestamp(): Promise<void> {
    try {
      await AsyncStorage.setItem(CONFIG_TIMESTAMP_KEY, Date.now().toString());
    } catch (error) {
      console.error('Error setting cache timestamp:', error);
    }
  }

  private async clearCache(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        ABILITIES_CACHE_KEY,
        AD_CONFIG_CACHE_KEY,
        AD_UNITS_CACHE_KEY,
        GAME_CONFIG_CACHE_KEY,
        CONFIG_TIMESTAMP_KEY
      ]);

    } catch (error) {
      console.error('Error clearing config cache:', error);
    }
  }

  // ============================================================================
  // ABILITIES CONFIGURATION
  // ============================================================================

  async getAbilitiesConfig(forceRefresh = false): Promise<AbilityConfig[]> {
    // Return cached data if available and not forcing refresh
    if (this.abilitiesConfig && !forceRefresh) {
      return this.abilitiesConfig;
    }

    // Check if we should use cache
    if (!forceRefresh && await this.isCacheValid()) {
      try {
        const cached = await AsyncStorage.getItem(ABILITIES_CACHE_KEY);
        if (cached) {
          this.abilitiesConfig = JSON.parse(cached);
          if (this.abilitiesConfig) return this.abilitiesConfig;
        }
      } catch (error) {
        console.error('Error loading cached abilities config:', error);
      }
    }


    // Fetch from backend
    try {
      console.log('🔄 Fetching abilities config from backend...');
      const result = await BackendService.getAbilitiesConfig();

      if (result.success && result.abilities) {
        console.log('✅ Successfully fetched abilities from backend:', result.abilities.length, 'abilities');
        result.abilities.forEach(ability => {
          console.log(`   - ${ability.displayName}: ${ability.price} coins`);
        });
        this.abilitiesConfig = result.abilities;

        // Cache the result
        await AsyncStorage.setItem(ABILITIES_CACHE_KEY, JSON.stringify(result.abilities));
        await this.setCacheTimestamp();

        return this.abilitiesConfig;
      } else {
        console.warn('⚠️ Failed to fetch abilities config from backend');
        console.log('Backend response:', result);
        throw new Error(result.error || 'Failed to fetch abilities from backend');
      }
    } catch (error) {
      console.error('❌ Error fetching abilities config:', error);
      throw error;
    }
  }

  async getAbilityByName(name: string): Promise<AbilityConfig | null> {
    const abilities = await this.getAbilitiesConfig();
    return abilities.find(ability => ability.name === name) || null;
  }

  // ============================================================================
  // AD CONFIGURATION
  // ============================================================================

  async getAdConfig(forceRefresh = false): Promise<AdConfig> {
    // Return cached data if available and not forcing refresh
    if (this.adConfig && !forceRefresh) {
      return this.adConfig;
    }

    // Check if we should use cache
    if (!forceRefresh && await this.isCacheValid()) {
      try {
        const cached = await AsyncStorage.getItem(AD_CONFIG_CACHE_KEY);
        if (cached) {
          this.adConfig = JSON.parse(cached);
          if (this.adConfig) return this.adConfig;
        }
      } catch (error) {
        console.error('Error loading cached ad config:', error);
      }
    }


    // Fetch from backend
    try {
      const platform = Platform.OS as 'android' | 'ios';
      const result = await BackendService.getAdConfig(platform);

      if (result.success && result.adConfig) {
        this.adConfig = result.adConfig;

        // Cache the result
        await AsyncStorage.setItem(AD_CONFIG_CACHE_KEY, JSON.stringify(result.adConfig));
        await this.setCacheTimestamp();

        return this.adConfig;
      } else {
        console.warn('Failed to fetch ad config from backend, using fallback');
        this.adConfig = FALLBACK_AD_CONFIG;
        return this.adConfig;
      }
    } catch (error) {
      console.error('Error fetching ad config:', error);
      this.adConfig = FALLBACK_AD_CONFIG;
      return this.adConfig;
    }
  }

  // ============================================================================
  // COMPLETE GAME CONFIGURATION
  // ============================================================================

  async getGameConfig(forceRefresh = false): Promise<GameConfig> {
    // Return cached data if available and not forcing refresh
    if (this.gameConfig && !forceRefresh) {
      return this.gameConfig;
    }

    // Check if we should use cache
    if (!forceRefresh && await this.isCacheValid()) {
      try {
        const cached = await AsyncStorage.getItem(GAME_CONFIG_CACHE_KEY);
        if (cached) {
          this.gameConfig = JSON.parse(cached);
          if (this.gameConfig) return this.gameConfig;
        }
      } catch (error) {
        console.error('Error loading cached game config:', error);
      }
    }


    // Fetch from backend
    try {
      const platform = Platform.OS as 'android' | 'ios';
      const result = await BackendService.getGameConfig(platform);

      if (result.success && result.config) {
        this.gameConfig = result.config;

        // Cache the result
        await AsyncStorage.setItem(GAME_CONFIG_CACHE_KEY, JSON.stringify(result.config));
        await this.setCacheTimestamp();

        return this.gameConfig;
      } else {
        console.warn('Failed to fetch game config from backend, using fallback');
        this.gameConfig = {
          abilities: FALLBACK_ABILITIES,
          ads: FALLBACK_AD_CONFIG,
          gameSettings: {
            baseCoins: 10,
            coinsPerLevelMultiplier: 2.5,
            starBonusBase: 5,
            starBonusLevelMultiplier: 0.5,
            completionBonusMultiplier: 1.2,
            scoreRange: 100,
            rewardPerRange: 1,
            starThresholds: { one: 200, two: 600, three: 1000 }
          },
          platform: platform,
          rewardAmount: 50
        };
        return this.gameConfig;
      }
    } catch (error) {
      console.error('Error fetching game config:', error);
      this.gameConfig = {
        abilities: FALLBACK_ABILITIES,
        ads: FALLBACK_AD_CONFIG,
        gameSettings: {
          baseCoins: 10,
          coinsPerLevelMultiplier: 2.5,
          starBonusBase: 5,
          starBonusLevelMultiplier: 0.5,
          completionBonusMultiplier: 1.2,
          scoreRange: 100,
          rewardPerRange: 1
        },
        platform: Platform.OS as 'android' | 'ios',
        rewardAmount: 50
      };
      return this.gameConfig;
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  async getAdUnits(forceRefresh = false): Promise<{ banner: string | null; rewarded: string | null; rewardedList?: string[]; rewardedAmount?: number }> {
    console.log(`🔍 getAdUnits called with forceRefresh: ${forceRefresh}`);

    // Return cached data if available and not forcing refresh
    if (this.adUnits && !forceRefresh) {
      console.log('📦 Returning cached ad units');
      return this.adUnits;
    }

    // Check if we should use cache
    if (!forceRefresh && await this.isCacheValid()) {
      try {
        const cached = await AsyncStorage.getItem(AD_UNITS_CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          // If the cached data is missing rewardedList, it's a stale cache from an older version
          if (parsed && parsed.rewardedList && parsed.rewardedList.length > 0) {
            console.log('📦 Using cached ad units from AsyncStorage');
            this.adUnits = parsed;
            return this.adUnits!;
          }
          console.log('📡 Cache is missing rewardedList, forcing refresh...');
        }
      } catch (error) {
        console.error('Error loading cached ad units:', error);
      }
    } else if (forceRefresh) {
      console.log('🔄 Force refresh requested, bypassing cache');
    } else {
      console.log('⏰ Cache expired, fetching fresh data');
    }

    // Fetch from backend
    try {
      console.log('🌐 Fetching ad units from backend...');
      const platform = Platform.OS as 'android' | 'ios';
      const result = await BackendService.getAdUnits(platform);

      if (result.success && result.ads) {
        console.log('✅ Successfully fetched ad units from backend');
        console.log('📱 Banner:', result.ads.banner);
        console.log('🎁 Rewarded:', result.ads.rewarded);
        console.log('📋 Rewarded List:', result.ads.rewardedList?.length || 0, 'ads');

        this.adUnits = result.ads;

        // Cache the result
        await AsyncStorage.setItem(AD_UNITS_CACHE_KEY, JSON.stringify(result.ads));
        await this.setCacheTimestamp();
        console.log('💾 Cached new ad units data');

        return this.adUnits;
      } else {
        console.warn('Failed to fetch ad units from backend, using default');
        this.adUnits = { banner: null, rewarded: null, rewardedList: [], rewardedAmount: 50 };
        return this.adUnits;
      }
    } catch (error) {
      console.error('Error fetching ad units:', error);
      this.adUnits = { banner: null, rewarded: null, rewardedList: [], rewardedAmount: 50 };
      return this.adUnits;
    }
  }

  async refreshConfig(): Promise<void> {
    this.abilitiesConfig = null;
    this.adConfig = null;
    this.adUnits = null;
    this.gameConfig = null;
    await this.clearCache();

    // Pre-load the config
    await this.getGameConfig(true);
    await this.getAdUnits(true);
  }

  // Force refresh ad units only (useful when ad units are updated in database)
  async refreshAdUnits(): Promise<{ banner: string | null; rewarded: string | null; rewardedList?: string[]; rewardedAmount?: number }> {
    console.log('🔄 Force refreshing ad units from database...');
    this.adUnits = null;

    // Clear ad units cache and timestamp to force fresh fetch
    try {
      await AsyncStorage.multiRemove([AD_UNITS_CACHE_KEY, CONFIG_TIMESTAMP_KEY]);
      console.log('🗑️ Cleared ad units cache and timestamp');
    } catch (error) {
      console.error('Error clearing ad units cache:', error);
    }

    return await this.getAdUnits(true);
  }

  // Force refresh game config only (useful when game settings are updated in database)
  async refreshGameConfig(): Promise<GameConfig> {
    console.log('🔄 Force refreshing game config from database...');
    this.gameConfig = null;

    // Clear game config cache and timestamp to force fresh fetch
    try {
      await AsyncStorage.multiRemove([GAME_CONFIG_CACHE_KEY, CONFIG_TIMESTAMP_KEY]);
      console.log('🗑️ Cleared game config cache and timestamp');
    } catch (error) {
      console.error('Error clearing game config cache:', error);
    }

    return await this.getGameConfig(true);
  }

  // Nuclear option - clear everything and start fresh
  async clearAllCaches(): Promise<void> {
    console.log('💥 Clearing ALL caches and resetting ConfigService...');

    // Reset all in-memory variables
    this.abilitiesConfig = null;
    this.adConfig = null;
    this.adUnits = null;
    this.gameConfig = null;

    // Clear all AsyncStorage caches
    try {
      await AsyncStorage.multiRemove([
        ABILITIES_CACHE_KEY,
        AD_CONFIG_CACHE_KEY,
        AD_UNITS_CACHE_KEY,
        GAME_CONFIG_CACHE_KEY,
        CONFIG_TIMESTAMP_KEY
      ]);
      console.log('🗑️ All caches cleared from AsyncStorage');
    } catch (error) {
      console.error('Error clearing all caches:', error);
    }
  }



  // Get ability price by name
  async getAbilityPrice(abilityName: string): Promise<number> {
    const ability = await this.getAbilityByName(abilityName);
    return ability?.price || 0;
  }

  // Get ability starting count by name
  async getAbilityStartingCount(abilityName: string): Promise<number> {
    const ability = await this.getAbilityByName(abilityName);
    return ability?.startingCount || 0;
  }

  // Get all ability names
  async getAbilityNames(): Promise<string[]> {
    const abilities = await this.getAbilitiesConfig();
    return abilities.map(ability => ability.name);
  }

  // ============================================================================
  // ABILITY MANAGEMENT METHODS
  // ============================================================================

  async getAllAbilities(filters?: {
    isActive?: boolean;
  }): Promise<{ success: boolean; data?: any[]; count?: number; filter?: any; error?: string }> {
    try {
      return await BackendService.getAllAbilities(filters);
    } catch (error) {
      console.error('Error fetching all abilities:', error);
      return { success: false, error: 'Failed to fetch abilities' };
    }
  }

  async getAbilityById(id: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      return await BackendService.getAbilityById(id);
    } catch (error) {
      console.error('Error fetching ability by ID:', error);
      return { success: false, error: 'Failed to fetch ability' };
    }
  }

  async getAbilityByNameDirect(name: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      return await BackendService.getAbilityByName(name);
    } catch (error) {
      console.error('Error fetching ability by name:', error);
      return { success: false, error: 'Failed to fetch ability' };
    }
  }

  async createAbility(abilityData: {
    name: string;
    displayName: string;
    description: string;
    icon: string;
    effect: 'destroyRow' | 'destroyNeighbors' | 'freezeColumn' | 'burnObstacles';
    pointsPerBubble?: number;
    price?: number;
    startingCount?: number;
    sortOrder?: number;
    isActive?: boolean;
  }): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const result = await BackendService.createAbility(abilityData);
      if (result.success) {
        // Clear cache to force refresh
        await this.clearCache();
      }
      return result;
    } catch (error) {
      console.error('Error creating ability:', error);
      return { success: false, error: 'Failed to create ability' };
    }
  }

  async updateAbility(id: string, updates: {
    name?: string;
    displayName?: string;
    description?: string;
    icon?: string;
    effect?: 'destroyRow' | 'destroyNeighbors' | 'freezeColumn' | 'burnObstacles';
    pointsPerBubble?: number;
    price?: number;
    startingCount?: number;
    sortOrder?: number;
    isActive?: boolean;
  }): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const result = await BackendService.updateAbility(id, updates);
      if (result.success) {
        // Clear cache to force refresh
        await this.clearCache();
        this.abilitiesConfig = null;
        this.gameConfig = null;
      }
      return result;
    } catch (error) {
      console.error('Error updating ability:', error);
      return { success: false, error: 'Failed to update ability' };
    }
  }

  async deleteAbility(id: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const result = await BackendService.deleteAbility(id);
      if (result.success) {
        // Clear cache to force refresh
        await this.clearCache();
      }
      return result;
    } catch (error) {
      console.error('Error deleting ability:', error);
      return { success: false, error: 'Failed to delete ability' };
    }
  }



  // ============================================================================
  // AD CONFIG MANAGEMENT METHODS
  // ============================================================================

  async getAllAdConfigs(): Promise<{ success: boolean; data?: any[]; count?: number; error?: string }> {
    try {
      return await BackendService.getAllAdConfigs();
    } catch (error) {
      console.error('Error fetching all ad configs:', error);
      return { success: false, error: 'Failed to fetch ad configurations' };
    }
  }

  async getAdConfigByPlatform(platform: 'android' | 'ios'): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      return await BackendService.getAdConfigByPlatform(platform);
    } catch (error) {
      console.error('Error fetching ad config by platform:', error);
      return { success: false, error: 'Failed to fetch ad configuration' };
    }
  }

  async createAdConfig(configData: {
    platform: 'android' | 'ios';
    appId: string;
    maxAdContentRating?: 'G' | 'PG' | 'T' | 'MA';
    tagForUnderAgeOfConsent?: boolean;
    tagForChildDirectedTreatment?: boolean;
    isActive?: boolean;
  }): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const result = await BackendService.createAdConfig(configData);
      if (result.success) {
        // Clear cache to force refresh
        await this.clearCache();
      }
      return result;
    } catch (error) {
      console.error('Error creating ad config:', error);
      return { success: false, error: 'Failed to create ad configuration' };
    }
  }

  async updateAdConfig(platform: 'android' | 'ios', updates: {
    appId?: string;
    maxAdContentRating?: 'G' | 'PG' | 'T' | 'MA';
    tagForUnderAgeOfConsent?: boolean;
    tagForChildDirectedTreatment?: boolean;
    isActive?: boolean;
  }): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const result = await BackendService.updateAdConfig(platform, updates);
      if (result.success) {
        // Clear cache to force refresh
        await this.clearCache();
        this.adConfig = null;
        this.gameConfig = null;
      }
      return result;
    } catch (error) {
      console.error('Error updating ad config:', error);
      return { success: false, error: 'Failed to update ad configuration' };
    }
  }

  async deleteAdConfig(platform: 'android' | 'ios'): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const result = await BackendService.deleteAdConfig(platform);
      if (result.success) {
        // Clear cache to force refresh
        await this.clearCache();
      }
      return result;
    } catch (error) {
      console.error('Error deleting ad config:', error);
      return { success: false, error: 'Failed to delete ad configuration' };
    }
  }



  // ============================================================================
  // AD UNIT MANAGEMENT METHODS
  // ============================================================================

  async getAllAdUnits(filters?: {
    platform?: 'android' | 'ios';
    adType?: 'banner' | 'rewarded';
    isActive?: boolean;
  }): Promise<{ success: boolean; data?: any[]; count?: number; filter?: any; error?: string }> {
    try {
      return await BackendService.getAllAdUnits(filters);
    } catch (error) {
      console.error('Error fetching all ad units:', error);
      return { success: false, error: 'Failed to fetch ad units' };
    }
  }

  async getAdUnitById(id: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      return await BackendService.getAdUnitById(id);
    } catch (error) {
      console.error('Error fetching ad unit by ID:', error);
      return { success: false, error: 'Failed to fetch ad unit' };
    }
  }

  async createAdUnit(unitData: {
    adId: string;
    adType: 'banner' | 'rewarded';
    platform: 'android' | 'ios';
    priority?: number;
    isActive?: boolean;
    rewardedAmount?: number;
  }): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const result = await BackendService.createAdUnit(unitData);
      if (result.success) {
        // Clear cache to force refresh
        await this.clearCache();
      }
      return result;
    } catch (error) {
      console.error('Error creating ad unit:', error);
      return { success: false, error: 'Failed to create ad unit' };
    }
  }

  async updateAdUnit(id: string, updates: {
    adId?: string;
    adType?: 'banner' | 'rewarded';
    platform?: 'android' | 'ios';
    priority?: number;
    isActive?: boolean;
    rewardedAmount?: number;
  }): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const result = await BackendService.updateAdUnit(id, updates);
      if (result.success) {
        // Clear cache to force refresh
        await this.clearCache();
        this.adUnits = null;
      }
      return result;
    } catch (error) {
      console.error('Error updating ad unit:', error);
      return { success: false, error: 'Failed to update ad unit' };
    }
  }

  async deleteAdUnit(id: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const result = await BackendService.deleteAdUnit(id);
      if (result.success) {
        // Clear cache to force refresh
        await this.clearCache();
      }
      return result;
    } catch (error) {
      console.error('Error deleting ad unit:', error);
      return { success: false, error: 'Failed to delete ad unit' };
    }
  }

  async getBestAdUnit(platform: 'android' | 'ios', adType: 'banner' | 'rewarded'): Promise<{ success: boolean; data?: any; adId?: string; error?: string }> {
    try {
      return await BackendService.getBestAdUnit(platform, adType);
    } catch (error) {
      console.error('Error fetching best ad unit:', error);
      return { success: false, error: 'Failed to fetch best ad unit' };
    }
  }

  async initializeAdUnits(): Promise<{ success: boolean; results?: any[]; error?: string }> {
    try {
      const result = await BackendService.initializeAdUnits();
      if (result.success) {
        // Clear cache to force refresh
        await this.clearCache();
      }
      return result;
    } catch (error) {
      console.error('Error initializing ad units:', error);
      return { success: false, error: 'Failed to initialize ad units' };
    }
  }


}

export default new ConfigService();