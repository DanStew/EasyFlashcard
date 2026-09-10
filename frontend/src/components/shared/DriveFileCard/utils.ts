// ==========================================
// DriveFileCard - Utilities
// ==========================================

export function getDriveFileCardClass(viewMode: 'grid' | 'list', className?: string): string {
  const classes = ['drive-file-card', `drive-file-card--${viewMode}`];
  if (className) {
    classes.push(className);
  }
  return classes.join(' ');
}
