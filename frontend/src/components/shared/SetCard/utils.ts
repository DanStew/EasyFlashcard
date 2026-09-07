/**
 * Formats ISO timestamp to human-friendly relative or short date.
 */
export function formatSetDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;

    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return 'Recently';
  }
}

/**
 * Computes SetCard root CSS class names.
 */
export function getSetCardClassName(viewMode: 'grid' | 'list' = 'grid', className?: string): string {
  const base = `set-card set-card--${viewMode}`;
  return className ? `${base} ${className}` : base;
}
