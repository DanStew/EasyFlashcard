import type { Flashcard } from '@/types/flashcard';
import type { SetModel } from '@/types/set';

export interface SetDetailViewProps {
  setId?: string;
}

export interface SetDetailState {
  set: SetModel | null;
  cards: Flashcard[];
  isLoading: boolean;
  activeCardIndex: number;
}
