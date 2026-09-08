import {
  Check,
  RotateCw,
  Star,
  Undo2,
  X,
} from 'lucide-react';
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

  return (
    <div className="study-controls" role="toolbar" aria-label="Flashcard study controls">
      {/* Undo Button */}
      <button
        type="button"
        className="study-controls__icon-btn"
        onClick={onUndo}
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
          onClick={onRetry}
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
          onClick={onFlip}
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
          onClick={onMaster}
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
        onClick={onToggleStar}
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
