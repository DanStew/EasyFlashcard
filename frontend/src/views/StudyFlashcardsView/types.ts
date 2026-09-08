import type { Flashcard } from '@/types/flashcard';
import type { SetModel } from '@/types/set';

export type CardOrientation = 'term-first' | 'definition-first';
export type StudySessionMode = 'all' | 'retry-only' | 'starred-only';
export type StudyCardAction = 'mastered' | 'retry';

export interface StudyHistoryItem {
  cardId: string;
  action: StudyCardAction;
  queueIndex: number;
}

export interface StudyStats {
  totalCards: number;
  reviewedCount: number;
  masteredCount: number;
  retryCount: number;
  remainingCount: number;
  masteryPercentage: number;
}

export interface PerSetStudyStats {
  set: SetModel;
  totalCards: number;
  masteredCount: number;
  retryCount: number;
  masteryPercentage: number;
}

export interface StudySessionState {
  set: SetModel | null;
  sets: SetModel[];
  setNameMap: Record<string, string>;
  isLoading: boolean;
  isNotFound: boolean;
  error: string | null;
  cards: Flashcard[];
  queue: Flashcard[];
  currentIndex: number;
  isFlipped: boolean;
  orientation: CardOrientation;
  isShuffled: boolean;
  masteredIds: string[];
  retryIds: string[];
  starredIds: string[];
  history: StudyHistoryItem[];
  isComplete: boolean;
  isFocusMode: boolean;
  isShortcutsModalOpen: boolean;
  sessionMode: StudySessionMode;
  perSetStats: PerSetStudyStats[];
}

export interface StudyFlashcardsViewProps {
  setId?: string;
  setIds?: string[];
  initialShuffle?: boolean;
}
