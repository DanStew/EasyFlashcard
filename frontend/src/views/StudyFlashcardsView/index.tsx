// ==========================================
// EasyFlashcard - StudyFlashcardsView
// ==========================================

import { useMemo, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, Edit, Plus } from 'lucide-react';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { Button } from '@/components/shared/Button';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import type { SwipeableCardHandle } from '@/components/shared/SwipeableCard';
import { useWorkspace } from '@/hooks/useWorkspace';
import { NotFoundView } from '@/views/NotFoundView';
import { StudyControls } from './components/StudyControls';
import { StudyHeader } from './components/StudyHeader';
import { StudyProgress } from './components/StudyProgress';
import { StudyShortcutsModal } from './components/StudyShortcutsModal';
import { StudyStage } from './components/StudyStage';
import { StudySummary } from './components/StudySummary';
import type { StudyFlashcardsViewProps } from './types';
import { useStudySession } from './useStudySession';
import { getStudyFlashcardsViewClassNames } from './utils';
import './style.scss';

export function StudyFlashcardsView({
  setId: propSetId,
  setIds: propSetIds,
  initialShuffle,
}: StudyFlashcardsViewProps) {
  const params = useParams<{ setId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { getBreadcrumbsForFolder, openStudyModal } = useWorkspace();
  const swipeCardRef = useRef<SwipeableCardHandle>(null);

  const setsQuery = searchParams.get('sets');
  const shuffleQuery = searchParams.get('shuffle') === 'true';

  // Resolve set IDs from props, URL params, or query string
  const resolvedSetIds = useMemo(() => {
    if (propSetIds && propSetIds.length > 0) return propSetIds;
    if (propSetId) return [propSetId];
    if (params.setId) return [params.setId];
    if (setsQuery) {
      return setsQuery
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return [];
  }, [propSetIds, propSetId, params.setId, setsQuery]);

  const {
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
    starredIds,
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
    history,
  } = useStudySession(resolvedSetIds, initialShuffle || shuffleQuery);

  const isMultiSet = sets.length > 1;

  const handleExit = () => {
    if (!isMultiSet && sets[0]) {
      navigate(`/set/${sets[0].id}`);
    } else {
      navigate('/');
    }
  };

  const handleButtonRetry = () => {
    if (swipeCardRef.current) {
      swipeCardRef.current.triggerSwipe('left');
    } else {
      markRetry();
    }
  };

  const handleButtonMaster = () => {
    if (swipeCardRef.current) {
      swipeCardRef.current.triggerSwipe('right');
    } else {
      markMastered();
    }
  };

  const rootClassName = getStudyFlashcardsViewClassNames({
    isFocusMode,
    isComplete,
  });

  const nextCard = queue[currentIndex + 1] || null;
  const isCurrentCardStarred = currentCard ? starredIds.includes(currentCard.id) : false;
  const currentCardOriginName =
    isMultiSet && currentCard ? setNameMap[currentCard.setId] : undefined;

  // Breadcrumbs computation
  const breadcrumbs = useMemo(() => {
    if (isMultiSet) {
      return [
        { id: 'root', label: 'Library', href: '/' },
        { id: 'study', label: `Study (${sets.length} Sets)` },
      ];
    }
    if (set) {
      const baseBreadcrumbs = getBreadcrumbsForFolder(set.folderId || null);
      return [
        ...baseBreadcrumbs,
        { id: set.id, label: set.name, href: `/set/${set.id}` },
        { id: 'study', label: 'Study' },
      ];
    }
    return [
      { id: 'root', label: 'Library', href: '/' },
      { id: 'study', label: 'Study' },
    ];
  }, [isMultiSet, sets, set, getBreadcrumbsForFolder]);

  // Loading State
  if (isLoading) {
    return (
      <div className={rootClassName}>
        <div className="study-flashcards-view__loading">
          <LoadingSpinner size="lg" />
          <p>Loading flashcards for study...</p>
        </div>
      </div>
    );
  }

  // Not Found State
  if (isNotFound) {
    return <NotFoundView entityType="set" />;
  }

  // No sets provided state (user navigated to /study directly)
  if (resolvedSetIds.length === 0) {
    return (
      <div className={rootClassName}>
        <div className="study-flashcards-view__breadcrumbs">
          <Breadcrumbs items={breadcrumbs} />
        </div>

        <EmptyState
          icon={<BookOpen size={40} />}
          title="No Flashcard Sets Selected"
          description="Choose one or more sets from your library to begin a personalized study session."
          action={
            <div className="study-flashcards-view__empty-actions">
              <Button
                variant="gradient"
                size="md"
                leftIcon={<Plus size={16} />}
                onClick={() => openStudyModal()}
              >
                Select Sets to Study
              </Button>
              <Button
                variant="secondary"
                size="md"
                leftIcon={<ArrowLeft size={16} />}
                onClick={() => navigate('/')}
              >
                Back to Library
              </Button>
            </div>
          }
        />
      </div>
    );
  }

  // Error or Empty Cards in Sets State
  if (error || (!isLoading && cards.length === 0)) {
    return (
      <div className={rootClassName}>
        {!isFocusMode && (
          <div className="study-flashcards-view__breadcrumbs">
            <Breadcrumbs items={breadcrumbs} />
          </div>
        )}

        <EmptyState
          icon={<BookOpen size={36} />}
          title={error ? 'Failed to Load Study Session' : 'No Flashcards in Selected Sets'}
          description={
            error ||
            'The chosen flashcard sets currently do not contain any flashcards to study. Add cards or select other sets.'
          }
          action={
            <div className="study-flashcards-view__empty-actions">
              <Button
                variant="secondary"
                size="md"
                leftIcon={<ArrowLeft size={16} />}
                onClick={handleExit}
              >
                Back to Library
              </Button>
              <Button
                variant="gradient"
                size="md"
                leftIcon={<BookOpen size={16} />}
                onClick={() => openStudyModal()}
              >
                Choose Other Sets
              </Button>
              {!isMultiSet && sets[0] && (
                <Button
                  variant="ghost"
                  size="md"
                  leftIcon={<Edit size={16} />}
                  onClick={() => navigate(`/set/${sets[0].id}/edit`)}
                >
                  Edit Set to Add Cards
                </Button>
              )}
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div className={rootClassName}>
      {/* Breadcrumbs Navigation (hidden during focus mode) */}
      {!isFocusMode && (
        <div className="study-flashcards-view__breadcrumbs">
          <Breadcrumbs items={breadcrumbs} />
        </div>
      )}

      {/* Top Study Header Toolbar */}
      <StudyHeader
        setName={isMultiSet ? `Studying ${sets.length} Sets` : set?.name}
        subtitle={
          isMultiSet
            ? sets.map((s) => s.name).join(' · ')
            : 'Study Session'
        }
        folderId={set?.folderId}
        onBack={handleExit}
        orientation={orientation}
        onToggleOrientation={toggleOrientation}
        isShuffled={isShuffled}
        onToggleShuffle={toggleShuffle}
        onReset={resetSession}
        onOpenShortcuts={() => setIsShortcutsModalOpen(true)}
        isFocusMode={isFocusMode}
        onToggleFocusMode={toggleFocusMode}
        disabled={isComplete}
        currentIndex={currentIndex}
        totalCards={queue.length}
      />

      {/* Main Interactive Stage or Completion Summary */}
      {isComplete ? (
        <StudySummary
          stats={stats}
          setName={isMultiSet ? `Combined Deck (${sets.length} sets)` : set?.name}
          starredCount={starredIds.length}
          perSetStats={perSetStats}
          onRestartAll={restartAllCards}
          onRestartRetryOnly={restartRetryOnly}
          onRestartStarredOnly={restartStarredOnly}
          onExit={handleExit}
        />
      ) : (
        <div className="study-flashcards-view__content">
          {/* Progress bar and counter pills (hidden during Focus Mode) */}
          {!isFocusMode && (
            <StudyProgress
              stats={stats}
              currentIndex={currentIndex}
              totalCards={queue.length}
            />
          )}

          {/* Interactive Card Stage with Set Origin Attribution Badge */}
          <StudyStage
            currentCard={currentCard}
            nextCard={nextCard}
            isFlipped={isFlipped}
            orientation={orientation}
            onFlip={flipCard}
            onSwipeLeft={markRetry}
            onSwipeRight={markMastered}
            isStarred={isCurrentCardStarred}
            onToggleStar={toggleStar}
            swipeCardRef={swipeCardRef}
            isFocusMode={isFocusMode}
            originSetName={currentCardOriginName}
          />

          {/* Bottom Tactical Controls */}
          <StudyControls
            onRetry={handleButtonRetry}
            onFlip={flipCard}
            onMaster={handleButtonMaster}
            onUndo={undo}
            canUndo={history.length > 0}
            isStarred={isCurrentCardStarred}
            onToggleStar={() => currentCard && toggleStar(currentCard.id)}
            disabled={!currentCard}
          />
        </div>
      )}

      {/* Keyboard Shortcuts Cheat Sheet Modal */}
      <StudyShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />
    </div>
  );
}

export type { StudyFlashcardsViewProps } from './types';
