// ==========================================
// EasyFlashcard - Firebase App & Auth Initializer
// ==========================================

import { initializeApp, getApps, getApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

/**
 * Builds Firebase configuration object dynamically from environment variables.
 */
function getFirebaseConfig(): FirebaseOptions {
  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  };
}

/**
 * Validates whether the required Firebase environment variables are populated.
 */
export function isFirebaseConfigured(): boolean {
  const config = getFirebaseConfig();
  return Boolean(
    config.apiKey &&
    config.apiKey.trim().length > 0 &&
    config.projectId &&
    config.projectId.trim().length > 0 &&
    config.appId &&
    config.appId.trim().length > 0
  );
}

/**
 * Initializes and returns the Firebase application singleton if configured.
 */
function getOrInitializeFirebaseApp(): FirebaseApp | null {
  if (!isFirebaseConfigured()) {
    return null;
  }
  if (getApps().length > 0) {
    return getApp();
  }
  try {
    const config = getFirebaseConfig();
    return initializeApp(config);
  } catch (err: unknown) {
    console.warn('Failed to initialize Firebase app:', err);
    return null;
  }
}

/**
 * Initializes Firebase Auth singleton if Firebase application is configured.
 */
function getOrInitializeAuth(app: FirebaseApp | null): Auth | null {
  if (!app) return null;
  try {
    return getAuth(app);
  } catch (err: unknown) {
    console.warn('Failed to initialize Firebase Auth:', err);
    return null;
  }
}

// Export initialized instances (null-safe)
export const firebaseApp: FirebaseApp | null = getOrInitializeFirebaseApp();
export const auth: Auth | null = getOrInitializeAuth(firebaseApp);
