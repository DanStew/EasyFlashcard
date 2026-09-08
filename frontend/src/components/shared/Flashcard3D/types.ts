import type { Flashcard } from '@/types/flashcard';

export type FlashcardSize = 'sm' | 'md' | 'lg';
export type CardOrientation = 'term-first' | 'definition-first';

export interface Flashcard3DProps {
  card: Flashcard;
  isFlipped?: boolean;
  onFlip?: () => void;
  onEdit?: (card: Flashcard) => void;
  onDelete?: (cardId: string) => void;
  size?: FlashcardSize;
  showActions?: boolean;
  className?: string;
  orientation?: CardOrientation;
  isStarred?: boolean;
  onToggleStar?: (cardId: string) => void;
  /** Optional origin flashcard set name to display on the card badge */
  originSetName?: string;
}
