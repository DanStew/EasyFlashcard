// ==========================================
// AIGenerationModal - Types
// ==========================================

import type { Document } from '@/types/document';
import type { Folder } from '@/types/folder';
import type { AIGenerationEvent, AIGenerationRequest } from '@/types/aiGeneration';

export interface AIGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableDocuments?: Document[];
  folders?: Folder[];
  initialSelectedDoc?: Document | null;
  initialFolderId?: string | null;
  onStartGeneration: (request: AIGenerationRequest) => Promise<void>;
  generationEvent: AIGenerationEvent | null;
  isGenerating: boolean;
  onNavigateToSet?: (setId: string) => void;
}

export interface FocusSuggestion {
  id: string;
  label: string;
  promptSnippet: string;
}
