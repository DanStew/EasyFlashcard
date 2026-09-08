// ==========================================
// EasyFlashcard - StudySetSelectorModal Utilities
// ==========================================

import type { FolderTreeItem } from '@/types/folder';
import type { SetModel } from '@/types/set';
import type { FolderDisplayNode, SearchSetResult, SelectorBreadcrumb } from './types';

/**
 * Recursively find a folder node within the folder tree hierarchy by ID.
 */
export function findFolderNode(
  tree: FolderTreeItem[],
  targetId: string | null
): FolderTreeItem | null {
  if (!targetId) return null;

  for (const node of tree) {
    if (node.id === targetId) return node;
    if (node.subfolders && node.subfolders.length > 0) {
      const found = findFolderNode(node.subfolders, targetId);
      if (found) return found;
    }
  }

  return null;
}

/**
 * Builds a trail of breadcrumbs from root ('Library') down to the current folder.
 */
export function buildSelectorBreadcrumbs(
  tree: FolderTreeItem[],
  currentFolderId: string | null
): SelectorBreadcrumb[] {
  const rootCrumb: SelectorBreadcrumb = { id: null, name: 'Library' };
  if (!currentFolderId) {
    return [rootCrumb];
  }

  const trail: SelectorBreadcrumb[] = [];

  function trace(nodes: FolderTreeItem[], targetId: string, currentPath: SelectorBreadcrumb[]): boolean {
    for (const node of nodes) {
      const next = [...currentPath, { id: node.id, name: node.name }];
      if (node.id === targetId) {
        trail.push(...next);
        return true;
      }
      if (node.subfolders && node.subfolders.length > 0) {
        if (trace(node.subfolders, targetId, next)) return true;
      }
    }
    return false;
  }

  trace(tree, currentFolderId, []);

  return [rootCrumb, ...trail];
}

/**
 * Retrieves immediate subfolders of the current directory level.
 */
export function getChildFolders(
  tree: FolderTreeItem[],
  currentFolderId: string | null
): FolderDisplayNode[] {
  if (!currentFolderId) {
    // Root level folders
    return tree.map((node) => ({
      id: node.id,
      name: node.name,
      path: node.path,
      setCount: node.setCount ?? 0,
      subfolderCount: node.subfolders ? node.subfolders.length : 0,
    }));
  }

  const current = findFolderNode(tree, currentFolderId);
  if (!current || !current.subfolders) return [];

  return current.subfolders.map((node) => ({
    id: node.id,
    name: node.name,
    path: node.path,
    setCount: node.setCount ?? 0,
    subfolderCount: node.subfolders ? node.subfolders.length : 0,
  }));
}

/**
 * Filters sets belonging directly to the specified folder (or root if null).
 */
export function getSetsForFolder(
  allSets: SetModel[],
  folderId: string | null
): SetModel[] {
  return allSets.filter((set) => (set.folderId ?? null) === folderId);
}

/**
 * Creates a quick map of folder ID to readable path/name for attribution.
 */
export function buildFolderMap(tree: FolderTreeItem[]): Map<string, string> {
  const map = new Map<string, string>();

  function traverse(nodes: FolderTreeItem[], parentPath: string) {
    for (const node of nodes) {
      const fullPath = parentPath ? `${parentPath} / ${node.name}` : node.name;
      map.set(node.id, fullPath);
      if (node.subfolders && node.subfolders.length > 0) {
        traverse(node.subfolders, fullPath);
      }
    }
  }

  traverse(tree, '');
  return map;
}

/**
 * Searches sets across all folders matching search terms by name, description, or tag.
 */
export function searchSets(
  allSets: SetModel[],
  query: string,
  folderMap: Map<string, string>
): SearchSetResult[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return [];

  return allSets
    .filter((set) => {
      const nameMatch = set.name.toLowerCase().includes(trimmed);
      const descMatch = Boolean(set.description?.toLowerCase().includes(trimmed));
      const tagMatch = Boolean(set.tags?.some((tag) => tag.toLowerCase().includes(trimmed)));
      return nameMatch || descMatch || tagMatch;
    })
    .map((set) => ({
      set,
      folderPath: set.folderId ? folderMap.get(set.folderId) || 'Folder' : 'Root Library',
    }));
}

/**
 * Calculates the selected set models and total card tally from selected IDs.
 */
export function computeSelectedStats(
  selectedIds: string[],
  allSets: SetModel[]
): { selectedSets: SetModel[]; totalCards: number } {
  const idSet = new Set(selectedIds);
  const selectedSets = allSets.filter((s) => idSet.has(s.id));
  const totalCards = selectedSets.reduce((sum, s) => sum + (s.cardCount || 0), 0);

  return { selectedSets, totalCards };
}

/**
 * Checks if every selectable set (with cards > 0) in the given list is currently selected.
 */
export function areAllSetsSelected(
  targetSets: SetModel[],
  selectedIds: string[]
): boolean {
  const selectable = targetSets.filter((s) => s.cardCount > 0);
  if (selectable.length === 0) return false;
  const idSet = new Set(selectedIds);
  return selectable.every((s) => idSet.has(s.id));
}
