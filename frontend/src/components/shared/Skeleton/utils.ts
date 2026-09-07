import type { SkeletonVariant } from './types';

/**
 * Computes Skeleton class name.
 */
export function getSkeletonClassName(variant: SkeletonVariant = 'text', className = ''): string {
  return ['skeleton-pulse', `skeleton-pulse--${variant}`, className].filter(Boolean).join(' ');
}
