import type { Folder } from '@/types/folder';
import type { SetModel } from '@/types/set';

export interface GlobalSearchProps {
  /** Optional placeholder text for the input */
  placeholder?: string;
  /** Optional external search value */
  value?: string;
  /** Optional change callback */
  onChange?: (value: string) => void;
  /** Callback when user triggers full library search */
  onNavigateToFullSearch?: (query: string) => void;
  /** Optional extra class name */
  className?: string;
}

export type NavigableItem =
  | { type: 'folder'; id: string; folder: Folder }
  | { type: 'set'; id: string; set: SetModel }
  | { type: 'view_all'; id: string; query: string };
