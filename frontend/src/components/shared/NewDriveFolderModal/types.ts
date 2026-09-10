// ==========================================
// NewDriveFolderModal - Types
// ==========================================

export interface NewDriveFolderModalProps {
  isOpen: boolean;
  parentFolderName?: string;
  parentFolderId?: string | null;
  onClose: () => void;
  onCreateFolder: (name: string, parentFolderId?: string | null) => Promise<void>;
}
