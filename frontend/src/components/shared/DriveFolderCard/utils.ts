// ==========================================
// DriveFolderCard - Utilities
// ==========================================

export function getDriveFolderCardClass(viewMode: 'grid' | 'list', className?: string): string {
  const classes = ['drive-folder-card', `drive-folder-card--${viewMode}`];
  if (className) {
    classes.push(className);
  }
  return classes.join(' ');
}
