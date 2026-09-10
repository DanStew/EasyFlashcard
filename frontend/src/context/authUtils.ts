// ==========================================
// EasyFlashcard - Authentication Utilities
// ==========================================

import type { User } from 'firebase/auth';

/**
 * Maps Firebase Authentication error codes to clear, friendly user messages.
 */
export function getFirebaseAuthErrorMessage(error: unknown): string {
  if (!error) return 'An unexpected authentication error occurred.';

  const code = (error as { code?: string })?.code;
  const message = (error as { message?: string })?.message;

  switch (code) {
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-not-found':
      return 'No account found with this email address. Please sign up.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please check your credentials.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Please sign in instead.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long.';
    case 'auth/network-request-failed':
      return 'Network request failed. Please check your connection.';
    case 'auth/too-many-requests':
      return 'Access temporarily disabled due to many failed attempts. Please try later.';
    case 'auth/user-disabled':
      return 'This user account has been disabled.';
    case 'auth/operation-not-allowed':
      return 'Email/Password sign-in is not enabled in the Firebase Console.';
    case 'auth/api-key-not-valid':
    case 'auth/api-key-not-valid.-please-pass-a-valid-api-key.':
      return 'Firebase API key is invalid or Identity Toolkit API is not enabled in GCP Console.';
    default:
      if (typeof message === 'string' && message.includes('api-key-not-valid')) {
        return 'Firebase API key is invalid or Identity Toolkit API is not enabled in GCP Console.';
      }
      return message || 'Authentication failed. Please check your details and try again.';
  }
}

/**
 * Extracts a display initial from a user's display name or email.
 */
export function getUserInitial(user: User | null): string {
  if (!user) return 'D';
  if (user.displayName && user.displayName.trim().length > 0) {
    return user.displayName.trim().charAt(0).toUpperCase();
  }
  if (user.email && user.email.trim().length > 0) {
    return user.email.trim().charAt(0).toUpperCase();
  }
  return 'U';
}

/**
 * Formats a clean display name or email snippet for the user badge.
 */
export function getUserDisplayName(user: User | null): string {
  if (!user) return 'Developer Mode';
  if (user.displayName && user.displayName.trim()) {
    return user.displayName.trim();
  }
  if (user.email) {
    return user.email.split('@')[0];
  }
  return 'Authenticated User';
}
