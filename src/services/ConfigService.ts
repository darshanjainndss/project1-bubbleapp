import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import BackendService, { AbilityConfig, AdConfig, GameConfig } from './BackendService';

// Cache keys
const ABILITIES_CACHE_KEY = 'cached_abilities_config';
const AD_CONFIG_CACHE_KEY = 'cached_ad_config';
const AD_UNITS_CACHE_KEY = 'cached_ad_units';
const GAME_CONFIG_CACHE_KEY = 'cached_game_config';
const CONFIG_TIMESTAMP_KEY = 'config_cache_timestamp';

// Cache duration (24 hours)
const CACHE_DURATION = 24 * 60 * 60 * 1000;


// Fallback configurations (in case backend is unavailable)
const FALLBACK_ABILITIES: AbilityConfig[] = [
  {
    id: 'lightning',
    name: 'lightning',
    displayName: 'Lightning',
    description: 'Destroys an entire row of bubbles',
    icon: 'lightning-bolt',
    effect: 'destroyRow',
    pointsPerBubble: 15,
    price: 50,
    startingCount: 2,
    sortOrder: 1
  },
  {
    id: 'bomb',
    name: 'bomb',
    displayName: 'Bomb',
    description: 'Destroys bubbles in a hexagonal area',
    icon: 'bomb',
    effect: 'destroyNeighbors',
    pointsPerBubble: 12,
    price: 75,
    startingCount: 2,
    sortOrder: 2
  },
  {
    id: 'freeze',
    name: 'freeze',
    displayName: 'Freeze',
    description: 'Freezes a column of bubbles',
    icon: 'snowflake',
    effect: 'freezeColumn',
    pointsPerBubble: 8,
    price: 30,
    startingCount: 2,
    sortOrder: 3
  },
  {
    id: 'fire',
    name: 'fire',
    displayName: 'Fire',
    description: 'Burns through obstacles and metal grids',
    icon: 'fire',
    effect: 'burnObstacles',
    pointsPerBubble: 12,
    price: 40,
    startingCount: 2,
    sortOrder: 4
  }
];

const FALLBACK_AD_CONFIG: AdConfig = {
  platform: Platform.OS as 'android' | 'ios',
  appId: 'ca-app-pub-placeholder',
  bannerAdUnitId: 'ca-app-pub-placeholder',
  rewardedAdUnitId: 'ca-app-pub-placeholder',
  maxAdContentRating: 'G',
  tagForUnderAgeOfConsent: false,
  tagForChildDirectedTreatment: false,
  rewardConfig: {
    coinsPerAd: 25,
    abilitiesPerAd: 1
  }
};

class ConfigService {
  private abilitiesConfig: AbilityConfig[] | null = null;
  private adConfig: AdConfig | null = null;
  private adUnits: { banner: string | null; rewarded: string | null } | null = null;
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
      const result = await BackendService.getAbilitiesConfig();

      if (result.success && result.abilities) {
        this.abilitiesConfig = result.abilities;

        // Cache the result
        await AsyncStorage.setItem(ABILITIES_CACHE_KEY, JSON.stringify(result.abilities));
        await this.setCacheTimestamp();

        return this.abilitiesConfig;
      } else {
        console.warn('Failed to fetch abilities config from backend, using fallback');
        this.abilitiesConfig = FALLBACK_ABILITIES;
        return this.abilitiesConfig;
      }
    } catch (error) {
      console.error('Error fetching abilities config:', error);
      this.abilitiesConfig = FALLBACK_ABILITIES;
      return this.abilitiesConfig;
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
      const result = await BackendService.getAdConfig(platform, __DEV__);

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
      const result = await BackendService.getGameConfig(platform, __DEV__);

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
          platform: platform,
          isDevelopment: __DEV__
        };
        return this.gameConfig;
      }
    } catch (error) {
      console.error('Error fetching game config:', error);
      this.gameConfig = {
        abilities: FALLBACK_ABILITIES,
        ads: FALLBACK_AD_CONFIG,
        platform: Platform.OS as 'android' | 'ios',
        isDevelopment: __DEV__
      };
      return this.gameConfig;
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  async getAdUnits(forceRefresh = false): Promise<{ banner: string | null; rewarded: string | null }> {
    // Return cached data if available and not forcing refresh
    if (this.adUnits && !forceRefresh) {
      return this.adUnits;
    }

    // Check if we should use cache
    if (!forceRefresh && await this.isCacheValid()) {
      try {
        const cached = await AsyncStorage.getItem(AD_UNITS_CACHE_KEY);
        if (cached) {
          this.adUnits = JSON.parse(cached);
          if (this.adUnits) return this.adUnits;
        }
      } catch (error) {
        console.error('Error loading cached ad units:', error);
      }
    }

    // Fetch from backend
    try {
      const platform = Platform.OS as 'android' | 'ios';
      const result = await BackendService.getAdUnits(platform);

      if (result.success && result.ads) {
        this.adUnits = result.ads;

        // Cache the result
        await AsyncStorage.setItem(AD_UNITS_CACHE_KEY, JSON.stringify(result.ads));
        await this.setCacheTimestamp();

        return this.adUnits;
      } else {
        console.warn('Failed to fetch ad units from backend, using default');
        this.adUnits = { banner: null, rewarded: null };
        return this.adUnits;
      }
    } catch (error) {
      console.error('Error fetching ad units:', error);
      this.adUnits = { banner: null, rewarded: null };
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
}

export default new ConfigService();