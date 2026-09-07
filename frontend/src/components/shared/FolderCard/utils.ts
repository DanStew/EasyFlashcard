/**
 * Format folder item count summary string.
 */
export function formatFolderItemCount(setCount?: number, subfolderCount?: number): string {
  const parts: string[] = [];
  if (subfolderCount !== undefined && subfolderCount > 0) {
    parts.push(`${subfolderCount} ${subfolderCount === 1 ? 'subfolder' : 'subfolders'}`);
  }
  if (setCount !== undefined && setCount > 0) {
    parts.push(`${setCount} ${setCount === 1 ? 'set' : 'sets'}`);
  }

  if (parts.length === 0) {
    return 'Empty folder';
  }
  return parts.join(' · ');
}

/**
 * Compute FolderCard root class name.
 */
export function getFolderCardClassName(viewMode: 'grid' | 'list' = 'grid', className?: string): string {
  const base = `folder-card folder-card--${viewMode}`;
  return className ? `${base} ${className}` : base;
}
