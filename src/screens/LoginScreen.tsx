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
import SpaceBackground from '../components/common/SpaceBackground';
import MaterialIcon from '../components/common/MaterialIcon';
import { GAME_ICONS, ICON_COLORS, ICON_SIZES } from '../config/icons';
import { AuthService } from '../services/AuthService';
import ToastNotification, { ToastRef } from '../components/common/ToastNotification';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState<'login'>('login');
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      await AuthService.signInWithGoogle();
      toastRef.current?.show('Signed in with Google!', 'success');
      onLoginSuccess();
    } catch (error: any) {
      if (error.message !== 'Sign-in was cancelled') {
        toastRef.current?.show(error.message, 'error');
      }
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
            <Text style={styles.gameTitle}>SHIBA INU</Text>
            <Text style={styles.gameSubtitle}>EARNING MACHINE</Text>
          </View>

          {/* Sign In Header */}


          {/* Tab Content */}
          <View style={styles.contentContainer}>
            {/* Login Content */}
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
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <MaterialIcon
                    name={showPassword ? "visibility-off" : "visibility"}
                    family="material"
                    size={ICON_SIZES.MEDIUM}
                    color={ICON_COLORS.SECONDARY}
                  />
                </TouchableOpacity>
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
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeIcon}
                  >
                    <MaterialIcon
                      name={showConfirmPassword ? "visibility-off" : "visibility"}
                      family="material"
                      size={ICON_SIZES.MEDIUM}
                      color={ICON_COLORS.SECONDARY}
                    />
                  </TouchableOpacity>
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

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                style={styles.googleButton}
                onPress={handleGoogleAuth}
                disabled={loading}
              >
                <MaterialIcon
                  name="google"
                  family="material-community"
                  size={ICON_SIZES.MEDIUM}
                  color={ICON_COLORS.WHITE}
                />
                <Text style={styles.googleButtonText}>
                  {isSignUp ? 'SIGN UP WITH GOOGLE' : 'SIGN IN WITH GOOGLE'}
                </Text>
              </TouchableOpacity>
            </View>
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
    justifyContent: 'center',
    gap: 30,
    minHeight: SCREEN_HEIGHT - 40, // Account for padding
  },

  // Title Section - Compact
  titleSection: {
    alignItems: 'center',
  },
  titleSpaceship: {
    width: 60,
    height: 60,
    marginBottom: 5,
  },
  gameTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#00E0FF',
    letterSpacing: 3,
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
  eyeIcon: {
    padding: 8,
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

  switchButton: {
    alignItems: 'center',
    marginTop: 10,
  },
  switchButtonText: {
    color: '#00E0FF',
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  dividerText: {
    color: 'rgba(255, 255, 255, 0.5)',
    paddingHorizontal: 10,
    fontSize: 10,
    fontWeight: 'bold',
  },
  googleButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    gap: 10,
  },
  googleButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default LoginScreen;