// ==========================================
// AIGenerationHub - Types
// ==========================================

export interface AIGenerationHubProps {
  onOpenUpload: () => void;
  onOpenPromptModal: (initialMode?: 'prompt' | 'text' | 'document') => void;
  onExploreDocuments: () => void;
}
