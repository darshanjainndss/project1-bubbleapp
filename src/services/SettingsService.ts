import AsyncStorage from '@react-native-async-storage/async-storage';
import { Vibration, Platform } from 'react-native';

export interface UserSettings {
  vibrationEnabled: boolean;
  soundEnabled: boolean;
  musicEnabled: boolean;
}

const SETTINGS_KEY = 'user_settings';

const DEFAULT_SETTINGS: UserSettings = {
  vibrationEnabled: true,
  soundEnabled: true,
  musicEnabled: true,
};

class SettingsService {
  private settings: UserSettings = DEFAULT_SETTINGS;
  private isLoaded = false;

  // Load settings from storage
  async loadSettings(): Promise<UserSettings> {
    try {
      const stored = await AsyncStorage.getItem(SETTINGS_KEY);
      if (stored) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      } else {
        this.settings = DEFAULT_SETTINGS;
      }
      this.isLoaded = true;
      return this.settings;
    } catch (error) {
      console.error('Error loading settings:', error);
      this.settings = DEFAULT_SETTINGS;
      this.isLoaded = true;
      return this.settings;
    }
  }

  // Save settings to storage
  async saveSettings(newSettings: Partial<UserSettings>): Promise<void> {
    try {
      this.settings = { ...this.settings, ...newSettings };
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }

  // Get current settings
  getSettings(): UserSettings {
    return this.settings;
  }

  // Get specific setting
  getSetting<K extends keyof UserSettings>(key: K): UserSettings[K] {
    return this.settings[key];
  }

  // Update specific setting
  async updateSetting<K extends keyof UserSettings>(key: K, value: UserSettings[K]): Promise<void> {
    await this.saveSettings({ [key]: value } as Partial<UserSettings>);
  }

  // Check if vibration is supported
  isVibrationSupported(): boolean {
    try {
      // On Android, check if Vibration is available
      if (Platform.OS === 'android') {
        return true; // Android supports vibration with proper permission
      }
      // On iOS, vibration is generally available
      if (Platform.OS === 'ios') {
        return true;
      }
      return false;
    } catch (error) {
      console.warn('Vibration support check failed:', error);
      return false;
    }
  }

  // Vibration methods
  isVibrationEnabled(): boolean {
    return this.settings.vibrationEnabled && this.isVibrationSupported();
  }

  async setVibrationEnabled(enabled: boolean): Promise<void> {
    await this.updateSetting('vibrationEnabled', enabled);
  }

  // Trigger vibration if enabled
  vibrate(pattern?: number | number[]): void {
    if (this.settings.vibrationEnabled) {
      try {
        if (pattern) {
          Vibration.vibrate(pattern);
        } else {
          Vibration.vibrate(100); // Default 100ms vibration
        }
      } catch (error) {
        console.warn('Vibration not available:', error);
      }
    }
  }

  // Quick vibration patterns
  vibrateSuccess(): void {
    try {
      this.vibrate([50, 50, 50]);
    } catch (error) {
      console.warn('Success vibration failed:', error);
    }
  }

  vibrateError(): void {
    try {
      this.vibrate([100, 100, 100, 100, 100]);
    } catch (error) {
      console.warn('Error vibration failed:', error);
    }
  }

  vibrateClick(): void {
    try {
      this.vibrate(50);
    } catch (error) {
      console.warn('Click vibration failed:', error);
    }
  }

  // Bubble blast vibration patterns
  vibrateBubbleBlast(bubbleCount: number = 1): void {
    try {
      if (bubbleCount === 1) {
        // Single bubble pop - short vibration
        this.vibrate(80);
      } else if (bubbleCount <= 5) {
        // Small group - double pulse
        this.vibrate([80, 50, 80]);
      } else if (bubbleCount <= 10) {
        // Medium group - triple pulse
        this.vibrate([100, 40, 80, 40, 100]);
      } else {
        // Large group - intense vibration
        this.vibrate([150, 50, 100, 50, 150, 50, 100]);
      }
    } catch (error) {
      console.warn('Bubble blast vibration failed:', error);
    }
  }

  vibrateChainReaction(): void {
    try {
      // Chain reaction - escalating pattern
      this.vibrate([60, 30, 80, 30, 100, 30, 120]);
    } catch (error) {
      console.warn('Chain reaction vibration failed:', error);
    }
  }

  vibratePowerUp(powerType: string): void {
    try {
      switch (powerType) {
        case 'lightning':
          this.vibrate([50, 30, 100, 30, 150, 30, 200]);
          break;
        case 'bomb':
          this.vibrate([200, 100, 200]);
          break;
        case 'fire':
          this.vibrate([80, 20, 80, 20, 80, 20, 120]);
          break;
        case 'freeze':
          this.vibrate([120, 80, 120]);
          break;
        default:
          this.vibrate(100);
      }
    } catch (error) {
      console.warn('Power-up vibration failed:', error);
    }
  }

  // Ensure settings are loaded
  async ensureLoaded(): Promise<void> {
    if (!this.isLoaded) {
      await this.loadSettings();
    }
  }
}

export default new SettingsService();