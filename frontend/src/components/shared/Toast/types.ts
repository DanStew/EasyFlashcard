import type { ToastItem } from '@/context/ToastContext';

export interface ToastProps {
  toasts?: ToastItem[];
  className?: string;
}
