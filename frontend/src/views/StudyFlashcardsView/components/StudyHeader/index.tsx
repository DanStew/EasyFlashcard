import {
  ArrowLeft,
  ArrowLeftRight,
  HelpCircle,
  Maximize2,
  Minimize2,
  RotateCcw,
  Shuffle,
} from 'lucide-react';
import { Button } from '@/components/shared/Button';
import type { StudyHeaderProps } from './types';
import {
  formatProgressBadge,
  getHeaderClassNames,
  getOrientationLabel,
} from './utils';
import './style.scss';

export function StudyHeader({
  setName,
  subtitle,
  onBack,
  orientation,
  onToggleOrientation,
  isShuffled,
  onToggleShuffle,
  onReset,
  onOpenShortcuts,
  isFocusMode,
  onToggleFocusMode,
  disabled = false,
  currentIndex,
  totalCards,
}: StudyHeaderProps) {
  const rootClassName = getHeaderClassNames(isFocusMode);
  const orientationLabel = getOrientationLabel(orientation);

  // Minimal floating header in Focus Mode
  if (isFocusMode) {
    const progressText = formatProgressBadge(currentIndex, totalCards);
    return (
      <header className={rootClassName}>
        <div className="study-header__left">
          <div className="study-header__info">
            <h1 className="study-header__title study-header__title--focus" title={setName}>
              {setName || 'Flashcard Deck'}
            </h1>
          </div>
          {progressText && (
            <span className="study-header__progress-badge">{progressText}</span>
          )}
        </div>

        <div className="study-header__actions">
          {/* Orientation Toggle */}
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<ArrowLeftRight size={13} />}
            onClick={onToggleOrientation}
            disabled={disabled}
            title="Toggle Front face (Term first or Definition first)"
            aria-label={`Current card face: ${orientationLabel}. Click to switch.`}
          >
            <span className="study-header__btn-text">{orientationLabel}</span>
          </Button>

          {/* Shuffle Toggle */}
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Shuffle size={13} />}
            onClick={onToggleShuffle}
            disabled={disabled}
            className={isShuffled ? 'study-header__btn-active' : ''}
            title={isShuffled ? 'Shuffle is ON (Click to restore order)' : 'Shuffle deck order'}
            aria-label={isShuffled ? 'Disable shuffle' : 'Enable shuffle'}
          >
            <span className="study-header__btn-text">Shuffle {isShuffled ? 'On' : ''}</span>
          </Button>

          {/* Shortcuts Guide */}
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<HelpCircle size={14} />}
            onClick={onOpenShortcuts}
            title="View keyboard shortcuts (?)"
            aria-label="Keyboard shortcuts"
          >
            <span className="study-header__btn-text">Shortcuts</span>
          </Button>

          {/* Exit Focus Mode button */}
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Minimize2 size={14} />}
            onClick={onToggleFocusMode}
            className="study-header__exit-focus-btn"
            title="Exit Focus Mode (Esc)"
            aria-label="Exit Focus Mode"
          >
            <span>Exit Focus</span>
            <kbd className="study-header__kbd">Esc</kbd>
          </Button>
        </div>
      </header>
    );
  }

  // Standard study header
  return (
    <header className={rootClassName}>
      <div className="study-header__left">
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<ArrowLeft size={16} />}
          onClick={onBack}
          aria-label="Back to flashcard set"
        >
          Exit Study
        </Button>

        <div className="study-header__divider" />

        <div className="study-header__info">
          <h1 className="study-header__title" title={setName}>{setName || 'Flashcard Deck'}</h1>
          <span className="study-header__subtitle" title={subtitle}>{subtitle || 'Study Session'}</span>
        </div>
      </div>

      <div className="study-header__actions">
        {/* Orientation Toggle */}
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<ArrowLeftRight size={14} />}
          onClick={onToggleOrientation}
          disabled={disabled}
          title="Toggle Front face (Term first or Definition first)"
          aria-label={`Current card face: ${orientationLabel}. Click to switch.`}
        >
          {orientationLabel}
        </Button>

        {/* Shuffle Toggle */}
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<Shuffle size={14} />}
          onClick={onToggleShuffle}
          disabled={disabled}
          className={isShuffled ? 'study-header__btn-active' : ''}
          title={isShuffled ? 'Shuffle is ON (Click to restore order)' : 'Shuffle deck order'}
          aria-label={isShuffled ? 'Disable shuffle' : 'Enable shuffle'}
        >
          Shuffle {isShuffled ? 'On' : ''}
        </Button>

        <div className="study-header__actions-divider" />

        {/* Reset Session */}
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<RotateCcw size={14} />}
          onClick={onReset}
          disabled={disabled}
          title="Reset study session to beginning"
          aria-label="Reset study session"
        >
          <span className="study-header__btn-text">Reset</span>
        </Button>

        {/* Shortcuts Guide */}
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<HelpCircle size={14} />}
          onClick={onOpenShortcuts}
          title="View keyboard shortcuts (?)"
          aria-label="Keyboard shortcuts"
        >
          <span className="study-header__btn-text">Shortcuts</span>
        </Button>

        {/* Focus Mode */}
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<Maximize2 size={14} />}
          onClick={onToggleFocusMode}
          className="study-header__focus-btn"
          title="Distraction-free focus mode (F)"
          aria-label="Enter distraction-free focus mode"
        >
          Focus
        </Button>
      </div>
    </header>
  );
}

export type { StudyHeaderProps } from './types';
