import type { SpinnerSize } from './types';

/**
 * Computes LoadingSpinner class names.
 */
export function getLoadingSpinnerClassNames({
  size = 'md',
  color = 'primary',
  className = '',
}: {
  size?: SpinnerSize;
  color?: 'primary' | 'white' | 'current';
  className?: string;
}): string {
  return ['loading-spinner', `loading-spinner--${size}`, `loading-spinner--${color}`, className]
    .filter(Boolean)
    .join(' ');
}
