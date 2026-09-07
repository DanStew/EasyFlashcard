import type { FolderTreeItem } from '@/types/folder';

export interface FolderTreeNavProps {
  tree: FolderTreeItem[];
  activeFolderId?: string | null;
  onSelectFolder?: (folderId: string) => void;
  onCreateSubfolder?: (parentId: string) => void;
  onDeleteFolder?: (folderId: string) => void;
  isLoading?: boolean;
}
