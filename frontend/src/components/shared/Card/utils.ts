import type { CardVariant } from './types';

/**
 * Computes Card class names from variant, padding, and hover states.
 */
export function getCardClassNames({
  variant = 'default',
  padding = 'md',
  hoverable = false,
  className = '',
}: {
  variant?: CardVariant;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
  className?: string;
}): string {
  return [
    'card-surface',
    `card-surface--${variant}`,
    `card-surface--pad-${padding}`,
    hoverable || variant === 'interactive' ? 'card-surface--hoverable' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
}
