import { Flashcard3D } from '@/components/shared/Flashcard3D';
import { SwipeableCard } from '@/components/shared/SwipeableCard';
import type { StudyStageProps } from './types';
import { getStudyStageClassNames } from './utils';
import './style.scss';

export function StudyStage({
  currentCard,
  nextCard,
  isFlipped,
  orientation,
  onFlip,
  onSwipeLeft,
  onSwipeRight,
  isStarred,
  onToggleStar,
  swipeCardRef,
  isFocusMode = false,
  originSetName,
}: StudyStageProps) {
  if (!currentCard) {
    return null;
  }

  const rootClassName = getStudyStageClassNames(isFocusMode);

  return (
    <section className={rootClassName} aria-label="Interactive flashcard study stage">
      <div className="study-stage__card-area">
        {/* Subtle deck stack peek under active card */}
        {nextCard && <div className="study-stage__peek-card" aria-hidden="true" />}

        {/* Active swipeable flashcard */}
        <div className="study-stage__active-card">
          <SwipeableCard
            ref={swipeCardRef}
            onSwipeLeft={onSwipeLeft}
            onSwipeRight={onSwipeRight}
            onTap={onFlip}
            retryLabel="NEEDS PRACTICE"
            masterLabel="MASTERED"
          >
            <Flashcard3D
              card={currentCard}
              isFlipped={isFlipped}
              onFlip={onFlip}
              orientation={orientation}
              size="lg"
              showActions={false}
              isStarred={isStarred}
              onToggleStar={onToggleStar}
              originSetName={originSetName}
              className={isFocusMode ? 'study-stage__focus-card' : ''}
            />
          </SwipeableCard>
        </div>
      </div>
    </section>
  );
}

export type { StudyStageProps } from './types';
