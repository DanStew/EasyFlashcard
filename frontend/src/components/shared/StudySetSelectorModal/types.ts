// ==========================================
// EasyFlashcard - StudySetSelectorModal Types
// ==========================================

import type { SetModel } from '@/types/set';

export interface StudySetSelectorModalProps {
  /** Controls modal visibility */
  isOpen: boolean;
  /** Callback fired when modal is dismissed */
  onClose: () => void;
  /** Optional initial folder to pre-focus in the drill-down view */
  initialFolderId?: string | null;
}

export interface SelectorBreadcrumb {
  id: string | null;
  name: string;
}

export interface FolderDisplayNode {
  id: string;
  name: string;
  path: string;
  setCount: number;
  subfolderCount: number;
}

export interface SearchSetResult {
  set: SetModel;
  folderPath: string;
}
