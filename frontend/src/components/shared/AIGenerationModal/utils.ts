// ==========================================
// AIGenerationModal - Utilities
// ==========================================

import type { AIGenerationMode } from './types';

export interface ModeTabOption {
  id: AIGenerationMode;
  label: string;
  iconName: string;
}

export const GENERATION_MODES: ModeTabOption[] = [
  { id: 'prompt', label: 'Prompt & Topic', iconName: 'MessageSquarePlus' },
  { id: 'text', label: 'Notes & Markdown', iconName: 'FileText' },
  { id: 'document', label: 'From Document', iconName: 'FileUp' },
];

export const CARD_COUNT_OPTIONS = [5, 10, 15, 20, 30];

export const DIFFICULTY_OPTIONS: { id: 'beginner' | 'intermediate' | 'advanced'; label: string }[] = [
  { id: 'beginner', label: 'Beginner (Core Concepts)' },
  { id: 'intermediate', label: 'Intermediate (Standard)' },
  { id: 'advanced', label: 'Advanced (Deep Clinical / Technical)' },
];
