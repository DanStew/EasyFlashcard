import type { Flashcard } from '@/types/flashcard';

export type FlashcardSize = 'sm' | 'md' | 'lg';

export interface Flashcard3DProps {
  card: Flashcard;
  isFlipped?: boolean;
  onFlip?: () => void;
  onEdit?: (card: Flashcard) => void;
  onDelete?: (cardId: string) => void;
  size?: FlashcardSize;
  showActions?: boolean;
  className?: string;
}
