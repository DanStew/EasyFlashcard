import type { SetModel } from '@/types/set';

export interface SetCardProps {
  /** Flashcard set data model */
  set: SetModel;
  /** Callback to view the set detail */
  onView?: (set: SetModel) => void;
  /** Callback to launch study mode */
  onStudy?: (set: SetModel) => void;
  /** Callback to edit set properties/cards */
  onEdit?: (set: SetModel) => void;
  /** Callback to delete the set */
  onDelete?: (set: SetModel) => void;
  /** Display layout mode */
  viewMode?: 'grid' | 'list';
  /** Optional additional class name */
  className?: string;
}
