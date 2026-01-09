/**
 * Bubble Shooter Game App
 * @format
 */

import React, { useState, useEffect } from 'react';
import { StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
import {
  SafeAreaProvider,
} from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import mobileAds, { MaxAdContentRating } from 'react-native-google-mobile-ads';
import LoadingScreen from './src/components/LoadingScreen';
import Roadmap from './src/components/Roadmap';
import LoginScreen from './src/components/LoginScreen';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import ConfigService from './src/services/ConfigService';

function App() {
  useEffect(() => {
    // Initialize AdMob with dynamic configuration
    const initialize = async () => {
      try {
        console.log('🔧 Initializing AdMob with dynamic configuration...');

        // Get ad configuration from backend
        const adConfig = await ConfigService.getAdConfig();

        // Initialize AdMob
        const adapterStatuses = await mobileAds().initialize();
        console.log('✅ AdMob initialized successfully');

        // Set request configuration from backend config
        await mobileAds().setRequestConfiguration({
          maxAdContentRating: adConfig.maxAdContentRating as any,
          tagForUnderAgeOfConsent: adConfig.tagForUnderAgeOfConsent,
          tagForChildDirectedTreatment: adConfig.tagForChildDirectedTreatment,
        });

        console.log('🎯 AdMob request configuration set');

      } catch (error) {
        console.error('❌ AdMob initialization failed:', error);

        // Fallback to basic initialization
        try {
          await mobileAds().initialize();
          await mobileAds().setRequestConfiguration({
            maxAdContentRating: MaxAdContentRating.G,
            tagForUnderAgeOfConsent: false,
            tagForChildDirectedTreatment: false,
          });
          console.log('✅ AdMob initialized with fallback configuration');
        } catch (fallbackError) {
          console.error('❌ AdMob fallback initialization failed:', fallbackError);
        }
      }
    };

    initialize();
  }, []);

  return (
    <AuthProvider>
      <AppWrapper />
    </AuthProvider>
  );
}

function AppWrapper() {
  const isDarkMode = useColorScheme() === 'dark';
  const [isLoading, setIsLoading] = useState(true);
  const [showMainApp, setShowMainApp] = useState(false);
  const { user, loading: authLoading } = useAuth();

  const handleLoadingComplete = () => {
    setIsLoading(false);
    // Small delay before showing main app for smooth transition
    setTimeout(() => {
      setShowMainApp(true);
    }, 100);
  };

  const handleLoginSuccess = () => {
    // User is now authenticated, the auth context will handle the state
  };

  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <View style={styles.loadingContainer}>
            <LoadingScreen onLoadingComplete={() => { }} />
          </View>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  // Show login screen if user is not authenticated
  if (!user) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
          <LoginScreen onLoginSuccess={handleLoginSuccess} />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

        {/* Main App Content - Only render once */}
        <AppContent />

        {/* Loading Screen Overlay */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <LoadingScreen onLoadingComplete={handleLoadingComplete} />
          </View>
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function AppContent() {
  return (
    <View style={styles.container}>
      <Roadmap />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
});

export default App;
