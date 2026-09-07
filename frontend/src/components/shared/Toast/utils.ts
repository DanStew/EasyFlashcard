import type { ToastType } from '@/context/ToastContext';

/**
 * Computes individual Toast card class name.
 */
export function getToastItemClassName(type: ToastType): string {
  return ['toast-item', `toast-item--${type}`, 'animate-fade-in'].filter(Boolean).join(' ');
}
