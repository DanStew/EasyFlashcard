// ==========================================
// DriveUploadModal - Types
// ==========================================

export interface DriveUploadModalProps {
  isOpen: boolean;
  targetFolderName?: string;
  targetFolderId?: string | null;
  onClose: () => void;
  onUpload: (file: File, folderId?: string | null) => Promise<void>;
}
