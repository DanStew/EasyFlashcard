import type { BreadcrumbItem } from '@/components/shared/Breadcrumbs/types';
import type { FolderTreeItem } from '@/types/folder';

/**
 * Recursively search a hierarchical folder tree to find the ancestor chain to targetId.
 * Returns array ordered from root-most ancestor to target item.
 */
export function findFolderAncestors(
  tree: FolderTreeItem[],
  targetId: string,
  currentTrail: FolderTreeItem[] = []
): FolderTreeItem[] | null {
  for (const item of tree) {
    const nextTrail = [...currentTrail, item];
    if (item.id === targetId) {
      return nextTrail;
    }
    if (item.subfolders && item.subfolders.length > 0) {
      const found = findFolderAncestors(item.subfolders, targetId, nextTrail);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Build breadcrumb items from folder ancestors, starting with root Library.
 */
export function buildBreadcrumbTrail(
  ancestors: FolderTreeItem[] | null,
  fallbackCurrentFolder?: { id: string; name: string } | null
): BreadcrumbItem[] {
  const rootCrumb: BreadcrumbItem = {
    id: 'root',
    label: 'Library',
    href: '/',
  };

  if (!ancestors || ancestors.length === 0) {
    if (fallbackCurrentFolder) {
      return [
        rootCrumb,
        {
          id: fallbackCurrentFolder.id,
          label: fallbackCurrentFolder.name,
          href: `/folder/${fallbackCurrentFolder.id}`,
        },
      ];
    }
    return [rootCrumb];
  }

  const folderCrumbs: BreadcrumbItem[] = ancestors.map((item) => ({
    id: item.id,
    label: item.name,
    href: `/folder/${item.id}`,
  }));

  return [rootCrumb, ...folderCrumbs];
}
