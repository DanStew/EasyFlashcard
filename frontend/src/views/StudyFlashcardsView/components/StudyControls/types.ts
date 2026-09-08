export interface StudyControlsProps {
  onRetry: () => void;
  onFlip: () => void;
  onMaster: () => void;
  onUndo: () => void;
  canUndo: boolean;
  isStarred: boolean;
  onToggleStar: () => void;
  disabled?: boolean;
}
