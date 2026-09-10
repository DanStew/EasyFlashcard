// ==========================================
// AIGenerationModal - Utilities & Constants
// ==========================================

import type { FocusSuggestion } from './types';
import type { GenerationStage } from '@/types/aiGeneration';

export const FOCUS_SUGGESTIONS: FocusSuggestion[] = [
  {
    id: 'exhaustive',
    label: '✨ Comprehensive & Exhaustive',
    promptSnippet: 'Synthesize an exhaustive flashcard deck covering all key concepts, theorems, definitions, and mechanisms from start to finish.',
  },
  {
    id: 'definitions',
    label: '📖 Key Definitions & Terms',
    promptSnippet: 'Focus primarily on fundamental terms, core definitions, vocabulary, and distinguishing confusing concepts.',
  },
  {
    id: 'math',
    label: '🧮 LaTeX Math & Formulas',
    promptSnippet: 'Include full mathematical formulations with LaTeX notation ($...$ and $$...$$), equations, variable definitions, and step-by-step derivations.',
  },
  {
    id: 'mechanisms',
    label: '🔬 Mechanisms & Step-by-Step',
    promptSnippet: 'Focus on sequential processes, biological/chemical pathways, cause-and-effect relationships, and regulatory feedback loops.',
  },
  {
    id: 'cases',
    label: '💡 Applied Case Scenarios',
    promptSnippet: 'Frame cards as practical diagnostic scenarios, real-world case vignettes, and problem-solving questions.',
  },
];

export const AGENT_STEPS: { stage: GenerationStage; title: string; desc: string }[] = [
  {
    stage: 'planning',
    title: 'Curriculum & Coverage Planner',
    desc: 'Deconstructing source documents into modular topic chunks and slide inventory',
  },
  {
    stage: 'generating',
    title: 'Batch Flashcard Synthesizer',
    desc: 'Generating atomic active recall cards with LaTeX math and exact slide citations',
  },
  {
    stage: 'reviewing',
    title: 'Quality & Completeness Auditor',
    desc: 'Auditing coverage against source context to ensure zero skipped topics or hallucinations',
  },
  {
    stage: 'persisting',
    title: 'Set Provisioning & Deduplication',
    desc: 'Creating Flashcard Set in target folder and organizing citations',
  },
];
