import { ProgressBar } from '@/components/shared/ProgressBar';
import type { StudyProgressProps } from './types';
import { createStudyProgressSegments } from './utils';
import './style.scss';

export function StudyProgress({ stats, currentIndex, totalCards }: StudyProgressProps) {
  const segments = createStudyProgressSegments(stats);
  const currentDisplayNumber = Math.min(totalCards, currentIndex + 1);

  return (
    <div className="study-progress">
      <div className="study-progress__pills">
        <div className="study-progress__counts">
          <span className="study-progress__pill study-progress__pill--mastered">
            <span className="study-progress__dot study-progress__dot--mastered" />
            Mastered: {stats.masteredCount}
          </span>

          <span className="study-progress__pill study-progress__pill--retry">
            <span className="study-progress__dot study-progress__dot--retry" />
            Needs Practice: {stats.retryCount}
          </span>

          <span className="study-progress__pill study-progress__pill--remaining">
            <span className="study-progress__dot study-progress__dot--remaining" />
            Remaining: {stats.remainingCount}
          </span>
        </div>

        <span className="study-progress__counter">
          Card {totalCards > 0 ? currentDisplayNumber : 0} of {totalCards}
        </span>
      </div>

      <ProgressBar
        max={totalCards}
        segments={segments}
        size="md"
        ariaLabel="Flashcards study round progress"
      />
    </div>
  );
}

export type { StudyProgressProps } from './types';
