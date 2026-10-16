import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, getReactNativePersistence, initializeAuth, type Auth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const env = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

/** False until .env is filled in; the UI shows a setup message instead of crashing. */
export const firebaseConfigured = !!env.apiKey && !!env.projectId && !!env.appId;

// Placeholders keep initializeAuth from throwing when .env is still empty.
const firebaseConfig = {
  apiKey: env.apiKey || 'missing-api-key',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.projectId || 'missing-project-id',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.appId,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Keep the session across app restarts (AsyncStorage). initializeAuth throws if
// called twice (Fast Refresh), so fall back to the existing instance.
let auth: Auth;
try {
  auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
} catch {
  auth = getAuth(app);
}

export { app, auth };
export const db = getFirestore(app);
