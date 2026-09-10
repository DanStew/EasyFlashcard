// ==========================================
// EasyFlashcard - AuthModal Component
// ==========================================

import { useState, type FormEvent } from 'react';
import { AlertCircle, Lock, LogIn, Mail, UserPlus } from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { GoogleIcon } from '@/components/shared/GoogleIcon';
import { Input } from '@/components/shared/Input';
import { Modal } from '@/components/shared/Modal';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import type { AuthModalProps, AuthTabMode } from './types';
import { getInitialAuthFormState, validateAuthForm } from './utils';
import './style.scss';

export function AuthModal({
  isOpen,
  onClose,
  initialMode = 'login',
}: AuthModalProps) {
  const { login, register, loginWithGoogle, authError, clearAuthError } = useAuth();
  const { showSuccess, showError } = useToast();

  const [mode, setMode] = useState<AuthTabMode>(initialMode);
  const [form, setForm] = useState(getInitialAuthFormState);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  const handleTabChange = (newMode: AuthTabMode) => {
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
      showSuccess('Signed in with Google successfully!');
      onClose();
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
    const validation = validateAuthForm(mode, form);
    if (!validation.isValid) {
      setLocalError(validation.error);
      return;
    }

    try {
      setIsSubmitting(true);
      setLocalError(null);

      if (mode === 'login') {
        await login(form.email, form.password);
        showSuccess('Signed in successfully!');
      } else {
        await register(form.email, form.password);
        showSuccess('Account created and signed in successfully!');
      }

      setForm(getInitialAuthFormState());
      onClose();
    } catch {
      // Auth error is captured in AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeError = localError || authError;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'login' ? 'Sign In to EasyFlashcard' : 'Create an Account'}
      subtitle={
        mode === 'login'
          ? 'Access your cloud-synced flashcards and study sets'
          : 'Start syncing your study material across all your devices'
      }
      size="sm"
    >
      <div className="auth-modal">
        {/* One-Click Google Sign-In */}
        <div className="auth-modal__google-section">
          <button
            type="button"
            className="auth-modal__google-btn"
            onClick={handleGoogleSignIn}
            disabled={isGoogleSubmitting || isSubmitting}
          >
            <GoogleIcon size={20} />
            <span>{isGoogleSubmitting ? 'Signing in with Google...' : 'Continue with Google'}</span>
          </button>
          <div className="auth-modal__divider">or with email</div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="auth-modal__tabs" role="tablist">
          <button
            type="button"
            className={`auth-modal__tab ${mode === 'login' ? 'auth-modal__tab--active' : ''}`}
            onClick={() => handleTabChange('login')}
            role="tab"
            aria-selected={mode === 'login'}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-modal__tab ${mode === 'register' ? 'auth-modal__tab--active' : ''}`}
            onClick={() => handleTabChange('register')}
            role="tab"
            aria-selected={mode === 'register'}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert Box */}
        {activeError && (
          <div className="auth-modal__error-alert" role="alert">
            <AlertCircle size={16} />
            <span>{activeError}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="auth-modal__form">
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

          <div className="auth-modal__footer">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              leftIcon={mode === 'login' ? <LogIn size={16} /> : <UserPlus size={16} />}
            >
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </Button>
          </div>
        </form>

        <div className="auth-modal__switch-prompt">
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
    </Modal>
  );
}

export type { AuthModalProps, AuthTabMode } from './types';
