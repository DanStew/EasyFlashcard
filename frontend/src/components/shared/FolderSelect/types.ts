import type { Folder } from '@/types/folder';

export interface FolderDisplayInfo {
  name: string;
  path: string;
  isRoot: boolean;
}

export interface FolderSelectProps {
  /** List of available folders */
  folders: Folder[];
  /** Current selected folder ID, null or empty string represents Root Library */
  selectedFolderId: string | null;
  /** Callback fired when a folder is selected */
  onSelectFolder: (folderId: string) => void;
  /** Optional custom label above the picker */
  label?: string;
  /** Whether the control is disabled */
  disabled?: boolean;
  /** Optional custom class name */
  className?: string;
}
