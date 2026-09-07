import type { Folder } from '@/types/folder';
import type { SetModel } from '@/types/set';
import type { ExplorerSortOption } from './types';

/**
 * Format summary counts into a human-readable metric string.
 */
export function formatSummaryPill(folderCount: number, setCount: number, totalCards?: number): string {
  const parts: string[] = [];
  parts.push(`${folderCount} ${folderCount === 1 ? 'folder' : 'folders'}`);
  parts.push(`${setCount} ${setCount === 1 ? 'set' : 'sets'}`);
  if (totalCards !== undefined) {
    parts.push(`${totalCards} ${totalCards === 1 ? 'card' : 'cards'}`);
  }
  return parts.join(' · ');
}

/**
 * Pure sort function for folders based on selected sort option.
 */
export function sortFolders(folders: Folder[], sort: ExplorerSortOption): Folder[] {
  const sorted = [...folders];
  switch (sort) {
    case 'name':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case 'updatedAt':
    default:
      return sorted.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
  }
}

/**
 * Pure sort function for sets based on selected sort option.
 */
export function sortSets(sets: SetModel[], sort: ExplorerSortOption): SetModel[] {
  const sorted = [...sets];
  switch (sort) {
    case 'name':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case 'cardCount':
      return sorted.sort((a, b) => b.cardCount - a.cardCount);
    case 'updatedAt':
    default:
      return sorted.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
  }
}
