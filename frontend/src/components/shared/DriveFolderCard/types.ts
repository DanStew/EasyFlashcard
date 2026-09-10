// ==========================================
// DriveFolderCard - Types
// ==========================================

import type { DriveFolderItem } from '@/types/document';

export interface DriveFolderCardProps {
  folder: DriveFolderItem;
  viewMode?: 'grid' | 'list';
  onClick: () => void;
  onMove?: () => void;
  onTrash?: () => void;
  className?: string;
}
