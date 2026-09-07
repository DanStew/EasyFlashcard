/**
 * Computes Breadcrumbs root class name.
 */
export function getBreadcrumbsClassName(className = ''): string {
  return ['breadcrumbs', className].filter(Boolean).join(' ');
}
