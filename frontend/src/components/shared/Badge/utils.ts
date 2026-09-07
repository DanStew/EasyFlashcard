import type { BadgeSize, BadgeVariant } from './types';

/**
 * Computes Badge class names.
 */
export function getBadgeClassNames({
  variant = 'default',
  size = 'md',
  pill = true,
  className = '',
}: {
  variant?: BadgeVariant;
  size?: BadgeSize;
  pill?: boolean;
  className?: string;
}): string {
  return [
    'badge',
    `badge--${variant}`,
    `badge--${size}`,
    pill ? 'badge--pill' : 'badge--rounded',
    className,
  ]
    .filter(Boolean)
    .join(' ');
}
