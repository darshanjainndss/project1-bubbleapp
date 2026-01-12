import AsyncStorage from '@react-native-async-storage/async-storage';

// Backend API Configuration
const API_BASE_URL = __DEV__
  ? 'http://localhost:3001/api' // Development - localhost first
  : 'https://your-production-api.com/api'; // Production URL

// Fallback URL for emulators and devices
const API_FALLBACK_URL = 'http://10.0.2.2:3001/api'; // Android emulator localhost
const API_DEVICE_URL = 'http://192.168.1.50:3001/api'; // For physical devices on network - Updated IP

// Network test function with fallback URLs
const testNetworkConnection = async (): Promise<{ success: boolean; url?: string }> => {
  const urlsToTest = [
    API_DEVICE_URL,      // Try device IP first (most likely to work on physical device)
    API_FALLBACK_URL,    // Then emulator localhost
    API_BASE_URL,        // Finally regular localhost
  ];

  for (const url of urlsToTest) {
    try {
      console.log(`🧪 Testing connection to: ${url}`);

      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 5000) // Increased timeout
      );

      const fetchPromise = fetch(`${url}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;

      if (response.ok) {
        console.log(`✅ Connection successful to: ${url}`);
        return { success: true, url };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log(`❌ Connection failed to: ${url}`, errorMessage);
    }
  }

  return { success: false };
};

// User Data Types
export interface UserProfile {
  id: string;
  email: string;
  password?: string; // Only for registration, not stored in frontend
  firebaseId?: string;
  isGoogleLogin: boolean;
  displayName: string;
  profilePicture?: string;
  createdAt: string;
  lastLoginAt: string;
}

export interface UserGameData {
  userId: string;
  totalScore: number;
  highScore: number;
  totalCoins: number;
  currentLevel: number;
  gamesPlayed: number;
  gamesWon: number;
  abilities: Record<string, number>;
  achievements: string[];
  completedLevels: number[];
  levelStars: Record<number, number>;
  totalAdEarnings?: number;
  lastPlayedAt: string;
}

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  profilePicture?: string;
  highScore: number;
  totalScore: number;
  gamesWon: number;
  rank: number;
}

export interface GameSession {
  sessionId: string;
  userId: string;
  level: number;
  score: number;
  moves: number;
  stars: number;
  abilitiesUsed: {
    lightning: number;
    bomb: number;
    freeze: number;
    fire: number;
  };
  coinsEarned: number;
  duration: number; // in seconds
  completedAt: string;
}

export interface AbilityConfig {
  id: string;
  name: string;
  displayName: string;
  description: string;
  icon: string;
  effect: 'destroyRow' | 'destroyNeighbors' | 'freezeColumn' | 'burnObstacles';
  pointsPerBubble: number;
  price: number;
  startingCount: number;
  sortOrder: number;
}

export interface ShopItem {
  _id: string;
  name: string;
  displayName: string;
  description: string;
  type: 'ability' | 'bundle' | 'subscription';
  icon: string;
  color: string;
  priceCoins: number;
  priceMoney: number;
  currency: string;
  items?: Array<{
    abilityName: string;
    quantity: number;
  }>;
  coinReward?: number;
  subscriptionDays?: number;
  features?: string[];
  sortOrder: number;
}

export interface LevelReward {
  _id: string;
  userId: string;
  level: number;
  stars: number;
  coinsAwarded: number;
  rewardClaimed: boolean;
  claimedAt: string;
  score: number;
}

export interface RewardHistoryItem {
  _id: string;
  email: string;
  level: number;
  reward: number; // Renamed from scoreEarning
  scoreEarning?: number; // Legacy support
  coins: number;
  stars?: number; // Added
  score?: number; // Added
  status: 'claimed' | 'withdrawn';
  date: string;
  createdDate: string;
  withdrawnDate?: string;
}

export interface WithdrawHistoryItem {
  _id: string;
  email: string;
  reward: number; // Renamed from scoreEarning
  scoreEarning?: number; // Legacy support
  status: 'pending' | 'completed' | 'rejected';
  date: string;
  createdDate: string;
}

export interface AdConfig {
  platform: 'android' | 'ios';
  appId: string;
  maxAdContentRating: 'G' | 'PG' | 'T' | 'MA';
  tagForUnderAgeOfConsent: boolean;
  tagForChildDirectedTreatment: boolean;
  rewardConfig: {
    coinsPerAd: number;
    abilitiesPerAd: number;
  };
}

export interface GameConfig {
  abilities: AbilityConfig[];
  ads: AdConfig | null;
  gameSettings?: {
    baseCoins: number;
    coinsPerLevelMultiplier: number;
    starBonusBase: number;
    starBonusLevelMultiplier: number;
    completionBonusMultiplier: number;
    scoreRange?: number;
    reward?: number;
  };
  platform: 'android' | 'ios';
  rewardAmount: number;
}

export interface AdUnitsResponse {
  success: boolean;
  ads: {
    banner: string | null;
    rewarded: string | null;
    rewardedList?: string[];
    rewardedAmount?: number;
  };
  fullConfig?: {
    banner: any;
    rewarded: any;
  };
  error?: string;
}


class BackendService {
  private authToken: string | null = null;
  private currentUser: UserProfile | null = null;
  private workingApiUrl: string = API_BASE_URL; // Will be updated after network test

  constructor() {
    this.loadAuthToken();
    // Start network test early
    this.ensureWorkingUrl();
  }

  private async ensureWorkingUrl(): Promise<string> {
    if (this.workingApiUrl === API_BASE_URL) {
      const result = await testNetworkConnection();
      if (result.success && result.url) {
        this.workingApiUrl = result.url;
      }
    }
    return this.workingApiUrl;
  }

  // ============================================================================
  // AUTHENTICATION METHODS
  // ============================================================================

  async loadAuthToken(): Promise<void> {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const user = await AsyncStorage.getItem('currentUser');

      if (token) {
        this.authToken = token;
      }

      if (user) {
        this.currentUser = JSON.parse(user);
      }
    } catch (error) {
      console.error('Error loading auth token:', error);
    }
  }

  async saveAuthToken(token: string, user: UserProfile): Promise<void> {
    try {
      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('currentUser', JSON.stringify(user));
      this.authToken = token;
      this.currentUser = user;
    } catch (error) {
      console.error('Error saving auth token:', error);
    }
  }

  async ensureAuthenticated(firebaseUser: any): Promise<boolean> {
    console.log('🔍 ensureAuthenticated called with user:', firebaseUser?.email || firebaseUser?.displayName || 'Anonymous');
    console.log('🔍 Current isAuthenticated():', this.isAuthenticated());

    if (this.isAuthenticated()) return true;
    if (!firebaseUser) {
      console.log('❌ No Firebase user provided');
      return false;
    }

    console.log('🔑 Logging in with Google...');
    // Handle regular Google users
    const result = await this.loginWithGoogle(
      firebaseUser.uid,
      firebaseUser.email || '',
      firebaseUser.displayName || 'Commander',
      firebaseUser.photoURL || undefined
    );

    console.log('🔍 Login result:', result.success ? 'Success' : `Failed: ${result.error}`);
    return result.success;
  }

  async clearAuthToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('currentUser');
      this.authToken = null;
      this.currentUser = null;
    } catch (error) {
      console.error('Error clearing auth token:', error);
    }
  }

  // Register with email/password
  async registerUser(email: string, password: string, displayName: string): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
    try {
      const baseUrl = await this.ensureWorkingUrl();
      const response = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          displayName,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        await this.saveAuthToken(data.token, data.user);
        return { success: true, user: data.user };
      } else {
        return { success: false, error: data.message || 'Registration failed' };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Network error during registration' };
    }
  }

  // Login with email/password
  async loginUser(email: string, password: string): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
    try {
      const baseUrl = await this.ensureWorkingUrl();
      const response = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        await this.saveAuthToken(data.token, data.user);
        return { success: true, user: data.user };
      } else {
        return { success: false, error: data.message || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error during login' };
    }
  }

  // Google Login
  async loginWithGoogle(firebaseId: string, email: string, displayName: string, profilePicture?: string): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
    try {
      const baseUrl = await this.ensureWorkingUrl();
      const response = await fetch(`${baseUrl}/auth/google-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebaseId,
          email,
          displayName,
          profilePicture,
          isGoogleLogin: true,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        await this.saveAuthToken(data.token, data.user);
        return { success: true, user: data.user };
      } else {
        return { success: false, error: data.message || 'Google login failed' };
      }
    } catch (error) {
      console.error('Google login error:', error);
      return { success: false, error: 'Network error during Google login' };
    }
  }



  // Logout
  async logout(): Promise<void> {
    try {
      if (this.authToken) {
        const baseUrl = await this.ensureWorkingUrl();
        await fetch(`${baseUrl}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.authToken}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await this.clearAuthToken();
    }
  }

  // ============================================================================
  // USER GAME DATA METHODS
  // ============================================================================

  async getUserGameData(): Promise<{ success: boolean; data?: UserGameData; error?: string }> {
    try {
      if (!this.authToken) {
        return { success: false, error: 'Not authenticated' };
      }

      const baseUrl = await this.ensureWorkingUrl();
      const response = await fetch(`${baseUrl}/user/game-data`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, data: data.gameData };
      } else {
        return { success: false, error: data.message || 'Failed to fetch game data' };
      }
    } catch (error) {
      console.error('Get game data error:', error);
      return { success: false, error: 'Network error fetching game data' };
    }
  }

  async updateUserGameData(gameData: Partial<UserGameData>): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.authToken) {
        return { success: false, error: 'Not authenticated' };
      }

      const baseUrl = await this.ensureWorkingUrl();
      const response = await fetch(`${baseUrl}/user/game-data`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(gameData),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true };
      } else {
        return { success: false, error: data.message || 'Failed to update game data' };
      }
    } catch (error) {
      console.error('Update game data error:', error);
      return { success: false, error: 'Network error updating game data' };
    }
  }

  // ============================================================================
  // COINS & ABILITIES METHODS
  // ============================================================================

  async updateCoins(amount: number, operation: 'add' | 'subtract' = 'add', isAdReward: boolean = false): Promise<{ success: boolean; newBalance?: number; previousBalance?: number; error?: string }> {
    try {
      if (!this.authToken) {
        return { success: false, error: 'Not authenticated' };
      }

      const baseUrl = await this.ensureWorkingUrl();
      const response = await fetch(`${baseUrl}/user/coins`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount, operation, isAdReward }),
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          newBalance: data.newBalance,
          previousBalance: data.previousBalance
        };
      } else {
        return { success: false, error: data.message || 'Failed to update coins' };
      }
    } catch (error) {
      console.error('Update coins error:', error);
      return { success: false, error: 'Network error updating coins' };
    }
  }

  async updateAbilities(abilities: Partial<UserGameData['abilities']>): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.authToken) {
        return { success: false, error: 'Not authenticated' };
      }

      const baseUrl = await this.ensureWorkingUrl();
      const response = await fetch(`${baseUrl}/user/abilities`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ abilities }),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true };
      } else {
        return { success: false, error: data.message || 'Failed to update abilities' };
      }
    } catch (error) {
      console.error('Update abilities error:', error);
      return { success: false, error: 'Network error updating abilities' };
    }
  }

  // ============================================================================
  // LEADERBOARD METHODS
  // ============================================================================

  async getLeaderboard(limit: number = 100): Promise<{ success: boolean; leaderboard?: LeaderboardEntry[]; error?: string }> {
    try {
      console.log('🌐 Fetching leaderboard...');

      // Use the working URL directly, or test if needed
      const baseUrl = await this.ensureWorkingUrl();
      const url = `${baseUrl}/leaderboard?limit=${limit}`;
      console.log('📡 Fetching leaderboard from:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add a reasonable timeout
      });

      console.log('📊 Leaderboard response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Leaderboard HTTP error:', response.status, errorText);
        return { success: false, error: `Server error: ${response.status}` };
      }

      const data = await response.json();
      console.log('✅ Leaderboard data received:', data.leaderboard?.length || 0, 'entries');

      if (data.success) {
        return { success: true, leaderboard: data.leaderboard };
      } else {
        return { success: false, error: data.message || 'Failed to fetch leaderboard' };
      }
    } catch (error) {
      console.error('💥 Get leaderboard error:', error);

      if (error instanceof TypeError && error.message.includes('Network request failed')) {
        return { success: false, error: 'Network connection failed. Make sure the backend server is running.' };
      }

      return { success: false, error: error instanceof Error ? error.message : 'Network error fetching leaderboard' };
    }
  }

  async getUserRank(): Promise<{ success: boolean; rank?: number; error?: string }> {
    try {
      if (!this.authToken) {
        return { success: false, error: 'Not authenticated' };
      }

      const baseUrl = await this.ensureWorkingUrl();
      const response = await fetch(`${baseUrl}/user/rank`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, rank: data.rank };
      } else {
        return { success: false, error: data.message || 'Failed to fetch user rank' };
      }
    } catch (error) {
      console.error('Get user rank error:', error);
      return { success: false, error: 'Network error fetching user rank' };
    }
  }

  // ============================================================================
  // GAME SESSION METHODS
  // ============================================================================

  async submitGameSession(session: Omit<GameSession, 'sessionId' | 'userId' | 'completedAt'>): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log('🎮 submitGameSession called');
      console.log('🔍 Auth token exists:', !!this.authToken);
      console.log('🔍 Session data:', session);
      console.log('💰 Submitting coinsEarned:', session.coinsEarned);

      if (!this.authToken) {
        console.log('❌ No auth token available');
        return { success: false, error: 'Not authenticated' };
      }

      const baseUrl = await this.ensureWorkingUrl();
      console.log('🌐 Using API URL:', baseUrl);

      const response = await fetch(`${baseUrl}/game/session`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(session),
      });

      console.log('📡 Response status:', response.status);
      const data = await response.json();
      console.log('📡 Response data:', data);

      if (response.ok) {
        return {
          success: true,
          data: {
            sessionId: data.sessionId,
            coinsEarned: data.coinsEarned,
            updatedGameData: data.updatedGameData,
            newAchievements: data.newAchievements // Also useful to have
          }
        };
      } else {
        return { success: false, error: data.message || 'Failed to submit game session' };
      }
    } catch (error) {
      console.error('Submit game session error:', error);
      return { success: false, error: 'Network error submitting game session' };
    }
  }

  async updateGameProgress(progress: { level: number; score: number; moves: number; stars: number }): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      if (!this.authToken) {
        return { success: false, error: 'Not authenticated' };
      }

      const baseUrl = await this.ensureWorkingUrl();
      const response = await fetch(`${baseUrl}/game/progress`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(progress),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, data: data.updatedGameData };
      } else {
        return { success: false, error: data.message || 'Failed to update game progress' };
      }
    } catch (error) {
      console.error('Update game progress error:', error);
      return { success: false, error: 'Network error updating game progress' };
    }
  }

  // ============================================================================
  // PURCHASE ABILITIES METHOD
  // ============================================================================

  async purchaseAbilities(ability: 'lightning' | 'bomb' | 'freeze' | 'fire', quantity: number): Promise<{ success: boolean; coinsSpent?: number; newCoinBalance?: number; newAbilityCount?: number; error?: string }> {
    try {
      if (!this.authToken) {
        return { success: false, error: 'Not authenticated' };
      }

      const baseUrl = await this.ensureWorkingUrl();
      const response = await fetch(`${baseUrl}/user/purchase-abilities`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ability, quantity }),
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          coinsSpent: data.coinsSpent,
          newCoinBalance: data.newCoinBalance,
          newAbilityCount: data.newAbilityCount
        };
      } else {
        return { success: false, error: data.message || 'Failed to purchase abilities' };
      }
    } catch (error) {
      console.error('Purchase abilities error:', error);
      return { success: false, error: 'Network error purchasing abilities' };
    }
  }

  // ============================================================================
  // NEW SHOP METHODS
  // ============================================================================

  async getShopItems(): Promise<{ success: boolean; items?: ShopItem[]; error?: string }> {
    try {
      const baseUrl = await this.ensureWorkingUrl();
      const response = await fetch(`${baseUrl}/shop`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, items: data.data };
      } else {
        return { success: false, error: data.message || 'Failed to fetch shop items' };
      }
    } catch (error) {
      console.error('Get shop items error:', error);
      return { success: false, error: 'Network error fetching shop items' };
    }
  }

  async purchaseShopItem(itemId: string, paymentMethod: 'coins' | 'money'): Promise<{
    success: boolean;
    newCoinBalance?: number;
    abilities?: Record<string, number>;
    subscription?: any;
    error?: string;
  }> {
    try {
      if (!this.authToken) {
        return { success: false, error: 'Not authenticated' };
      }

      const baseUrl = await this.ensureWorkingUrl();
      const response = await fetch(`${baseUrl}/shop/purchase`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itemId, paymentMethod }),
      });

      const data = await response.json();
      console.log('🛒 Purchase response data:', data);

      if (response.ok) {
        return {
          success: true,
          newCoinBalance: data.newCoinBalance,
          abilities: data.abilities,
          subscription: data.subscription
        };
      } else {
        return { success: false, error: data.message || 'Purchase failed' };
      }
    } catch (error) {
      console.error('Purchase shop item error:', error);
      return { success: false, error: 'Network error purchasing shop item' };
    }
  }

  // ============================================================================
  // CONFIG METHODS
  // ============================================================================

  async getAbilitiesConfig(): Promise<{ success: boolean; abilities?: AbilityConfig[]; error?: string }> {
    try {
      const baseUrl = await this.ensureWorkingUrl();
      const response = await fetch(`${baseUrl}/config/abilities`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, abilities: data.abilities };
      } else {
        return { success: false, error: data.message || 'Failed to fetch abilities config' };
      }
    } catch (error) {
      console.error('Get abilities config error:', error);
      return { success: false, error: 'Network error fetching abilities config' };
    }
  }

  async getAdConfig(platform: 'android' | 'ios' = 'android'): Promise<{ success: boolean; adConfig?: AdConfig; error?: string }> {
    try {
      const baseUrl = await this.ensureWorkingUrl();
      const response = await fetch(`${baseUrl}/config/ads?platform=${platform}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, adConfig: data.adConfig };
      } else {
        return { success: false, error: data.message || 'Failed to fetch ad config' };
      }
    } catch (error) {
      console.error('Get ad config error:', error);
      return { success: false, error: 'Network error fetching ad config' };
    }
  }

  async getGameConfig(platform: 'android' | 'ios' = 'android'): Promise<{ success: boolean; config?: GameConfig; error?: string }> {
    try {
      const baseUrl = await this.ensureWorkingUrl();
      const response = await fetch(`${baseUrl}/config/game?platform=${platform}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, config: data.config };
      } else {
        return { success: false, error: data.message || 'Failed to fetch game config' };
      }
    } catch (error) {
      console.error('Get game config error:', error);
      return { success: false, error: 'Network error fetching game config' };
    }
  }

  async getAdUnits(platform: 'android' | 'ios' = 'android'): Promise<AdUnitsResponse> {
    try {
      const baseUrl = await this.ensureWorkingUrl();
      const response = await fetch(`${baseUrl}/config/ad-units?platform=${platform}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('Ad units response data:', data);

      if (response.ok) {
        return { success: true, ads: data.ads, fullConfig: data.fullConfig };
      } else {
        return { success: false, ads: { banner: null, rewarded: null }, error: data.message || 'Failed to fetch ad units' };
      }
    } catch (error) {
      console.error('Get ad units error:', error);
      return { success: false, ads: { banner: null, rewarded: null }, error: 'Network error fetching ad units' };
    }
  }

  // Force fetch fresh ad units from database (bypasses any server-side caching)
  async getFreshAdUnits(platform: 'android' | 'ios' = 'android'): Promise<AdUnitsResponse> {
    try {
      const baseUrl = await this.ensureWorkingUrl();
      // Add timestamp to bypass any potential caching
      const timestamp = Date.now();
      const response = await fetch(`${baseUrl}/config/ad-units?platform=${platform}&_t=${timestamp}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
      });

      const data = await response.json();
      console.log('Fresh ad units response data:', data);

      if (response.ok) {
        return { success: true, ads: data.ads, fullConfig: data.fullConfig };
      } else {
        return { success: false, ads: { banner: null, rewarded: null }, error: data.message || 'Failed to fetch fresh ad units' };
      }
    } catch (error) {
      console.error('Get fresh ad units error:', error);
      return { success: false, ads: { banner: null, rewarded: null }, error: 'Network error fetching fresh ad units' };
    }
  }


  // ============================================================================
  // ABILITY MANAGEMENT METHODS
  // ============================================================================

  async getAllAbilities(filters?: {
    isActive?: boolean;
  }): Promise<{ success: boolean; data?: any[]; count?: number; filter?: any; error?: string }> {
    try {
      const baseUrl = await this.ensureWorkingUrl();
      const queryParams = new URLSearchParams();

      if (filters?.isActive !== undefined) queryParams.append('isActive', filters.isActive.toString());

      const url = `${baseUrl}/ability${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, data: data.data, count: data.count, filter: data.filter };
      } else {
        return { success: false, error: data.message || 'Failed to fetch abilities' };
      }
    } catch (error) {
      console.error('Get all abilities error:', error);
      return { success: false, error: 'Network error fetching abilities' };
    }
  }

  async getAbilityById(id: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const baseUrl = await this.ensureWorkingUrl();
      const response = await fetch(`${baseUrl}/ability/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, data: data.data };
      } else {
        return { success: false, error: data.message || 'Failed to fetch ability' };
      }
    } catch (error) {
      console.error('Get ability by ID error:', error);
      return { success: false, error: 'Network error fetching ability' };
    }
  }

  async getAbilityByName(name: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const baseUrl = await this.ensureWorkingUrl();
      const response = await fetch(`${baseUrl}/ability/name/${name}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, data: data.data };
      } else {
        return { success: false, error: data.message || 'Failed to fetch ability' };
      }
    } catch (error) {
      console.error('Get ability by name error:', error);
      return { success: false, error: 'Network error fetching ability' };
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
      const baseUrl = await this.ensureWorkingUrl();
      const response = await fetch(`${baseUrl}/ability`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(abilityData),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, data: data.data };
      } else {
        return { success: false, error: data.message || 'Failed to create ability' };
      }
    } catch (error) {
      console.error('Create ability error:', error);
      return { success: false, error: 'Network error creating ability' };
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
      const baseUrl = await this.ensureWorkingUrl();
      const response = await fetch(`${baseUrl}/ability/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, data: data.data };
      } else {
        return { success: false, error: data.message || 'Failed to update ability' };
      }
    } catch (error) {
      console.error('Update ability error:', error);
      return { success: false, error: 'Network error updating ability' };
    }
  }

  async deleteAbility(id: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const baseUrl = await this.ensureWorkingUrl();
      const response = await fetch(`${baseUrl}/ability/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, data: data.data };
      } else {
        return { success: false, error: data.message || 'Failed to delete ability' };
      }
    } catch (error) {
      console.error('Delete ability error:', error);
      return { success: false, error: 'Network error deleting ability' };
    }
  }

  async initializeAbilities(): Promise<{ success: boolean; results?: any[]; error?: string }> {
    try {
      const baseUrl = await this.ensureWorkingUrl();
      const response = await fetch(`${baseUrl}/ability/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, results: data.results };
      } else {
        return { success: false, error: data.message || 'Failed to initialize abilities' };
      }
    } catch (error) {
      console.error('Initialize abilities error:', error);
      return { success: false, error: 'Network error initializing abilities' };
    }
  }

  async resetAbilities(): Promise<{ success: boolean; data?: any[]; count?: number; error?: string }> {
    try {
      const baseUrl = await this.ensureWorkingUrl();
      const response = await fetch(`${baseUrl}/ability/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, data: data.data, count: data.count };
      } else {
        return { success: false, error: data.message || 'Failed to reset abilities' };
      }
    } catch (error) {
      console.error('Reset abilities error:', error);
      return { success: false, error: 'Network error resetting abilities' };
    }
  }

  // ============================================================================
  // AD CONFIG MANAGEMENT METHODS
  // ============================================================================

  async getAllAdConfigs(): Promise<{ success: boolean; data?: any[]; count?: number; error?: string }> {
    try {
      const baseUrl = await this.ensureWorkingUrl();
      const response = await fetch(`${baseUrl}/adconfig`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, data: data.data, count: data.count };
      } else {
        return { success: false, error: data.message || 'Failed to fetch ad configurations' };
      }
    } catch (error) {
      console.error('Get all ad configs error:', error);
      return { success: false, error: 'Network error fetching ad configurations' };
    }
  }

  async getAdConfigByPlatform(platform: 'android' | 'ios'): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const baseUrl = await this.ensureWorkingUrl();
      const response = await fetch(`${baseUrl}/adconfig/${platform}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, data: data.data };
      } else {
        return { success: false, error: data.message || 'Failed to fetch ad configuration' };
      }
    } catch (error) {
      console.error('Get ad config by platform error:', error);
      return { success: false, error: 'Network error fetching ad configuration' };
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
      const baseUrl = await this.ensureWorkingUrl();
      const response = await fetch(`${baseUrl}/adconfig`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(configData),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, data: data.data };
      } else {
        return { success: false, error: data.message || 'Failed to create ad configuration' };
      }
    } catch (error) {
      console.error('Create ad config error:', error);
      return { success: false, error: 'Network error creating ad configuration' };
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
      const baseUrl = await this.ensureWorkingUrl();
      const response = await fetch(`${baseUrl}/adconfig/${platform}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, data: data.data };
      } else {
        return { success: false, error: data.message || 'Failed to update ad configuration' };
      }
    } catch (error) {
      console.error('Update ad config error:', error);
      return { success: false, error: 'Network error updating ad configuration' };
    }
  }

  async deleteAdConfig(platform: 'android' | 'ios'): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const baseUrl = await this.ensureWorkingUrl();
      const response = await fetch(`${baseUrl}/adconfig/${platform}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, data: data.data };
      } else {
        return { success: false, error: data.message || 'Failed to delete ad configuration' };
      }
    } catch (error) {
      console.error('Delete ad config error:', error);
      return { success: false, error: 'Network error deleting ad configuration' };
    }
  }

  async initializeAdConfigs(): Promise<{ success: boolean; results?: any[]; error?: string }> {
    try {
      const baseUrl = await this.ensureWorkingUrl();
      const response = await fetch(`${baseUrl}/adconfig/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, results: data.results };
      } else {
        return { success: false, error: data.message || 'Failed to initialize ad configurations' };
      }
    } catch (error) {
      console.error('Initialize ad configs error:', error);
      return { success: false, error: 'Network error initializing ad configurations' };
    }
  }

  async resetAdConfigs(): Promise<{ success: boolean; data?: any[]; count?: number; error?: string }> {
    try {
      const baseUrl = await this.ensureWorkingUrl();
      const response = await fetch(`${baseUrl}/adconfig/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, data: data.data, count: data.count };
      } else {
        return { success: false, error: data.message || 'Failed to reset ad configurations' };
      }
    } catch (error) {
      console.error('Reset ad configs error:', error);
      return { success: false, error: 'Network error resetting ad configurations' };
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
      const baseUrl = await this.ensureWorkingUrl();
      const queryParams = new URLSearchParams();

      if (filters?.platform) queryParams.append('platform', filters.platform);
      if (filters?.adType) queryParams.append('adType', filters.adType);
      if (filters?.isActive !== undefined) queryParams.append('isActive', filters.isActive.toString());

      const url = `${baseUrl}/adunit${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, data: data.data, count: data.count, filter: data.filter };
      } else {
        return { success: false, error: data.message || 'Failed to fetch ad units' };
      }
    } catch (error) {
      console.error('Get all ad units error:', error);
      return { success: false, error: 'Network error fetching ad units' };
    }
  }

  async getAdUnitById(id: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const baseUrl = await this.ensureWorkingUrl();
      const response = await fetch(`${baseUrl}/adunit/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, data: data.data };
      } else {
        return { success: false, error: data.message || 'Failed to fetch ad unit' };
      }
    } catch (error) {
      console.error('Get ad unit by ID error:', error);
      return { success: false, error: 'Network error fetching ad unit' };
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
      const baseUrl = await this.ensureWorkingUrl();
      const response = await fetch(`${baseUrl}/adunit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(unitData),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, data: data.data };
      } else {
        return { success: false, error: data.message || 'Failed to create ad unit' };
      }
    } catch (error) {
      console.error('Create ad unit error:', error);
      return { success: false, error: 'Network error creating ad unit' };
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
      const baseUrl = await this.ensureWorkingUrl();
      const response = await fetch(`${baseUrl}/adunit/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, data: data.data };
      } else {
        return { success: false, error: data.message || 'Failed to update ad unit' };
      }
    } catch (error) {
      console.error('Update ad unit error:', error);
      return { success: false, error: 'Network error updating ad unit' };
    }
  }

  async deleteAdUnit(id: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const baseUrl = await this.ensureWorkingUrl();
      const response = await fetch(`${baseUrl}/adunit/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, data: data.data };
      } else {
        return { success: false, error: data.message || 'Failed to delete ad unit' };
      }
    } catch (error) {
      console.error('Delete ad unit error:', error);
      return { success: false, error: 'Network error deleting ad unit' };
    }
  }

  async getBestAdUnit(platform: 'android' | 'ios', adType: 'banner' | 'rewarded'): Promise<{ success: boolean; data?: any; adId?: string; error?: string }> {
    try {
      const baseUrl = await this.ensureWorkingUrl();
      const response = await fetch(`${baseUrl}/adunit/best/${platform}/${adType}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, data: data.data, adId: data.adId };
      } else {
        return { success: false, error: data.message || 'Failed to fetch best ad unit' };
      }
    } catch (error) {
      console.error('Get best ad unit error:', error);
      return { success: false, error: 'Network error fetching best ad unit' };
    }
  }

  async initializeAdUnits(): Promise<{ success: boolean; results?: any[]; error?: string }> {
    try {
      const baseUrl = await this.ensureWorkingUrl();
      const response = await fetch(`${baseUrl}/adunit/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, results: data.results };
      } else {
        return { success: false, error: data.message || 'Failed to initialize ad units' };
      }
    } catch (error) {
      console.error('Initialize ad units error:', error);
      return { success: false, error: 'Network error initializing ad units' };
    }
  }

  async resetAdUnits(): Promise<{ success: boolean; data?: any[]; count?: number; error?: string }> {
    try {
      const baseUrl = await this.ensureWorkingUrl();
      const response = await fetch(`${baseUrl}/adunit/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, data: data.data, count: data.count };
      } else {
        return { success: false, error: data.message || 'Failed to reset ad units' };
      }
    } catch (error) {
      console.error('Reset ad units error:', error);
      return { success: false, error: 'Network error resetting ad units' };
    }
  }

  // ============================================================================
  // REWARD METHODS
  // ============================================================================

  async getRewardHistory(limit: number = 50): Promise<{ success: boolean; rewards?: LevelReward[]; totalCoins?: number; error?: string }> {
    try {
      if (!this.authToken) {
        return { success: false, error: 'Not authenticated' };
      }

      const baseUrl = await this.ensureWorkingUrl();
      const response = await fetch(`${baseUrl}/rewards/history?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          rewards: data.rewards,
          totalCoins: data.totalCoins
        };
      } else {
        return { success: false, error: data.message || 'Failed to fetch reward history' };
      }
    } catch (error) {
      console.error('Get reward history error:', error);
      return { success: false, error: 'Network error fetching reward history' };
    }
  }

  async checkLevelReward(level: number): Promise<{ success: boolean; claimed?: boolean; reward?: LevelReward; error?: string }> {
    try {
      if (!this.authToken) {
        return { success: false, error: 'Not authenticated' };
      }

      const baseUrl = await this.ensureWorkingUrl();
      const response = await fetch(`${baseUrl}/rewards/level/${level}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          claimed: data.claimed,
          reward: data.reward
        };
      } else {
        return { success: false, error: data.message || 'Failed to check level reward' };
      }
    } catch (error) {
      console.error('Check level reward error:', error);
      return { success: false, error: 'Network error checking level reward' };
    }
  }

  async getRewardStats(): Promise<{ success: boolean; stats?: any; error?: string }> {
    try {
      if (!this.authToken) {
        return { success: false, error: 'Not authenticated' };
      }

      const baseUrl = await this.ensureWorkingUrl();
      const response = await fetch(`${baseUrl}/rewards/stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, stats: data.stats };
      } else {
        return { success: false, error: data.message || 'Failed to fetch reward stats' };
      }
    } catch (error) {
      console.error('Get reward stats error:', error);
      return { success: false, error: 'Network error fetching reward stats' };
    }
  }

  async getRewardHistoryOnly(): Promise<{ success: boolean; history?: RewardHistoryItem[]; error?: string }> {
    try {
      if (!this.authToken) {
        return { success: false, error: 'Not authenticated' };
      }

      const baseUrl = await this.ensureWorkingUrl();
      const response = await fetch(`${baseUrl}/withdraw/reward-history`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, history: data.history };
      } else {
        return { success: false, error: data.message || 'Failed to fetch reward history' };
      }
    } catch (error) {
      console.error('Get reward history only error:', error);
      return { success: false, error: 'Network error fetching reward history' };
    }
  }

  async getWithdrawHistoryOnly(): Promise<{ success: boolean; history?: WithdrawHistoryItem[]; error?: string }> {
    try {
      if (!this.authToken) {
        return { success: false, error: 'Not authenticated' };
      }

      const baseUrl = await this.ensureWorkingUrl();
      const response = await fetch(`${baseUrl}/withdraw/withdraw-history`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, history: data.history };
      } else {
        return { success: false, error: data.message || 'Failed to fetch withdraw history' };
      }
    } catch (error) {
      console.error('Get withdraw history only error:', error);
      return { success: false, error: 'Network error fetching withdraw history' };
    }
  }

  async requestWithdrawal(): Promise<{ success: boolean; amount?: number; error?: string }> {
    try {
      if (!this.authToken) {
        return { success: false, error: 'Not authenticated' };
      }

      const baseUrl = await this.ensureWorkingUrl();
      const response = await fetch(`${baseUrl}/withdraw/request`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, amount: data.amount };
      } else {
        return { success: false, error: data.message || 'Withdrawal request failed' };
      }
    } catch (error) {
      console.error('Request withdrawal error:', error);
      return { success: false, error: 'Network error requesting withdrawal' };
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  getCurrentUser(): UserProfile | null {
    return this.currentUser;
  }

  isAuthenticated(): boolean {
    return this.authToken !== null && this.currentUser !== null;
  }

  getAuthToken(): string | null {
    return this.authToken;
  }
}

export default new BackendService();
