// ==========================================
// EasyFlashcard - LoginView Types
// ==========================================

export type AuthMode = 'login' | 'register';

export interface LoginFormState {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LocationStateWithFrom {
  from?: {
    pathname: string;
    search?: string;
  };
}
