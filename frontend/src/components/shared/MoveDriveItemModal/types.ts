// ==========================================
// MoveDriveItemModal - Types
// ==========================================

import type { DriveFolderItem } from '@/types/document';

export interface MoveDriveItemModalProps {
  isOpen: boolean;
  item: { id: string; name: string; isFolder: boolean } | null;
  currentFolderId: string;
  rootFolderId: string;
  availableFolders: DriveFolderItem[];
  onClose: () => void;
  onMoveItem: (itemId: string, targetFolderId: string, sourceFolderId?: string | null) => Promise<void>;
}
