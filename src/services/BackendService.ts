import AsyncStorage from '@react-native-async-storage/async-storage';

// Backend API Configuration
const API_BASE_URL = __DEV__
  ? 'http://localhost:3001/api' // Development - localhost first
  : 'https://your-production-api.com/api'; // Production URL

// Fallback URL for emulators and devices
const API_FALLBACK_URL = 'http://10.0.2.2:3001/api'; // Android emulator localhost
const API_DEVICE_URL = 'http://192.168.1.71:3001/api'; // For physical devices on network

// Network test function with fallback URLs
const testNetworkConnection = async (): Promise<{ success: boolean; url?: string }> => {
  const urlsToTest = [
    API_BASE_URL,
    API_FALLBACK_URL,
    API_DEVICE_URL
  ];

  for (const url of urlsToTest) {
    try {
      console.log(`🧪 Testing connection to: ${url}`);

      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 3000)
      );

      const fetchPromise = fetch(`${url}/health`, {
        method: 'GET',
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
  abilities: {
    lightning: number;
    bomb: number;
    freeze: number;
    fire: number;
  };
  achievements: string[];
  completedLevels: number[];
  levelStars: Record<number, number>;
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
    if (this.isAuthenticated()) return true;
    if (!firebaseUser) return false;

    console.log('🔄 Auto-syncing with backend...', firebaseUser.email);
    const result = await this.loginWithGoogle(
      firebaseUser.uid,
      firebaseUser.email || '',
      firebaseUser.displayName || 'Commander',
      firebaseUser.photoURL || undefined
    );

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

  async updateCoins(amount: number, operation: 'add' | 'subtract' = 'add'): Promise<{ success: boolean; newBalance?: number; error?: string }> {
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
        body: JSON.stringify({ amount, operation }),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, newBalance: data.newBalance };
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
      if (!this.authToken) {
        return { success: false, error: 'Not authenticated' };
      }

      const baseUrl = await this.ensureWorkingUrl();
      const response = await fetch(`${baseUrl}/game/session`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(session),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, data: { sessionId: data.sessionId } };
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