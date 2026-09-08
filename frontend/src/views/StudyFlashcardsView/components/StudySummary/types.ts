import type { StudyStats } from '../../types';

export interface StudySummaryProps {
  stats: StudyStats;
  setName?: string;
  starredCount: number;
  perSetStats?: import('../../types').PerSetStudyStats[];
  onRestartAll: () => void;
  onRestartRetryOnly: () => void;
  onRestartStarredOnly: () => void;
  onExit: () => void;
}
