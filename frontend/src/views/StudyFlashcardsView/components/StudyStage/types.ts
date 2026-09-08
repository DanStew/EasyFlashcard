import type { Ref } from 'react';
import type { SwipeableCardHandle } from '@/components/shared/SwipeableCard';
import type { Flashcard } from '@/types/flashcard';
import type { CardOrientation } from '../../types';

export interface StudyStageProps {
  currentCard: Flashcard | null;
  nextCard?: Flashcard | null;
  isFlipped: boolean;
  orientation: CardOrientation;
  onFlip: () => void;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  isStarred: boolean;
  onToggleStar: (cardId: string) => void;
  swipeCardRef?: Ref<SwipeableCardHandle>;
  isFocusMode?: boolean;
  originSetName?: string;
}
