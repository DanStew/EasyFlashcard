// ==========================================
// EasyFlashcard - useStudySession Hook
// ==========================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ApiError } from '@/services/apiClient';
import { flashcardService } from '@/services/flashcardService';
import { setService } from '@/services/setService';
import type { Flashcard } from '@/types/flashcard';
import type { SetModel } from '@/types/set';
import type {
  CardOrientation,
  PerSetStudyStats,
  StudyHistoryItem,
  StudySessionMode,
  StudyStats,
} from './types';
import { computePerSetStats, computeStudyStats, shuffleArray } from './utils';

export function useStudySession(
  setIdsInput?: string | string[],
  initialShuffle: boolean = false
) {
  // Normalize input IDs
  const setIds = useMemo(() => {
    if (!setIdsInput) return [];
    if (typeof setIdsInput === 'string') return [setIdsInput];
    return setIdsInput.filter(Boolean);
  }, [setIdsInput]);

  const [sets, setSets] = useState<SetModel[]>([]);
  const [set, setSet] = useState<SetModel | null>(null);
  const [setNameMap, setSetNameMap] = useState<Record<string, string>>({});
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [queue, setQueue] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [orientation, setOrientation] = useState<CardOrientation>('term-first');
  const [isShuffled, setIsShuffled] = useState(initialShuffle);
  const [masteredIds, setMasteredIds] = useState<string[]>([]);
  const [retryIds, setRetryIds] = useState<string[]>([]);
  const [starredIds, setStarredIds] = useState<string[]>([]);
  const [history, setHistory] = useState<StudyHistoryItem[]>([]);
  const [sessionMode, setSessionMode] = useState<StudySessionMode>('all');
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initial load
  const loadData = useCallback(async () => {
    if (setIds.length === 0) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      setIsNotFound(false);
      setError(null);

      // Concurrent fetch for all sets and their flashcards
      const [loadedSets, cardBatches] = await Promise.all([
        Promise.all(setIds.map((id) => setService.getSet(id))),
        Promise.all(setIds.map((id) => flashcardService.listCardsBySet(id))),
      ]);

      const combinedCards = cardBatches.flat();
      const nameMap: Record<string, string> = {};
      loadedSets.forEach((s) => {
        nameMap[s.id] = s.name;
      });

      setSets(loadedSets);
      setSet(loadedSets[0] || null);
      setSetNameMap(nameMap);
      setCards(combinedCards);
      setQueue(initialShuffle ? shuffleArray(combinedCards) : combinedCards);
      setIsShuffled(initialShuffle);
      setCurrentIndex(0);
      setIsFlipped(false);
      setMasteredIds([]);
      setRetryIds([]);
      setHistory([]);
    } catch (err: unknown) {
      if (err instanceof ApiError && err.isNotFound) {
        setIsNotFound(true);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load flashcards for study');
      }
    } finally {
      setIsLoading(false);
    }
  }, [setIds, initialShuffle]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const currentCard = queue[currentIndex] || null;
  const isComplete = queue.length > 0 && currentIndex >= queue.length;
  const stats: StudyStats = computeStudyStats(
    queue.length,
    currentIndex,
    masteredIds.length,
    retryIds.length
  );

  const perSetStats: PerSetStudyStats[] = useMemo(
    () => computePerSetStats(sets, cards, masteredIds, retryIds),
    [sets, cards, masteredIds, retryIds]
  );

  // Flip card
  const flipCard = useCallback(() => {
    if (isComplete) return;
    setIsFlipped((prev) => !prev);
  }, [isComplete]);

  // Mark Mastered
  const markMastered = useCallback(() => {
    if (!currentCard || isComplete) return;
    const cardId = currentCard.id;

    setMasteredIds((prev) => (prev.includes(cardId) ? prev : [...prev, cardId]));
    setRetryIds((prev) => prev.filter((id) => id !== cardId));
    setHistory((prev) => [...prev, { cardId, action: 'mastered', queueIndex: currentIndex }]);
    setIsFlipped(false);
    setCurrentIndex((prev) => prev + 1);
  }, [currentCard, currentIndex, isComplete]);

  // Mark Retry
  const markRetry = useCallback(() => {
    if (!currentCard || isComplete) return;
    const cardId = currentCard.id;

    setRetryIds((prev) => (prev.includes(cardId) ? prev : [...prev, cardId]));
    setMasteredIds((prev) => prev.filter((id) => id !== cardId));
    setHistory((prev) => [...prev, { cardId, action: 'retry', queueIndex: currentIndex }]);
    setIsFlipped(false);
    setCurrentIndex((prev) => prev + 1);
  }, [currentCard, currentIndex, isComplete]);

  // Undo last action
  const undo = useCallback(() => {
    if (history.length === 0 || currentIndex === 0) return;

    const lastItem = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));

    if (lastItem.action === 'mastered') {
      setMasteredIds((prev) => prev.filter((id) => id !== lastItem.cardId));
    } else {
      setRetryIds((prev) => prev.filter((id) => id !== lastItem.cardId));
    }

    setCurrentIndex(lastItem.queueIndex);
    setIsFlipped(false);
  }, [currentIndex, history]);

  // Toggle Shuffle
  const toggleShuffle = useCallback(() => {
    const nextShuffled = !isShuffled;
    setIsShuffled(nextShuffled);

    let baseDeck: Flashcard[] = [];
    if (sessionMode === 'retry-only') {
      baseDeck = cards.filter((c) => retryIds.includes(c.id));
    } else if (sessionMode === 'starred-only') {
      baseDeck = cards.filter((c) => starredIds.includes(c.id));
    } else {
      baseDeck = [...cards];
    }

    setQueue(nextShuffled ? shuffleArray(baseDeck) : baseDeck);
    setCurrentIndex(0);
    setIsFlipped(false);
    setMasteredIds([]);
    setRetryIds([]);
    setHistory([]);
  }, [cards, isShuffled, retryIds, sessionMode, starredIds]);

  // Toggle Orientation (Term first vs Definition first)
  const toggleOrientation = useCallback(() => {
    setOrientation((prev) => (prev === 'term-first' ? 'definition-first' : 'term-first'));
    setIsFlipped(false);
  }, []);

  // Reset entire session back to card 1
  const resetSession = useCallback(() => {
    let baseDeck: Flashcard[] = [];
    if (sessionMode === 'retry-only') {
      baseDeck = cards.filter((c) => retryIds.includes(c.id));
    } else if (sessionMode === 'starred-only') {
      baseDeck = cards.filter((c) => starredIds.includes(c.id));
    } else {
      baseDeck = [...cards];
    }

    setQueue(isShuffled ? shuffleArray(baseDeck) : baseDeck);
    setCurrentIndex(0);
    setIsFlipped(false);
    setMasteredIds([]);
    setRetryIds([]);
    setHistory([]);
  }, [cards, isShuffled, retryIds, sessionMode, starredIds]);

  // Restart with only retry cards
  const restartRetryOnly = useCallback(() => {
    const retryCards = cards.filter((c) => retryIds.includes(c.id));
    if (retryCards.length === 0) return;

    setSessionMode('retry-only');
    setQueue(isShuffled ? shuffleArray(retryCards) : retryCards);
    setCurrentIndex(0);
    setIsFlipped(false);
    setMasteredIds([]);
    setRetryIds([]);
    setHistory([]);
  }, [cards, isShuffled, retryIds]);

  // Restart all cards in the set
  const restartAllCards = useCallback(() => {
    setSessionMode('all');
    setQueue(isShuffled ? shuffleArray(cards) : [...cards]);
    setCurrentIndex(0);
    setIsFlipped(false);
    setMasteredIds([]);
    setRetryIds([]);
    setHistory([]);
  }, [cards, isShuffled]);

  // Restart only starred cards
  const restartStarredOnly = useCallback(() => {
    const starredCards = cards.filter((c) => starredIds.includes(c.id));
    if (starredCards.length === 0) return;

    setSessionMode('starred-only');
    setQueue(isShuffled ? shuffleArray(starredCards) : starredCards);
    setCurrentIndex(0);
    setIsFlipped(false);
    setMasteredIds([]);
    setRetryIds([]);
    setHistory([]);
  }, [cards, isShuffled, starredIds]);

  // Toggle Star on a card
  const toggleStar = useCallback((cardId: string) => {
    setStarredIds((prev) =>
      prev.includes(cardId) ? prev.filter((id) => id !== cardId) : [...prev, cardId]
    );
  }, []);

  // Toggle Focus Mode
  const toggleFocusMode = useCallback(() => {
    setIsFocusMode((prev) => !prev);
  }, []);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
        return;
      }

      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setIsShortcutsModalOpen((prev) => !prev);
        return;
      }

      if (isShortcutsModalOpen) {
        if (e.key === 'Escape') {
          setIsShortcutsModalOpen(false);
        }
        return;
      }

      if (e.key === 'Escape' && isFocusMode) {
        e.preventDefault();
        toggleFocusMode();
        return;
      }

      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        flipCard();
        return;
      }

      if (e.key === 'ArrowRight' || e.key === '2') {
        e.preventDefault();
        markMastered();
        return;
      }

      if (e.key === 'ArrowLeft' || e.key === '1') {
        e.preventDefault();
        markRetry();
        return;
      }

      if ((e.key === 'z' || e.key === 'Z') && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        undo();
        return;
      }

      if (e.key === 's' || e.key === 'S') {
        if (currentCard) {
          e.preventDefault();
          toggleStar(currentCard.id);
        }
        return;
      }

      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFocusMode();
        return;
      }

      if (e.key === 'o' || e.key === 'O') {
        e.preventDefault();
        toggleOrientation();
        return;
      }

      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        toggleShuffle();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    currentCard,
    flipCard,
    isFocusMode,
    isShortcutsModalOpen,
    markMastered,
    markRetry,
    toggleFocusMode,
    toggleOrientation,
    toggleShuffle,
    toggleStar,
    undo,
  ]);

  return {
    set,
    sets,
    setNameMap,
    cards,
    queue,
    currentCard,
    currentIndex,
    isFlipped,
    orientation,
    isShuffled,
    masteredIds,
    retryIds,
    starredIds,
    history,
    sessionMode,
    isComplete,
    isFocusMode,
    isShortcutsModalOpen,
    isLoading,
    isNotFound,
    error,
    stats,
    perSetStats,
    flipCard,
    markMastered,
    markRetry,
    undo,
    toggleShuffle,
    toggleOrientation,
    resetSession,
    restartRetryOnly,
    restartAllCards,
    restartStarredOnly,
    toggleStar,
    toggleFocusMode,
    setIsShortcutsModalOpen,
    retryCount: retryIds.length,
    masteredCount: masteredIds.length,
    starredCount: starredIds.length,
    hasRetryCards: retryIds.length > 0,
    hasStarredCards: starredIds.length > 0,
  };
}
