import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import LottieView from 'lottie-react-native';
import SpaceBackground from './SpaceBackground';
import MaterialIcon from './MaterialIcon';
import { GAME_ICONS, ICON_COLORS, ICON_SIZES } from '../config/icons';
import { AuthService } from '../services/AuthService';
import ToastNotification, { ToastRef } from './ToastNotification';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'quickplay'>('quickplay');
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [loading, setLoading] = useState(false);
  const toastRef = React.useRef<ToastRef>(null);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 6;
  };

  const handleEmailAuth = async () => {
    if (!validateEmail(email)) {
      toastRef.current?.show('Please enter a valid email address', 'warning');
      return;
    }

    if (!validatePassword(password)) {
      toastRef.current?.show('Password must be at least 6 characters long', 'warning');
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      toastRef.current?.show('Passwords do not match', 'error');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await AuthService.signUpWithEmail(email, password);
        toastRef.current?.show('Account created successfully!', 'success');
      } else {
        await AuthService.signInWithEmail(email, password);
        toastRef.current?.show('Welcome commander!', 'success');
      }
      onLoginSuccess();
    } catch (error: any) {
      toastRef.current?.show(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await AuthService.signInWithGoogle();
      toastRef.current?.show('Google Sign-In Successful!', 'success');
      onLoginSuccess();
    } catch (error: any) {
      toastRef.current?.show(error.message || 'Google Sign-In Failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPlay = async () => {
    if (!playerName.trim()) {
      toastRef.current?.show('Please enter your commander name', 'warning');
      return;
    }

    if (playerName.trim().length < 2) {
      toastRef.current?.show('Commander name must be at least 2 characters long', 'warning');
      return;
    }

    setLoading(true);
    try {
      // Create a temporary guest account or use anonymous auth
      // For now, we'll simulate a quick login
      await new Promise<void>(resolve => setTimeout(() => resolve(), 1000)); // Simulate loading

      // TODO: Set up guest/anonymous authentication with the player name
      // This could store the name locally and create a temporary session

      onLoginSuccess();
    } catch (error: any) {
      Alert.alert('Error', 'Failed to start game. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <SpaceBackground />

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.mainContent}>
          {/* Game Title Header */}
          <View style={styles.titleSection}>
            <LottieView
              source={require('../images/Spaceship.json')}
              autoPlay
              loop
              style={styles.titleSpaceship}
            />
            <Text style={styles.gameTitle}>SPACE</Text>
            <Text style={styles.gameSubtitle}>ADVENTURE</Text>
          </View>

          {/* Tab Selector */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'quickplay' && styles.activeTab]}
              onPress={() => setActiveTab('quickplay')}
            >
              <MaterialIcon
                name={GAME_ICONS.PLAY.name}
                family={GAME_ICONS.PLAY.family}
                size={ICON_SIZES.MEDIUM}
                color={activeTab === 'quickplay' ? ICON_COLORS.WHITE : ICON_COLORS.SECONDARY}
              />
              <Text style={[
                styles.tabText,
                { color: activeTab === 'quickplay' ? '#fff' : 'rgba(255, 255, 255, 0.6)' }
              ]}>
                QUICK PLAY
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'login' && styles.activeTab]}
              onPress={() => setActiveTab('login')}
            >
              <MaterialIcon
                name="login"
                family="material"
                size={ICON_SIZES.MEDIUM}
                color={activeTab === 'login' ? ICON_COLORS.WHITE : ICON_COLORS.SECONDARY}
              />
              <Text style={[
                styles.tabText,
                { color: activeTab === 'login' ? '#fff' : 'rgba(255, 255, 255, 0.6)' }
              ]}>
                SIGN IN
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          <View style={styles.contentContainer}>
            {activeTab === 'quickplay' ? (
              // Quick Play Content
              <View style={styles.quickPlayContent}>
                <Text style={styles.contentTitle}>QUICK PLAY</Text>

                <View style={styles.inputContainer}>
                  <MaterialIcon
                    name="person"
                    family="material"
                    size={ICON_SIZES.MEDIUM}
                    color={ICON_COLORS.SUCCESS}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your commander name"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    value={playerName}
                    onChangeText={setPlayerName}
                    autoCapitalize="words"
                    autoCorrect={false}
                    maxLength={20}
                  />
                </View>

                <TouchableOpacity
                  style={styles.quickPlayButton}
                  onPress={handleQuickPlay}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#000" size="small" />
                  ) : (
                    <>
                      <MaterialIcon
                        name={GAME_ICONS.PLAY.name}
                        family={GAME_ICONS.PLAY.family}
                        size={ICON_SIZES.MEDIUM}
                        color="#000"
                      />
                      <Text style={styles.quickPlayButtonText}>START ADVENTURE</Text>
                    </>
                  )}
                </TouchableOpacity>

                <Text style={styles.quickPlayNote}>
                  Progress won't be saved without an account
                </Text>
              </View>
            ) : (
              // Login Content
              <View style={styles.loginContent}>
                <Text style={styles.contentTitle}>
                  {isSignUp ? 'JOIN THE FLEET' : 'WELCOME BACK'}
                </Text>

                <View style={styles.inputContainer}>
                  <MaterialIcon
                    name="email"
                    family="material"
                    size={ICON_SIZES.MEDIUM}
                    color={ICON_COLORS.SECONDARY}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Email Address"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <MaterialIcon
                    name="lock"
                    family="material"
                    size={ICON_SIZES.MEDIUM}
                    color={ICON_COLORS.SECONDARY}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoCapitalize="none"
                  />
                </View>

                {isSignUp && (
                  <View style={styles.inputContainer}>
                    <MaterialIcon
                      name="lock"
                      family="material"
                      size={ICON_SIZES.MEDIUM}
                      color={ICON_COLORS.SECONDARY}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Confirm Password"
                      placeholderTextColor="rgba(255, 255, 255, 0.5)"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry
                      autoCapitalize="none"
                    />
                  </View>
                )}

                <TouchableOpacity
                  style={styles.loginButton}
                  onPress={handleEmailAuth}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <MaterialIcon
                        name={isSignUp ? "person-add" : "login"}
                        family="material"
                        size={ICON_SIZES.MEDIUM}
                        color={ICON_COLORS.WHITE}
                      />
                      <Text style={styles.loginButtonText}>
                        {isSignUp ? 'CREATE ACCOUNT' : 'SIGN IN'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.googleButton}
                  onPress={handleGoogleSignIn}
                  disabled={loading}
                >
                  <View style={styles.googleIcon}>
                    <Text style={styles.googleIconText}>G</Text>
                  </View>
                  <Text style={styles.googleButtonText}>
                    Continue with Google
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.switchButton}
                  onPress={() => setIsSignUp(!isSignUp)}
                >
                  <Text style={styles.switchButtonText}>
                    {isSignUp
                      ? 'Already a commander? Sign In'
                      : "New recruit? Join the Fleet"
                    }
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
      <ToastNotification ref={toastRef} />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContainer: {
    flexGrow: 1,
    minHeight: SCREEN_HEIGHT,
  },
  mainContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
    minHeight: SCREEN_HEIGHT - 40, // Account for padding
  },

  // Title Section - Compact
  titleSection: {
    alignItems: 'center',
    marginTop: 40,
  },
  titleSpaceship: {
    width: 60,
    height: 60,
    marginBottom: 5,
  },
  gameTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: '#00E0FF',
    letterSpacing: 6,
    textShadowColor: '#00E0FF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  gameSubtitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#00FF88',
    letterSpacing: 3,
    marginTop: -3,
  },

  // Tab System - Compact
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 4,
    marginVertical: 20,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  activeTab: {
    backgroundColor: '#00E0FF',
  },
  tabText: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },

  // Content Container - Flexible
  contentContainer: {
    flex: 1,
    backgroundColor: 'rgba(20, 20, 30, 0.95)',
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 224, 255, 0.3)',
    shadowColor: '#00E0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    justifyContent: 'center',
  },
  contentTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#00E0FF',
    textAlign: 'center',
    marginBottom: 25,
    letterSpacing: 1,
  },

  // Input Styles - Compact
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 15,
    color: '#fff',
  },

  // Quick Play Styles
  quickPlayContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickPlayButton: {
    backgroundColor: '#00FF88', // Neon green background
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00FF88',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 8,
    gap: 10,
    marginVertical: 20,
    width: '100%',
  },
  quickPlayButtonText: {
    color: '#000', // Black text on neon background
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
  },
  quickPlayNote: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 10,
  },

  // Login Styles
  loginContent: {
    justifyContent: 'center',
  },
  loginButton: {
    backgroundColor: '#00E0FF',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#00E0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
    gap: 8,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },

  googleButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 15,
    gap: 10,
  },
  googleIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4285f4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIconText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'Arial',
  },
  googleButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  switchButton: {
    alignItems: 'center',
    marginTop: 10,
  },
  switchButtonText: {
    color: '#00E0FF',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default LoginScreen;