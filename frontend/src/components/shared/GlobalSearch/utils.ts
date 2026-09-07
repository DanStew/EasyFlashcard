import type { Folder } from '@/types/folder';
import type { SetModel } from '@/types/set';
import type { NavigableItem } from './types';

/**
 * Builds a flat list of navigable items for keyboard navigation.
 */
export function buildNavigableItemList(
  folders: Folder[],
  sets: SetModel[],
  query: string
): NavigableItem[] {
  const items: NavigableItem[] = [];

  for (const folder of folders) {
    items.push({ type: 'folder', id: `folder-${folder.id}`, folder });
  }

  for (const set of sets) {
    items.push({ type: 'set', id: `set-${set.id}`, set });
  }

  if (query.trim() && (folders.length > 0 || sets.length > 0)) {
    items.push({ type: 'view_all', id: 'view-all-results', query: query.trim() });
  }

  return items;
}

/**
 * Calculates next selected index when arrowing up or down.
 */
export function getNextIndex(
  currentIndex: number,
  totalCount: number,
  direction: 'up' | 'down'
): number {
  if (totalCount === 0) return -1;
  if (direction === 'down') {
    return currentIndex < totalCount - 1 ? currentIndex + 1 : 0;
  }
  return currentIndex > 0 ? currentIndex - 1 : totalCount - 1;
}

/**
 * Formats folder item counts summary (e.g. "2 subfolders · 3 sets").
 */
export function formatFolderDetails(folder: Folder): string {
  const parts: string[] = [];
  const subCount = folder.subfolderCount ?? 0;
  const setCount = folder.setCount ?? 0;

  if (subCount > 0) {
    parts.push(`${subCount} ${subCount === 1 ? 'subfolder' : 'subfolders'}`);
  }
  if (setCount > 0) {
    parts.push(`${setCount} ${setCount === 1 ? 'set' : 'sets'}`);
  }

  return parts.length > 0 ? parts.join(' · ') : 'Empty folder';
}

/**
 * Formats flashcard set meta info (e.g. "5 cards · #tag1 #tag2").
 */
export function formatSetMeta(set: SetModel): string {
  const parts: string[] = [];
  parts.push(`${set.cardCount} ${set.cardCount === 1 ? 'card' : 'cards'}`);

  if (set.tags && set.tags.length > 0) {
    const tagsString = set.tags.slice(0, 2).map((t) => `#${t}`).join(' ');
    parts.push(tagsString);
  }

  return parts.join(' · ');
}
