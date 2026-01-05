import AsyncStorage from '@react-native-async-storage/async-storage';
import BackendService from './BackendService';

interface OfflineUser {
  uid: string;
  email: string;
  displayName: string;
  isOffline: true;
}

export class OfflineAuthService {
  private static readonly OFFLINE_USER_KEY = 'offline_user';
  private static readonly OFFLINE_TOKEN_KEY = 'offline_token';

  // Sign up with backend only (offline mode)
  static async signUpOffline(email: string, password: string, displayName: string): Promise<OfflineUser> {
    try {
      const result = await BackendService.registerUser(email, password, displayName);
      
      if (result.success && result.user) {
        const offlineUser: OfflineUser = {
          uid: result.user.id,
          email: result.user.email,
          displayName: result.user.displayName,
          isOffline: true
        };

        // Store offline user data
        await AsyncStorage.setItem(this.OFFLINE_USER_KEY, JSON.stringify(offlineUser));
        
        return offlineUser;
      } else {
        throw new Error(result.error || 'Registration failed');
      }
    } catch (error: any) {
      console.error('Offline signup error:', error);
      throw error;
    }
  }

  // Sign in with backend only (offline mode)
  static async signInOffline(email: string, password: string): Promise<OfflineUser> {
    try {
      const result = await BackendService.loginUser(email, password);
      
      if (result.success && result.user) {
        const offlineUser: OfflineUser = {
          uid: result.user.id,
          email: result.user.email,
          displayName: result.user.displayName,
          isOffline: true
        };

        // Store offline user data
        await AsyncStorage.setItem(this.OFFLINE_USER_KEY, JSON.stringify(offlineUser));
        
        return offlineUser;
      } else {
        throw new Error(result.error || 'Login failed');
      }
    } catch (error: any) {
      console.error('Offline signin error:', error);
      throw error;
    }
  }

  // Get current offline user
  static async getCurrentOfflineUser(): Promise<OfflineUser | null> {
    try {
      const userData = await AsyncStorage.getItem(this.OFFLINE_USER_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting offline user:', error);
      return null;
    }
  }

  // Sign out offline user
  static async signOutOffline(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.OFFLINE_USER_KEY);
      await AsyncStorage.removeItem(this.OFFLINE_TOKEN_KEY);
    } catch (error) {
      console.error('Error signing out offline user:', error);
    }
  }

  // Check if user is in offline mode
  static async isOfflineMode(): Promise<boolean> {
    try {
      const userData = await AsyncStorage.getItem(this.OFFLINE_USER_KEY);
      return userData !== null;
    } catch (error) {
      return false;
    }
  }
}