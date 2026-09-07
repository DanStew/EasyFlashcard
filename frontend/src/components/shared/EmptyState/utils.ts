/**
 * Computes EmptyState class names.
 */
export function getEmptyStateClassName(className = ''): string {
  return ['empty-state', 'animate-fade-in', className].filter(Boolean).join(' ');
}
