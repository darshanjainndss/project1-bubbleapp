/**
 * Bubble Shooter Game App
 * @format
 */

import React, { useState, useRef, useEffect } from 'react';
import { StatusBar, StyleSheet, useColorScheme, View, Animated } from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import LoadingScreen from './src/components/LoadingScreen';
import TransitionScreen from './src/components/TransitionScreen';
import Roadmap from './src/components/Roadmap';
import LoginScreen from './src/components/LoginScreen';
import { AuthProvider, useAuth } from './src/context/AuthContext';

function App() {
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
            <LoadingScreen onLoadingComplete={() => {}} />
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
  const safeAreaInsets = useSafeAreaInsets();

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
    zIndex: 1000,
  },
});

export default App;
