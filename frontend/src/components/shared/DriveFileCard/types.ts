// ==========================================
// DriveFileCard - Types
// ==========================================

import type { Document } from '@/types/document';

export interface DriveFileCardProps {
  document: Document;
  viewMode?: 'grid' | 'list';
  onClick: () => void;
  onGenerateFlashcards?: () => void;
  onOpenInDrive?: () => void;
  onMove?: () => void;
  onTrash?: () => void;
  className?: string;
}
