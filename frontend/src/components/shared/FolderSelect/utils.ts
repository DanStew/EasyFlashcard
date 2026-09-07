import type { Folder } from '@/types/folder';
import type { FolderDisplayInfo } from './types';

/**
 * Resolves display details (name, path, isRoot) for the given selected folder ID.
 */
export function getFolderDisplayInfo(
  folders: Folder[],
  folderId: string | null
): FolderDisplayInfo {
  if (!folderId) {
    return {
      name: 'Root Library',
      path: '/',
      isRoot: true,
    };
  }

  const match = folders.find((f) => f.id === folderId);
  if (match) {
    return {
      name: match.name,
      path: match.path || `/${match.name}/`,
      isRoot: false,
    };
  }

  return {
    name: 'Folder',
    path: '/',
    isRoot: false,
  };
}

/**
 * Computes CSS class names for the FolderSelect component.
 */
export function getFolderSelectClassNames({
  isOpen,
  disabled,
  className,
}: {
  isOpen: boolean;
  disabled?: boolean;
  className?: string;
}): {
  containerClass: string;
  triggerClass: string;
  dropdownClass: string;
} {
  const containerClass = ['folder-select', className].filter(Boolean).join(' ');

  const triggerClass = [
    'folder-select__trigger',
    isOpen ? 'folder-select__trigger--open' : '',
    disabled ? 'folder-select__trigger--disabled' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const dropdownClass = [
    'folder-select__dropdown',
    isOpen ? 'folder-select__dropdown--open animate-fade-in' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return { containerClass, triggerClass, dropdownClass };
}
