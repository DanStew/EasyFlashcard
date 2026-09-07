/**
 * Computes tree item state classes.
 */
export function getFolderItemClassNames({
  isActive = false,
  isExpanded = false,
  hasChildren = false,
}: {
  isActive?: boolean;
  isExpanded?: boolean;
  hasChildren?: boolean;
}): string {
  return [
    'folder-nav-item',
    isActive ? 'folder-nav-item--active' : '',
    isExpanded ? 'folder-nav-item--expanded' : '',
    hasChildren ? 'folder-nav-item--has-children' : '',
  ]
    .filter(Boolean)
    .join(' ');
}
