import type { CardOrientation } from '../../types';

export interface StudyHeaderProps {
  setName?: string;
  subtitle?: string;
  folderId?: string | null;
  onBack: () => void;
  orientation: CardOrientation;
  onToggleOrientation: () => void;
  isShuffled: boolean;
  onToggleShuffle: () => void;
  onReset: () => void;
  onOpenShortcuts: () => void;
  isFocusMode: boolean;
  onToggleFocusMode: () => void;
  disabled?: boolean;
  currentIndex?: number;
  totalCards?: number;
}
