// ==========================================
// AI Generation Types & Schemas
// ==========================================

export type GenerationStage =
  | 'init'
  | 'planning'
  | 'generating'
  | 'reviewing'
  | 'refining'
  | 'persisting'
  | 'completed'
  | 'error';

export interface AIGenerationRequest {
  prompt?: string;
  documentIds?: string[];
  rawText?: string;
  folderId?: string | null;
  setName?: string;
  setDescription?: string;
  focusMode?: string;
}

export interface AIGenerationEvent {
  stage: GenerationStage;
  progress: number;
  message: string;
  cardCount: number;
  setId?: string | null;
  setName?: string | null;
  error?: string | null;
}

export interface FocusModeOption {
  id: string;
  label: string;
  description: string;
  promptSuffix: string;
}
