import { auth, GoogleSignin } from '../config/firebase';
import { FirebaseAuthTypes } from '@react-native-firebase/auth';
import BackendService from './BackendService';

export class AuthService {
  // Email/Password Sign Up with fallback
  static async signUpWithEmail(email: string, password: string): Promise<FirebaseAuthTypes.UserCredential> {
    try {
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);

      // Register with backend synchronously to ensure it completes
      try {
        console.log('🔑 Registering with backend...');
        await BackendService.registerUser(email, password, email.split('@')[0], userCredential.user.uid);
        console.log('✅ Backend registration successful');
      } catch (backendError) {
        console.warn('Backend registration failed, but Firebase succeeded:', backendError);
        // Continue anyway - the app will work with Firebase auth only
      }

      return userCredential;
    } catch (error: any) {
      console.error('Email signup error:', error);

      // If Firebase fails, try backend-only registration
      if (error.code === 'auth/network-request-failed' || error.message?.includes('Connection reset')) {
        try {
          console.log('Firebase failed, attempting backend-only registration...');
          // Note: We don't have a firebaseId here since firebase failed
          const result = await BackendService.registerUser(email, password, email.split('@')[0]);
          if (result.success) {
            // Create a mock user credential for consistency
            throw new Error('Registration successful! Please try logging in.');
          }
        } catch (backendError) {
          console.error('Backend registration also failed:', backendError);
        }
      }

      throw new Error(AuthService.getErrorMessage(error.code));
    }
  }

  // Email/Password Sign In with fallback
  static async signInWithEmail(email: string, password: string): Promise<FirebaseAuthTypes.UserCredential> {
    try {
      const userCredential = await auth().signInWithEmailAndPassword(email, password);

      // Authenticate with backend synchronously to ensure it completes
      try {
        console.log('🔑 Authenticating with backend...');
        await BackendService.loginUser(email, password, userCredential.user.uid);
        console.log('✅ Backend authentication successful');
      } catch (backendError) {
        console.warn('Backend login failed, but Firebase succeeded:', backendError);
        // Continue anyway - the app will work with Firebase auth only
      }

      return userCredential;
    } catch (error: any) {
      console.error('Email signin error:', error);

      // If Firebase fails, try backend-only login
      if (error.code === 'auth/network-request-failed' || error.message?.includes('Connection reset')) {
        try {
          console.log('Firebase failed, attempting backend-only login...');
          const result = await BackendService.loginUser(email, password);
          if (result.success) {
            // For backend-only login, we need to handle this differently
            // You might want to store a flag indicating backend-only mode
            throw new Error('Login successful! Backend authentication completed.');
          }
        } catch (backendError) {
          console.error('Backend login also failed:', backendError);
        }
      }

      throw new Error(AuthService.getErrorMessage(error.code));
    }
  }



  // Google Sign In
  static async signInWithGoogle(): Promise<FirebaseAuthTypes.UserCredential> {
    try {
      // Check if your device supports Google Play
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      // Sign out any existing user first to ensure clean state
      try {
        await GoogleSignin.signOut();
      } catch (signOutError) {
        // Ignore sign out errors as user might not be signed in
      }

      // Get the users ID token
      const signInResult = await GoogleSignin.signIn();

      // Extract the ID token from the result
      let idToken: string | null = null;

      if (signInResult && signInResult.data && signInResult.data.idToken) {
        idToken = signInResult.data.idToken;
      }

      if (!idToken) {
        throw new Error('Failed to get ID token from Google Sign-In. Please check your Firebase configuration.');
      }

      // Create a Google credential with the token
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);

      // Sign-in the user with the credential
      const userCredential = await auth().signInWithCredential(googleCredential);

      return userCredential;
    } catch (error: any) {
      // Handle specific Google Sign-In errors
      if (error.code === 'SIGN_IN_CANCELLED' || error.message?.includes('cancelled')) {
        throw new Error('Sign-in was cancelled');
      } else if (error.code === 'IN_PROGRESS') {
        throw new Error('Sign-in is already in progress');
      } else if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
        throw new Error('Google Play Services not available');
      } else if (error.code === 'auth/invalid-credential') {
        throw new Error('Invalid Google credentials. Please check your Firebase SHA-1 configuration.');
      } else if (error.code === 'DEVELOPER_ERROR') {
        throw new Error('Developer error: Please check your SHA-1 fingerprints in Firebase Console.');
      } else {
        throw new Error(`Google Sign-In failed: ${error.message}`);
      }
    }
  }

  // Sign Out
  static async signOut(): Promise<void> {
    try {
      await GoogleSignin.signOut();
      await auth().signOut();
    } catch (error: any) {
      console.error('Sign out error:', error);
      throw new Error('Failed to sign out');
    }
  }

  // Get current user
  static getCurrentUser(): FirebaseAuthTypes.User | null {
    return auth().currentUser;
  }

  // Password Reset
  static async resetPassword(email: string): Promise<void> {
    try {
      await auth().sendPasswordResetEmail(email);
    } catch (error: any) {
      console.error('Password reset error:', error);
      throw new Error(AuthService.getErrorMessage(error.code));
    }
  }

  // Helper method to get user-friendly error messages
  private static getErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'No account found with this email address';
      case 'auth/wrong-password':
        return 'Incorrect password';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters';
      case 'auth/invalid-email':
        return 'Please enter a valid email address';
      case 'auth/user-disabled':
        return 'This account has been disabled';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later';
      case 'auth/network-request-failed':
        return 'Network error. Please check your internet connection and try again';
      case 'auth/unknown':
        return 'Connection error. Please check your internet connection and try again';
      default:
        if (errorCode?.includes('Connection reset') || errorCode?.includes('network')) {
          return 'Connection error. Please check your internet connection and try again';
        }
        return 'Authentication failed. Please try again';
    }
  }
}