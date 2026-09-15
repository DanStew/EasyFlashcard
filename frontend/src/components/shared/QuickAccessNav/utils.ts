// ==========================================
// EasyFlashcard - QuickAccessNav Utils
// ==========================================

import type { QuickAccessItem } from '@/services/quickAccessService';

/**
 * Returns the client-side router destination URL for a quick access item.
 */
export function getQuickAccessItemHref(item: QuickAccessItem): string {
  if (item.type === 'folder') {
    return `/folder/${item.id}`;
  }
  return `/set/${item.id}`;
}

/**
 * Checks whether an item matches the current active pathname.
 */
export function isQuickAccessItemActive(item: QuickAccessItem, currentPathname: string): boolean {
  const targetHref = getQuickAccessItemHref(item);
  return currentPathname === targetHref;
}
