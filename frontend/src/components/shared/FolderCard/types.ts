import type { Folder } from '@/types/folder';

export interface FolderCardProps {
  /** The folder data model */
  folder: Folder;
  /** Optional number of direct subfolders */
  subfolderCount?: number;
  /** Optional number of flashcard sets inside */
  setCount?: number;
  /** Optional sample preview items (names of subfolders or sets inside) */
  previewItems?: string[];
  /** Click handler to navigate into folder */
  onClick?: () => void;
  /** Handler to initiate renaming this folder */
  onRename?: (folder: Folder) => void;
  /** Handler to initiate deleting this folder */
  onDelete?: (folder: Folder) => void;
  /** Handler to initiate creating a nested subfolder */
  onCreateSubfolder?: (folder: Folder) => void;
  /** Display layout mode */
  viewMode?: 'grid' | 'list';
  /** Optional extra CSS class */
  className?: string;
}
