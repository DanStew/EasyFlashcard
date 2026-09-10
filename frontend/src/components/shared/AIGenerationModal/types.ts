// ==========================================
// AIGenerationModal - Types
// ==========================================

export type AIGenerationMode = 'prompt' | 'text' | 'document';

export interface AIGenerationConfig {
  mode: AIGenerationMode;
  topic: string;
  notesText: string;
  selectedDocumentId?: string | null;
  cardCount: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  targetFolderId?: string | null;
}

export interface AIGenerationModalProps {
  isOpen: boolean;
  initialMode?: AIGenerationMode;
  initialDocumentId?: string | null;
  initialDocumentName?: string | null;
  onClose: () => void;
  onGenerate: (config: AIGenerationConfig) => void;
}
