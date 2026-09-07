import type { BreadcrumbItem } from '@/components/shared/Breadcrumbs';
import type { SetModel } from '@/types/set';

/**
 * Builds breadcrumbs hierarchy for a specific set.
 */
export function buildSetBreadcrumbs(set: SetModel | null): BreadcrumbItem[] {
  const crumbs: BreadcrumbItem[] = [
    { id: 'home', label: 'EasyFlashcard', href: '/' },
    { id: 'sets', label: 'Sets', href: '/sets' },
  ];

  if (set?.folderId) {
    crumbs.push({
      id: `folder-${set.folderId}`,
      label: 'Folder',
      href: `/folder/${set.folderId}`,
    });
  }

  if (set) {
    crumbs.push({
      id: set.id,
      label: set.name,
      href: `/set/${set.id}`,
    });
  }

  return crumbs;
}
