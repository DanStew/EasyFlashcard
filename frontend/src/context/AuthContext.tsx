// ==========================================
// EasyFlashcard - Authentication Context
// ==========================================

import {
  createContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { User } from 'firebase/auth';
import {
  signInWithEmail,
  registerWithEmail,
  logoutUser,
  subscribeToAuthState,
} from '@/services/authService';
import { getFirebaseAuthErrorMessage } from './authUtils';

export interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authError: string | null;
  isAuthModalOpen: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Subscribe to Firebase auth state lifecycle
  useEffect(() => {
    const unsubscribe = subscribeToAuthState((user) => {
      setCurrentUser(user);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  const openAuthModal = useCallback(() => {
    setAuthError(null);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
    setAuthError(null);
  }, []);

  const login = useCallback(async (email: string, pass: string) => {
    try {
      setAuthError(null);
      await signInWithEmail(email, pass);
      setIsAuthModalOpen(false);
    } catch (err: unknown) {
      const friendlyMessage = getFirebaseAuthErrorMessage(err);
      setAuthError(friendlyMessage);
      throw new Error(friendlyMessage);
    }
  }, []);

  const register = useCallback(async (email: string, pass: string) => {
    try {
      setAuthError(null);
      await registerWithEmail(email, pass);
      setIsAuthModalOpen(false);
    } catch (err: unknown) {
      const friendlyMessage = getFirebaseAuthErrorMessage(err);
      setAuthError(friendlyMessage);
      throw new Error(friendlyMessage);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setAuthError(null);
      await logoutUser();
    } catch (err: unknown) {
      const friendlyMessage = getFirebaseAuthErrorMessage(err);
      setAuthError(friendlyMessage);
      throw new Error(friendlyMessage);
    }
  }, []);

  const value: AuthContextType = {
    currentUser,
    isAuthenticated: Boolean(currentUser),
    isLoading,
    authError,
    isAuthModalOpen,
    login,
    register,
    logout,
    openAuthModal,
    closeAuthModal,
    clearAuthError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthContext };
