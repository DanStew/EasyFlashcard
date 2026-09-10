// ==========================================
// EasyFlashcard - LoginView Page Component
// ==========================================

import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { AlertCircle, Lock, LogIn, Mail, Sparkles, UserPlus } from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { GoogleIcon } from '@/components/shared/GoogleIcon';
import { Input } from '@/components/shared/Input';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import type { AuthMode } from './types';
import { getInitialLoginFormState, getReturnPath, validateLoginForm } from './utils';
import './style.scss';

export function LoginView() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showSuccess, showError } = useToast();
  const {
    isAuthenticated,
    isLoading,
    login,
    register,
    loginWithGoogle,
    authError,
    clearAuthError,
  } = useAuth();

  const [mode, setMode] = useState<AuthMode>('login');
  const [form, setForm] = useState(getInitialLoginFormState);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  // If already authenticated and not loading, redirect to target or home
  if (!isLoading && isAuthenticated) {
    const returnPath = getReturnPath(location.state);
    return <Navigate to={returnPath} replace />;
  }

  const handleTabChange = (newMode: AuthMode) => {
    setMode(newMode);
    setLocalError(null);
    clearAuthError();
  };

  const handleInputChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (localError) setLocalError(null);
    if (authError) clearAuthError();
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleSubmitting(true);
      setLocalError(null);
      clearAuthError();
      await loginWithGoogle();
      showSuccess('Welcome! Signed in with Google successfully.');
      const returnPath = getReturnPath(location.state);
      navigate(returnPath, { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google sign-in failed';
      setLocalError(msg);
      showError(msg);
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const validation = validateLoginForm(mode, form);
    if (!validation.isValid) {
      setLocalError(validation.error);
      return;
    }

    try {
      setIsSubmitting(true);
      setLocalError(null);

      if (mode === 'login') {
        await login(form.email, form.password);
        showSuccess('Welcome back! Signed in successfully.');
      } else {
        await register(form.email, form.password);
        showSuccess('Account created! Welcome to EasyFlashcard.');
      }

      const returnPath = getReturnPath(location.state);
      navigate(returnPath, { replace: true });
    } catch {
      // Auth error is captured in AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeError = localError || authError;

  if (isLoading) {
    return (
      <div className="login-view">
        <LoadingSpinner size="lg" label="Loading..." />
      </div>
    );
  }

  return (
    <div className="login-view">
      <div className="login-view__container">
        {/* Brand Header */}
        <div className="login-view__header">
          <div className="login-view__brand">
            <div className="login-view__brand-logo">
              <Sparkles size={26} />
            </div>
            <span className="login-view__brand-text">
              Easy<span className="login-view__brand-accent">Flashcard</span>
            </span>
          </div>
          <p className="login-view__subtitle">
            Sign in to sync, organize, and master your flashcards with cloud persistence
          </p>
        </div>

        {/* Card Container */}
        <div className="login-view__card">
          {/* One-Click Google Sign-In */}
          <div className="login-view__google-section">
            <button
              type="button"
              className="login-view__google-btn"
              onClick={handleGoogleSignIn}
              disabled={isGoogleSubmitting || isSubmitting}
            >
              <GoogleIcon size={20} />
              <span>{isGoogleSubmitting ? 'Signing in with Google...' : 'Continue with Google'}</span>
            </button>
            <div className="login-view__divider">or with email</div>
          </div>

          {/* Mode Switcher */}
          <div className="login-view__tabs" role="tablist">
            <button
              type="button"
              className={`login-view__tab ${mode === 'login' ? 'login-view__tab--active' : ''}`}
              onClick={() => handleTabChange('login')}
              role="tab"
              aria-selected={mode === 'login'}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`login-view__tab ${mode === 'register' ? 'login-view__tab--active' : ''}`}
              onClick={() => handleTabChange('register')}
              role="tab"
              aria-selected={mode === 'register'}
            >
              Create Account
            </button>
          </div>

          {/* Error Alert */}
          {activeError && (
            <div className="login-view__error-alert" role="alert">
              <AlertCircle size={16} />
              <span>{activeError}</span>
            </div>
          )}

          {/* Authentication Form */}
          <form onSubmit={handleSubmit} className="login-view__form">
            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              leftIcon={<Mail size={16} />}
              autoFocus
              fullWidth
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              leftIcon={<Lock size={16} />}
              fullWidth
              required
            />

            {mode === 'register' && (
              <Input
                label="Confirm Password"
                type="password"
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                leftIcon={<Lock size={16} />}
                fullWidth
                required
              />
            )}

            <Button
              type="submit"
              variant="gradient"
              size="lg"
              fullWidth
              isLoading={isSubmitting}
              className="login-view__submit-btn"
              leftIcon={mode === 'login' ? <LogIn size={18} /> : <UserPlus size={18} />}
            >
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          {/* Bottom Switch Link */}
          <div className="login-view__footer">
            {mode === 'login' ? (
              <>
                Don't have an account yet?
                <button type="button" onClick={() => handleTabChange('register')}>
                  Sign Up
                </button>
              </>
            ) : (
              <>
                Already have an account?
                <button type="button" onClick={() => handleTabChange('login')}>
                  Sign In
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
