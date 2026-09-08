import type { StudyStats } from './types';

/**
 * Implements Fisher-Yates shuffle returning a newly shuffled array without mutating the original
 */
export function shuffleArray<T>(items: T[]): T[] {
  const array = [...items];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
  return array;
}

/**
 * Computes study statistics for the active session
 */
export function computeStudyStats(
  totalInQueue: number,
  currentIndex: number,
  masteredCount: number,
  retryCount: number
): StudyStats {
  const reviewedCount = Math.min(totalInQueue, currentIndex);
  const remainingCount = Math.max(0, totalInQueue - reviewedCount);
  const masteryPercentage =
    reviewedCount > 0 ? Math.round((masteredCount / reviewedCount) * 100) : 0;

  return {
    totalCards: totalInQueue,
    reviewedCount,
    masteredCount,
    retryCount,
    remainingCount,
    masteryPercentage,
  };
}

/**
 * Computes individual study statistics for each set involved in the multi-set session
 */
export function computePerSetStats(
  sets: import('@/types/set').SetModel[],
  cards: import('@/types/flashcard').Flashcard[],
  masteredIds: string[],
  retryIds: string[]
): import('./types').PerSetStudyStats[] {
  const masteredSet = new Set(masteredIds);
  const retrySet = new Set(retryIds);

  return sets.map((set) => {
    const setCards = cards.filter((c) => c.setId === set.id);
    const setTotal = setCards.length;
    let setMastered = 0;
    let setRetry = 0;

    for (const card of setCards) {
      if (masteredSet.has(card.id)) setMastered++;
      if (retrySet.has(card.id)) setRetry++;
    }

    const reviewed = setMastered + setRetry;
    const masteryPercentage = reviewed > 0 ? Math.round((setMastered / reviewed) * 100) : 0;

    return {
      set,
      totalCards: setTotal,
      masteredCount: setMastered,
      retryCount: setRetry,
      masteryPercentage,
    };
  });
}

/**
 * Generates class names for StudyFlashcardsView root container
 */
export function getStudyFlashcardsViewClassNames({
  isFocusMode,
  isComplete,
}: {
  isFocusMode: boolean;
  isComplete: boolean;
}): string {
  const classes = ['study-flashcards-view'];
  if (isFocusMode) classes.push('study-flashcards-view--focus-mode');
  if (isComplete) classes.push('study-flashcards-view--complete');
  return classes.join(' ');
}
