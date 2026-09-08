import type { StudyStats } from '../../types';

export interface StudyProgressProps {
  stats: StudyStats;
  currentIndex: number;
  totalCards: number;
}
