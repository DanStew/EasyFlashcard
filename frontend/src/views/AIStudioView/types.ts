// ==========================================
// AIStudioView - Types
// ==========================================

import type { DriveErrorCode } from '@/types/document';

export interface AIStudioState {
  currentFolderId: string | null;
  searchQuery: string;
  isUploadModalOpen: boolean;
  isNewFolderModalOpen: boolean;
  moveItemTarget: { id: string; name: string; isFolder: boolean } | null;
  errorCode: DriveErrorCode | null;
  errorMessage: string | null;
}
