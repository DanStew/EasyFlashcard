import type { ProgressSegment } from '@/components/shared/ProgressBar';
import type { StudyStats } from '../../types';

export function createStudyProgressSegments(stats: StudyStats): ProgressSegment[] {
  return [
    {
      id: 'mastered',
      value: stats.masteredCount,
      colorVar: '--color-success',
      label: 'Mastered',
    },
    {
      id: 'retry',
      value: stats.retryCount,
      colorVar: '--color-warning',
      label: 'Needs Practice',
    },
  ];
}
