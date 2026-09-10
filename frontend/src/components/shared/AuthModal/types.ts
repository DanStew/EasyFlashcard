// ==========================================
// EasyFlashcard - AuthModal Types
// ==========================================

export type AuthTabMode = 'login' | 'register';

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: AuthTabMode;
}

export interface AuthFormState {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthFormValidationResult {
  isValid: boolean;
  error: string | null;
}
