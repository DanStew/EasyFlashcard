// ==========================================
// AIGenerationHub - Utilities
// ==========================================

export interface AICapabilityCard {
  id: 'document' | 'prompt' | 'text';
  title: string;
  badge: string;
  badgeVariant: 'primary' | 'subtle' | 'success';
  description: string;
  actionText: string;
  highlightPill: string;
}

export const AI_CAPABILITIES: AICapabilityCard[] = [
  {
    id: 'document',
    title: 'From Documents & Slides',
    badge: 'Document AI',
    badgeVariant: 'primary',
    description:
      'Upload or select study PDFs, slide decks, and lecture notes directly from your Google Drive to extract structured flashcards with concept citations.',
    actionText: 'Upload Document',
    highlightPill: 'PDF • PPTX • DOCX',
  },
  {
    id: 'prompt',
    title: 'From Prompt or Topic',
    badge: 'Prompt AI',
    badgeVariant: 'primary',
    description:
      'Describe any subject, syllabus theme, or medical/engineering concept to automatically generate comprehensive Q&A flashcard sets.',
    actionText: 'Create by Prompt',
    highlightPill: 'Any Subject • Custom Difficulty',
  },
  {
    id: 'text',
    title: 'From Raw Text & Notes',
    badge: 'Text Extraction',
    badgeVariant: 'success',
    description:
      'Paste lecture transcripts, article snippets, or Markdown summaries to synthesize key definitions and high-yield flashcard pairs.',
    actionText: 'Paste Notes',
    highlightPill: 'Markdown • Lecture Notes',
  },
];
