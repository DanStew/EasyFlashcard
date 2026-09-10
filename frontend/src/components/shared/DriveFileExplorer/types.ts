// ==========================================
// DriveFileExplorer - Types
// ==========================================

import type { Document, DriveFolderContentsResponse } from '@/types/document';

export type ViewMode = 'grid' | 'list';

export interface DriveFileExplorerProps {
  contents: DriveFolderContentsResponse | null;
  isLoading: boolean;
  isRefreshing?: boolean;
  onNavigateFolder: (folderId: string | null) => void;
  onOpenDocument: (document: Document) => void;
  onRefreshClick?: () => void;
  onUploadClick: () => void;
  onNewFolderClick: () => void;
  onMoveItemClick: (item: { id: string; name: string; isFolder: boolean }) => void;
  onTrashItemClick: (item: { id: string; name: string; isFolder: boolean }) => void;
  onGenerateFlashcardsClick?: (document: Document) => void;
}
