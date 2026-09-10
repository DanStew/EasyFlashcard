// ==========================================
// EasyFlashcard - LoginView Utilities
// ==========================================

import type { AuthMode, LoginFormState, LocationStateWithFrom } from './types';

/**
 * Returns initial empty form state.
 */
export function getInitialLoginFormState(): LoginFormState {
  return {
    email: '',
    password: '',
    confirmPassword: '',
  };
}

/**
 * Validates login/registration form fields.
 */
export function validateLoginForm(
  mode: AuthMode,
  form: LoginFormState
): { isValid: boolean; error: string | null } {
  const trimmedEmail = form.email.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!trimmedEmail) {
    return { isValid: false, error: 'Please enter your email address.' };
  }

  if (!emailRegex.test(trimmedEmail)) {
    return { isValid: false, error: 'Please enter a valid email address.' };
  }

  if (!form.password) {
    return { isValid: false, error: 'Please enter your password.' };
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

/**
 * Extracts the target return path from router location state.
 */
export function getReturnPath(state: unknown): string {
  const typedState = state as LocationStateWithFrom | null;
  if (typedState?.from?.pathname) {
    return `${typedState.from.pathname}${typedState.from.search || ''}`;
  }
  return '/';
}
