import type { Folder, FolderTreeItem } from '@/types/folder';
import type { SetModel } from '@/types/set';
import type { ExplorerSortOption } from '@/components/shared/ExplorerToolbar/types';
import { sortFolders, sortSets } from '@/components/shared/ExplorerToolbar/utils';

export interface FilterAndSortResult {
  folders: Folder[];
  sets: SetModel[];
  totalCards: number;
}

/**
 * Filters and sorts both folders and sets based on query and sort selection.
 */
export function filterAndSortExplorerItems(
  folders: Folder[],
  sets: SetModel[],
  searchQuery: string,
  sortBy: ExplorerSortOption
): FilterAndSortResult {
  const query = searchQuery.trim().toLowerCase();

  let filteredFolders = folders;
  let filteredSets = sets;

  if (query) {
    filteredFolders = folders.filter((f) => f.name.toLowerCase().includes(query));
    filteredSets = sets.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        (s.description && s.description.toLowerCase().includes(query)) ||
        s.tags.some((t) => t.toLowerCase().includes(query))
    );
  }

  const sortedFolders = sortFolders(filteredFolders, sortBy);
  const sortedSets = sortSets(filteredSets, sortBy);
  const totalCards = sortedSets.reduce((acc, s) => acc + (s.cardCount || 0), 0);

  return {
    folders: sortedFolders,
    sets: sortedSets,
    totalCards,
  };
}

/**
 * Finds the parent folder object or null (for root) from tree.
 */
export function findParentFolderInfo(
  tree: FolderTreeItem[],
  currentFolder: Folder | null
): { id: string | null; name: string } | null {
  if (!currentFolder || !currentFolder.parentId) {
    if (currentFolder) {
      return { id: null, name: 'Library' };
    }
    return null;
  }

  function search(items: FolderTreeItem[]): { id: string; name: string } | null {
    for (const item of items) {
      if (item.id === currentFolder?.parentId) {
        return { id: item.id, name: item.name };
      }
      if (item.subfolders && item.subfolders.length > 0) {
        const found = search(item.subfolders);
        if (found) return found;
      }
    }
    return null;
  }

  const parent = search(tree);
  return parent || { id: currentFolder.parentId, name: 'Parent Folder' };
}

/**
 * Resolves folder stats (subfolderCount, setCount, previewItems) with fallback to folderTree.
 */
export function resolveFolderStats(
  folder: Folder,
  tree: FolderTreeItem[]
): { subfolderCount: number; setCount: number; previewItems: string[] } {
  if (
    folder.subfolderCount !== undefined &&
    folder.setCount !== undefined &&
    folder.previewItems !== undefined
  ) {
    return {
      subfolderCount: folder.subfolderCount,
      setCount: folder.setCount,
      previewItems: folder.previewItems,
    };
  }

  function findNode(nodes: FolderTreeItem[]): FolderTreeItem | null {
    for (const node of nodes) {
      if (node.id === folder.id) return node;
      if (node.subfolders && node.subfolders.length > 0) {
        const found = findNode(node.subfolders);
        if (found) return found;
      }
    }
    return null;
  }

  const node = findNode(tree);
  const subCount = folder.subfolderCount ?? node?.subfolders?.length ?? 0;
  const setCount = folder.setCount ?? node?.setCount ?? 0;
  const previewItems =
    folder.previewItems ??
    node?.subfolders?.slice(0, 3).map((sub) => sub.name) ??
    [];

  return { subfolderCount: subCount, setCount, previewItems };
}

