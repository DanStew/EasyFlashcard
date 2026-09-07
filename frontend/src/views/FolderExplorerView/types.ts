import type { Folder } from '@/types/folder';
import type { SetModel } from '@/types/set';

export interface FolderExplorerViewProps {
  folderId?: string;
}

export interface FolderExplorerData {
  currentFolder: Folder | null;
  subfolders: Folder[];
  sets: SetModel[];
}
