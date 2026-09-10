// ==========================================
// GroundingDocPicker - Types
// ==========================================

import type { Document, DriveBreadcrumb, DriveFolderItem } from '@/types/document';

export interface GroundingDocPickerProps {
  selectedDocs: Document[];
  onToggleDoc: (doc: Document) => void;
  onRemoveDoc: (docId: string) => void;
  onClearAll: () => void;
  disabled?: boolean;
}

export interface FolderBrowseState {
  currentFolder: DriveFolderItem | null;
  breadcrumbs: DriveBreadcrumb[];
  subfolders: DriveFolderItem[];
  files: Document[];
  isLoading: boolean;
  error: string | null;
}
