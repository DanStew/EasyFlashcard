// ==========================================
// EasyFlashcard - Authentication Service
// ==========================================

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential,
  linkWithPopup,
  linkWithCredential,
  reauthenticateWithPopup,
  type User,
  type UserCredential,
  type Unsubscribe,
} from 'firebase/auth';
import { isCapacitorNative } from '@/utils/capacitorUtils';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { auth, isFirebaseConfigured } from './firebase';

const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive';
const GDRIVE_TOKEN_STORAGE_KEY = 'easyflashcard_gdrive_access_token';

let isGoogleAuthInitialized = false;

function ensureGoogleAuthInitialized() {
  if (!isGoogleAuthInitialized && typeof window !== 'undefined') {
    try {
      GoogleAuth.initialize({
        clientId:
          import.meta.env.VITE_OAUTH_CLIENT_ID ||
          '652975745934-fdt5db9qkm7ni511t72tmjd9i0mo3gtq.apps.googleusercontent.com',
        scopes: ['profile', 'email'],
        grantOfflineAccess: true,
      });
      isGoogleAuthInitialized = true;
    } catch (e) {
      console.warn('GoogleAuth initialize notice:', e);
    }
  }
}

/**
 * Creates and configures GoogleAuthProvider with Google Drive scopes.
 */
export function getGoogleDriveAuthProvider(): GoogleAuthProvider {
  const provider = new GoogleAuthProvider();
  provider.addScope(DRIVE_SCOPE);
  provider.setCustomParameters({
    prompt: 'consent',
  });
  return provider;
}

/**
 * Stores Google OAuth access token locally for API calls.
 */
export function saveGoogleDriveAccessToken(token: string): void {
  try {
    localStorage.setItem(GDRIVE_TOKEN_STORAGE_KEY, token);
    sessionStorage.setItem(GDRIVE_TOKEN_STORAGE_KEY, token);
  } catch {
    // Storage quota or privacy sandbox fallback
  }
}

/**
 * Retrieves the cached Google OAuth access token, if any.
 */
export function getStoredGoogleDriveAccessToken(): string | null {
  try {
    return localStorage.getItem(GDRIVE_TOKEN_STORAGE_KEY) || sessionStorage.getItem(GDRIVE_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Clears the cached Google Drive access token.
 */
export function clearGoogleDriveAccessToken(): void {
  try {
    localStorage.removeItem(GDRIVE_TOKEN_STORAGE_KEY);
    sessionStorage.removeItem(GDRIVE_TOKEN_STORAGE_KEY);
  } catch {
    // Ignore
  }
}

/**
 * Signs in using Google.
 * On Native Android: Triggers native Google Account bottom sheet dialog and authenticates with Firebase.
 * On Web: Opens standard Firebase popup.
 */
export async function signInWithGoogle(): Promise<UserCredential> {
  if (!auth || !isFirebaseConfigured()) {
    throw new Error('Firebase Authentication is not configured in this environment.');
  }

  if (isCapacitorNative()) {
    ensureGoogleAuthInitialized();
    try {
      const googleUser = await GoogleAuth.signIn();
      const idToken = googleUser?.authentication?.idToken;
      const accessToken = googleUser?.authentication?.accessToken;

      if (!idToken) {
        throw new Error('Google Sign-In did not return an authentication token.');
      }

      const credential = GoogleAuthProvider.credential(idToken, accessToken);
      const userCredential = await signInWithCredential(auth, credential);

      if (accessToken) {
        saveGoogleDriveAccessToken(accessToken);
      }
      return userCredential;
    } catch (err: unknown) {
      console.error('Native Google Sign-In error:', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.includes('10') || errMsg.includes('DEVELOPER_ERROR') || errMsg.includes('12500') || errMsg.includes('status code')) {
        throw new Error(
          'Google Sign-In requires the debug SHA-1 fingerprint to be added in Firebase Console.'
        );
      }
      throw err;
    }
  }

  const provider = getGoogleDriveAuthProvider();
  const credential = await signInWithPopup(auth, provider);
  const oauthCredential = GoogleAuthProvider.credentialFromResult(credential);
  if (oauthCredential?.accessToken) {
    saveGoogleDriveAccessToken(oauthCredential.accessToken);
  }
  return credential;
}

/**
 * Links Google Drive credentials to an existing signed-in account (e.g., Email/Password).
 */
export async function linkGoogleDriveAccount(): Promise<UserCredential> {
  if (!auth || !auth.currentUser || !isFirebaseConfigured()) {
    throw new Error('You must be signed in to connect a Google Drive account.');
  }

  if (isCapacitorNative()) {
    ensureGoogleAuthInitialized();
    const googleUser = await GoogleAuth.signIn();
    const idToken = googleUser?.authentication?.idToken;
    const accessToken = googleUser?.authentication?.accessToken;

    if (!idToken) {
      throw new Error('Google Sign-In did not return an authentication token.');
    }

    const credential = GoogleAuthProvider.credential(idToken, accessToken);
    let userCredential: UserCredential;
    try {
      userCredential = await linkWithCredential(auth.currentUser, credential);
    } catch {
      userCredential = await signInWithCredential(auth, credential);
    }

    if (accessToken) {
      saveGoogleDriveAccessToken(accessToken);
    }
    return userCredential;
  }

  const provider = getGoogleDriveAuthProvider();
  let credential: UserCredential;
  try {
    credential = await linkWithPopup(auth.currentUser, provider);
  } catch (err: unknown) {
    const errWithCode = err as { code?: string };
    if (
      errWithCode.code === 'auth/provider-already-linked' ||
      errWithCode.code === 'auth/credential-already-in-use'
    ) {
      credential = await reauthenticateWithPopup(auth.currentUser, provider);
    } else {
      throw err;
    }
  }

  const oauthCredential = GoogleAuthProvider.credentialFromResult(credential);
  if (oauthCredential?.accessToken) {
    saveGoogleDriveAccessToken(oauthCredential.accessToken);
  }
  return credential;
}

/**
 * Signs in an existing user using email and password.
 */
export async function signInWithEmail(email: string, pass: string): Promise<UserCredential> {
  if (!auth || !isFirebaseConfigured()) {
    throw new Error('Firebase Authentication is not configured in this environment.');
  }
  return signInWithEmailAndPassword(auth, email.trim(), pass);
}

/**
 * Registers a new user account with email and password.
 */
export async function registerWithEmail(email: string, pass: string): Promise<UserCredential> {
  if (!auth || !isFirebaseConfigured()) {
    throw new Error('Firebase Authentication is not configured in this environment.');
  }
  return createUserWithEmailAndPassword(auth, email.trim(), pass);
}

/**
 * Signs out the currently authenticated user.
 */
export async function logoutUser(): Promise<void> {
  clearGoogleDriveAccessToken();
  if (!auth) return;
  await signOut(auth);
}

/**
 * Subscribes to Firebase authentication state changes.
 */
export function subscribeToAuthState(callback: (user: User | null) => void): Unsubscribe {
  if (!auth || !isFirebaseConfigured()) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

/**
 * Returns the currently signed-in Firebase user instance, if any.
 */
export function getCurrentAuthUser(): User | null {
  return auth ? auth.currentUser : null;
}

/**
 * Retrieves the current user's Firebase ID token for authorization headers.
 */
export async function getCurrentUserIdToken(forceRefresh = false): Promise<string | null> {
  if (!auth || !auth.currentUser) return null;
  try {
    return await auth.currentUser.getIdToken(forceRefresh);
  } catch {
    return null;
  }
}

