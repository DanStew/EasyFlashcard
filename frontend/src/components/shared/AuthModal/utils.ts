// ==========================================
// EasyFlashcard - AuthModal Utilities
// ==========================================

import type { AuthFormState, AuthFormValidationResult, AuthTabMode } from './types';

/**
 * Creates default initial state for authentication form.
 */
export function getInitialAuthFormState(): AuthFormState {
  return {
    email: '',
    password: '',
    confirmPassword: '',
  };
}

/**
 * Validates user input before submitting to Firebase.
 */
export function validateAuthForm(
  mode: AuthTabMode,
  form: AuthFormState
): AuthFormValidationResult {
  const trimmedEmail = form.email.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!trimmedEmail) {
    return { isValid: false, error: 'Please enter your email address.' };
  }

  if (!emailRegex.test(trimmedEmail)) {
    return { isValid: false, error: 'Please enter a valid email address.' };
  }

  if (!form.password) {
    return { isValid: false, error: 'Please enter a password.' };
  }

  if (form.password.length < 6) {
    return { isValid: false, error: 'Password must be at least 6 characters long.' };
  }

  if (mode === 'register') {
    if (!form.confirmPassword) {
      return { isValid: false, error: 'Please confirm your password.' };
    }
    if (form.password !== form.confirmPassword) {
      return { isValid: false, error: 'Passwords do not match.' };
    }
  }

  return { isValid: true, error: null };
}
