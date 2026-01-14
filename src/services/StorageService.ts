import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserGameData {
  score: number;
  coins: number;
  currentLevel: number;
  completedLevels: number[];
  levelStars: { [levelId: number]: number };
  abilityInventory: {
    lightning: number;
    bomb: number;
    fire: number;
    freeze: number;
  };
  totalStars: number;
  lastPlayedDate: string;
}

export interface LeaderboardEntry {
  email: string;
  username: string;
  score: number;
  level: number;
  coins: number;
  stars: number;
  lastUpdated: string;
}

class StorageService {
  private static readonly USER_DATA_PREFIX = 'user_game_data_';
  private static readonly LEADERBOARD_KEY = 'global_leaderboard';
  private static readonly CURRENT_USER_KEY = 'current_user_id';

  // Default user data for new users
  private static getDefaultUserData(): UserGameData {
    return {
      score: 0, // Start with zero score
      coins: 0, // Start with zero coins
      currentLevel: 1, // Start at level 1
      completedLevels: [], // No completed levels initially
      levelStars: {},
      abilityInventory: {
        lightning: 2,
        bomb: 2,
        fire: 2,
        freeze: 2,
      },
      totalStars: 0,
      lastPlayedDate: new Date().toISOString(),
    };
  }

  // Get user-specific storage key
  private static getUserDataKey(email: string): string {
    return `${this.USER_DATA_PREFIX}${email}`;
  }

  // Save current user email
  static async setCurrentUser(email: string): Promise<void> {
    try {
      await AsyncStorage.setItem(this.CURRENT_USER_KEY, email);
    } catch (error) {
      console.error('Error saving current user:', error);
    }
  }

  // Get current user ID
  static async getCurrentUser(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(this.CURRENT_USER_KEY);
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Load user game data
  static async loadUserData(email: string): Promise<UserGameData> {
    try {
      const key = this.getUserDataKey(email);
      const data = await AsyncStorage.getItem(key);
      
      if (data) {
        const parsedData = JSON.parse(data);
        // Merge with default data to ensure all fields exist
        return { ...this.getDefaultUserData(), ...parsedData };
      }
      
      // Return default data for new users
      const defaultData = this.getDefaultUserData();
      await this.saveUserData(email, defaultData);
      return defaultData;
    } catch (error) {
      console.error('Error loading user data:', error);
      return this.getDefaultUserData();
    }
  }

  // Save user game data
  static async saveUserData(email: string, data: UserGameData): Promise<void> {
    try {
      const key = this.getUserDataKey(email);
      data.lastPlayedDate = new Date().toISOString();
      await AsyncStorage.setItem(key, JSON.stringify(data));
      
      // Also update leaderboard
      await this.updateLeaderboard(email, data);
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  }

  // Update specific fields of user data
  static async updateUserData(
    email: string, 
    updates: Partial<UserGameData>
  ): Promise<UserGameData> {
    try {
      const currentData = await this.loadUserData(email);
      const updatedData = { ...currentData, ...updates };
      await this.saveUserData(email, updatedData);
      return updatedData;
    } catch (error) {
      console.error('Error updating user data:', error);
      return await this.loadUserData(email);
    }
  }

  // Add coins to user
  static async addCoins(email: string, amount: number): Promise<number> {
    try {
      const userData = await this.loadUserData(email);
      userData.coins += amount;
      await this.saveUserData(email, userData);
      return userData.coins;
    } catch (error) {
      console.error('Error adding coins:', error);
      return 0;
    }
  }

  // Spend coins
  static async spendCoins(email: string, amount: number): Promise<boolean> {
    try {
      const userData = await this.loadUserData(email);
      if (userData.coins >= amount) {
        userData.coins -= amount;
        await this.saveUserData(email, userData);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error spending coins:', error);
      return false;
    }
  }

  // Update level completion
  static async completeLevel(
    email: string, 
    level: number, 
    stars: number, 
    scoreEarned: number
  ): Promise<UserGameData> {
    try {
      const userData = await this.loadUserData(email);
      
      // Add to completed levels if not already completed
      if (!userData.completedLevels.includes(level)) {
        userData.completedLevels.push(level);
      }
      
      // Update stars (only if better than previous)
      const previousStars = userData.levelStars[level] || 0;
      if (stars > previousStars) {
        userData.levelStars[level] = stars;
        userData.totalStars += (stars - previousStars);
      }
      
      // Update score
      userData.score += scoreEarned;
      
      // Update current level if this is the next level
      if (level >= userData.currentLevel) {
        userData.currentLevel = level + 1;
      }
      
      await this.saveUserData(email, userData);
      return userData;
    } catch (error) {
      console.error('Error completing level:', error);
      return await this.loadUserData(email);
    }
  }

  // Purchase ability
  static async purchaseAbility(
    email: string, 
    abilityId: keyof UserGameData['abilityInventory'], 
    price: number
  ): Promise<{ success: boolean; newInventory: UserGameData['abilityInventory']; newCoins: number }> {
    try {
      const userData = await this.loadUserData(email);
      
      if (userData.coins >= price) {
        userData.coins -= price;
        userData.abilityInventory[abilityId] += 1;
        await this.saveUserData(email, userData);
        
        return {
          success: true,
          newInventory: userData.abilityInventory,
          newCoins: userData.coins,
        };
      }
      
      return {
        success: false,
        newInventory: userData.abilityInventory,
        newCoins: userData.coins,
      };
    } catch (error) {
      console.error('Error purchasing ability:', error);
      const userData = await this.loadUserData(email);
      return {
        success: false,
        newInventory: userData.abilityInventory,
        newCoins: userData.coins,
      };
    }
  }

  // Use ability
  static async useAbility(
    email: string, 
    abilityId: keyof UserGameData['abilityInventory']
  ): Promise<{ success: boolean; newInventory: UserGameData['abilityInventory'] }> {
    try {
      const userData = await this.loadUserData(email);
      
      if (userData.abilityInventory[abilityId] > 0) {
        userData.abilityInventory[abilityId] -= 1;
        await this.saveUserData(email, userData);
        
        return {
          success: true,
          newInventory: userData.abilityInventory,
        };
      }
      
      return {
        success: false,
        newInventory: userData.abilityInventory,
      };
    } catch (error) {
      console.error('Error using ability:', error);
      const userData = await this.loadUserData(email);
      return {
        success: false,
        newInventory: userData.abilityInventory,
      };
    }
  }

  // Leaderboard functions
  private static async updateLeaderboard(email: string, userData: UserGameData): Promise<void> {
    try {
      // Get current user info (you'll need to pass this from auth context)
      const leaderboard = await this.getLeaderboard();
      
      // Find existing entry or create new one
      const existingIndex = leaderboard.findIndex(entry => entry.email === email);
      
      const leaderboardEntry: LeaderboardEntry = {
        email,
        username: `Player_${email.substring(0, 8)}`, // You can improve this with real usernames
        score: userData.score,
        level: userData.currentLevel,
        coins: userData.coins,
        stars: userData.totalStars,
        lastUpdated: new Date().toISOString(),
      };
      
      if (existingIndex >= 0) {
        leaderboard[existingIndex] = leaderboardEntry;
      } else {
        leaderboard.push(leaderboardEntry);
      }
      
      // Sort by score (descending) and keep top 100
      leaderboard.sort((a, b) => b.score - a.score);
      const topLeaderboard = leaderboard.slice(0, 100);
      
      await AsyncStorage.setItem(this.LEADERBOARD_KEY, JSON.stringify(topLeaderboard));
    } catch (error) {
      console.error('Error updating leaderboard:', error);
    }
  }

  static async getLeaderboard(): Promise<LeaderboardEntry[]> {
    try {
      const data = await AsyncStorage.getItem(this.LEADERBOARD_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      return [];
    }
  }

  // Clear all data (for testing/reset)
  static async clearAllData(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const gameDataKeys = keys.filter(key => 
        key.startsWith(this.USER_DATA_PREFIX) || 
        key === this.LEADERBOARD_KEY ||
        key === this.CURRENT_USER_KEY
      );
      await AsyncStorage.multiRemove(gameDataKeys);
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  }

  // Get all user data keys (for debugging)
  static async getAllUserDataKeys(): Promise<string[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return keys.filter(key => key.startsWith(this.USER_DATA_PREFIX));
    } catch (error) {
      console.error('Error getting user data keys:', error);
      return [];
    }
  }
}

export default StorageService;