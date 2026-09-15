import type { MobileNavTabId } from './types';

/**
 * Determines which tab is currently active based on the current location pathname.
 */
export function getActiveMobileTab(pathname: string): MobileNavTabId {
  if (pathname.startsWith('/studio') || pathname.startsWith('/documents')) {
    return 'studio';
  }
  if (pathname === '/' || pathname.startsWith('/folder/')) {
    return 'library';
  }
  return 'library';
}
