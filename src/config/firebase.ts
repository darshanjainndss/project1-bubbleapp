import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Configure Google Sign-In with web client ID
// Note: Make sure both debug and release SHA-1 fingerprints are added to Firebase Console
GoogleSignin.configure({
  webClientId: '139222386798-skodrit2glaes7ad7l3kc9cj1r2jtr39.apps.googleusercontent.com',
  offlineAccess: false, // Disable offline access to avoid token issues
});

export { auth, GoogleSignin };