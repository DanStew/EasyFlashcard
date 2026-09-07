// ==========================================
// EasyFlashcard - Toast Notification Context
// ==========================================

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

export interface ToastContextType {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id'>) => string;
  removeToast: (id: string) => void;
  showSuccess: (message: string, title?: string) => void;
  showError: (message: string, title?: string) => void;
  showInfo: (message: string, title?: string) => void;
  showWarning: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (toast: Omit<ToastItem, 'id'>) => {
      const id = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const duration = toast.duration ?? 4000;

      const newToast: ToastItem = { ...toast, id, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      return id;
    },
    [removeToast]
  );

  const showSuccess = useCallback(
    (message: string, title?: string) => {
      addToast({ type: 'success', message, title: title || 'Success' });
    },
    [addToast]
  );

  const showError = useCallback(
    (message: string, title?: string) => {
      addToast({ type: 'error', message, title: title || 'Error' });
    },
    [addToast]
  );

  const showInfo = useCallback(
    (message: string, title?: string) => {
      addToast({ type: 'info', message, title: title || 'Info' });
    },
    [addToast]
  );

  const showWarning = useCallback(
    (message: string, title?: string) => {
      addToast({ type: 'warning', message, title: title || 'Warning' });
    },
    [addToast]
  );

  return (
    <ToastContext.Provider
      value={{
        toasts,
        addToast,
        removeToast,
        showSuccess,
        showError,
        showInfo,
        showWarning,
      }}
    >
      {children}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
