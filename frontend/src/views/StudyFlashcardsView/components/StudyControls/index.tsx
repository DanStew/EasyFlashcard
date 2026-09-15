import {
  Check,
  RotateCw,
  Star,
  Undo2,
  X,
} from 'lucide-react';
import { useHaptics } from '@/hooks/useHaptics';
import type { StudyControlsProps } from './types';
import { getControlKeyLabels } from './utils';
import './style.scss';

export function StudyControls({
  onRetry,
  onFlip,
  onMaster,
  onUndo,
  canUndo,
  isStarred,
  onToggleStar,
  disabled = false,
}: StudyControlsProps) {
  const keys = getControlKeyLabels();
  const { hapticTick, hapticSuccess, hapticWarning, hapticSelection } = useHaptics();

  const handleUndo = () => {
    hapticTick();
    onUndo();
  };

  const handleRetry = () => {
    hapticWarning();
    onRetry();
  };

  const handleFlip = () => {
    hapticTick();
    onFlip();
  };

  const handleMaster = () => {
    hapticSuccess();
    onMaster();
  };

  const handleStar = () => {
    hapticSelection();
    onToggleStar();
  };

  return (
    <div className="study-controls" role="toolbar" aria-label="Flashcard study controls">
      {/* Undo Button */}
      <button
        type="button"
        className="study-controls__icon-btn"
        onClick={handleUndo}
        disabled={!canUndo || disabled}
        title={`Undo last action (${keys.undo})`}
        aria-label="Undo last card action"
      >
        <Undo2 size={18} />
      </button>

      {/* Main Action Triad: Retry - Flip - Master */}
      <div className="study-controls__group">
        <button
          type="button"
          className="study-controls__btn study-controls__btn--retry"
          onClick={handleRetry}
          disabled={disabled}
          title={`Needs Practice (${keys.retry})`}
          aria-label="Needs practice - swipe left"
        >
          <X size={18} />
          <span>Needs Practice</span>
          <span className="study-controls__key-badge">{keys.retry}</span>
        </button>

        <button
          type="button"
          className="study-controls__btn study-controls__btn--flip"
          onClick={handleFlip}
          disabled={disabled}
          title={`Flip card (${keys.flip})`}
          aria-label="Flip card to other side"
        >
          <RotateCw size={17} />
          <span>Flip</span>
          <span className="study-controls__key-badge">{keys.flip}</span>
        </button>

        <button
          type="button"
          className="study-controls__btn study-controls__btn--master"
          onClick={handleMaster}
          disabled={disabled}
          title={`Mastered (${keys.master})`}
          aria-label="Mastered - swipe right"
        >
          <Check size={18} />
          <span>Mastered</span>
          <span className="study-controls__key-badge">{keys.master}</span>
        </button>
      </div>

      {/* Star Button */}
      <button
        type="button"
        className={`study-controls__icon-btn ${
          isStarred ? 'study-controls__icon-btn--starred' : ''
        }`}
        onClick={handleStar}
        disabled={disabled}
        title={isStarred ? 'Remove star' : 'Star this card'}
        aria-label={isStarred ? 'Unstar flashcard' : 'Star flashcard'}
      >
        <Star size={18} fill={isStarred ? 'currentColor' : 'none'} />
      </button>
    </div>
  );
}

export type { StudyControlsProps } from './types';
