// ==========================================
// EasyFlashcard - Authentication Service
// ==========================================

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
  type UserCredential,
  type Unsubscribe,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from './firebase';

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
