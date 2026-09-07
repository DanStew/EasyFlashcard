// ==========================================
// EasyFlashcard - Folder Models
// ==========================================

export interface Folder {
  id: string;
  userId: string;
  parentId: string | null;
  name: string;
  path: string;
  subfolderCount?: number;
  setCount?: number;
  previewItems?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface FolderCreate {
  name: string;
  parentId?: string | null;
}

export interface FolderUpdate {
  name?: string;
  parentId?: string | null;
}

export interface FolderTreeItem {
  id: string;
  userId: string;
  name: string;
  parentId: string | null;
  path: string;
  setCount: number;
  subfolders: FolderTreeItem[];
  createdAt: string;
  updatedAt: string;
}

