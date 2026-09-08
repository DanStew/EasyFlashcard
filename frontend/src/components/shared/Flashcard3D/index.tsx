import { useState, type KeyboardEvent, type MouseEvent } from 'react';
import { Edit2, FileText, RotateCw, Star, Trash2 } from 'lucide-react';
import { RichContent } from '@/components/shared/RichContent';
import type { Flashcard3DProps } from './types';
import { getFlashcard3DClassNames, hasActiveTextSelection } from './utils';
import './style.scss';

export function Flashcard3D({
  card,
  isFlipped: controlledFlipped,
  onFlip,
  onEdit,
  onDelete,
  size = 'md',
  showActions = true,
  className,
  orientation = 'term-first',
  isStarred = false,
  onToggleStar,
  originSetName,
}: Flashcard3DProps) {
  const [internalFlipped, setInternalFlipped] = useState(false);

  const isFlipped = controlledFlipped !== undefined ? controlledFlipped : internalFlipped;

  const handleCardClick = () => {
    // Prevent accidental flip when user is highlighting text to read or copy
    if (hasActiveTextSelection()) {
      return;
    }

    if (onFlip) {
      onFlip();
    } else {
      setInternalFlipped((prev) => !prev);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleCardClick();
    }
  };

  const handleEditClick = (e: MouseEvent) => {
    e.stopPropagation();
    if (onEdit) onEdit(card);
  };

  const handleDeleteClick = (e: MouseEvent) => {
    e.stopPropagation();
    if (onDelete) onDelete(card.id);
  };

  const handleStarClick = (e: MouseEvent) => {
    e.stopPropagation();
    if (onToggleStar) onToggleStar(card.id);
  };

  const rootClassName = getFlashcard3DClassNames({
    isFlipped,
    size,
    className,
  });

  const isTermFirst = orientation === 'term-first';
  const frontBadge = isTermFirst ? 'Term' : 'Definition';
  const frontText = isTermFirst ? card.front.text : card.back.text;
  const backBadge = isTermFirst ? 'Definition' : 'Term';
  const backText = isTermFirst ? card.back.text : card.front.text;

  return (
    <div
      className={rootClassName}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Flashcard: ${frontText}. Click to flip.`}
    >
      <div className="flashcard-3d__inner">
        {/* FRONT FACE */}
        <div className="flashcard-3d__face flashcard-3d__face--front">
          <div className="flashcard-3d__header">
            <div className="flashcard-3d__badge-group">
              <span className="flashcard-3d__type-badge">{frontBadge}</span>
              {originSetName && (
                <span className="flashcard-3d__origin-badge" title={`Set: ${originSetName}`}>
                  {originSetName}
                </span>
              )}
            </div>
            <div className="flashcard-3d__actions">
              {onToggleStar && (
                <button
                  type="button"
                  className={`flashcard-3d__action-btn flashcard-3d__action-btn--star ${
                    isStarred ? 'flashcard-3d__action-btn--starred' : ''
                  }`}
                  onClick={handleStarClick}
                  title={isStarred ? 'Unstar card' : 'Star card'}
                  aria-label={isStarred ? 'Unstar card' : 'Star card'}
                >
                  <Star size={15} fill={isStarred ? 'currentColor' : 'none'} />
                </button>
              )}
              {showActions && onEdit && (
                <button
                  type="button"
                  className="flashcard-3d__action-btn"
                  onClick={handleEditClick}
                  title="Edit card"
                  aria-label="Edit card"
                >
                  <Edit2 size={14} />
                </button>
              )}
              {showActions && onDelete && (
                <button
                  type="button"
                  className="flashcard-3d__action-btn flashcard-3d__action-btn--delete"
                  onClick={handleDeleteClick}
                  title="Delete card"
                  aria-label="Delete card"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="flashcard-3d__content">
            <RichContent content={frontText} size={size} face="front" />
          </div>

          <div className="flashcard-3d__footer">
            {card.sourceReference ? (
              <span className="flashcard-3d__reference">
                <FileText size={12} />
                {card.sourceReference.documentName} (p. {card.sourceReference.pageNumber})
              </span>
            ) : (
              <span />
            )}

            <span className="flashcard-3d__hint">
              <RotateCw size={12} />
              Flip
            </span>
          </div>
        </div>

        {/* BACK FACE */}
        <div className="flashcard-3d__face flashcard-3d__face--back">
          <div className="flashcard-3d__header">
            <div className="flashcard-3d__badge-group">
              <span className="flashcard-3d__type-badge">{backBadge}</span>
              {originSetName && (
                <span className="flashcard-3d__origin-badge" title={`Set: ${originSetName}`}>
                  {originSetName}
                </span>
              )}
            </div>
            <div className="flashcard-3d__actions">
              {onToggleStar && (
                <button
                  type="button"
                  className={`flashcard-3d__action-btn flashcard-3d__action-btn--star ${
                    isStarred ? 'flashcard-3d__action-btn--starred' : ''
                  }`}
                  onClick={handleStarClick}
                  title={isStarred ? 'Unstar card' : 'Star card'}
                  aria-label={isStarred ? 'Unstar card' : 'Star card'}
                >
                  <Star size={15} fill={isStarred ? 'currentColor' : 'none'} />
                </button>
              )}
              {showActions && onEdit && (
                <button
                  type="button"
                  className="flashcard-3d__action-btn"
                  onClick={handleEditClick}
                  title="Edit card"
                  aria-label="Edit card"
                >
                  <Edit2 size={14} />
                </button>
              )}
              {showActions && onDelete && (
                <button
                  type="button"
                  className="flashcard-3d__action-btn flashcard-3d__action-btn--delete"
                  onClick={handleDeleteClick}
                  title="Delete card"
                  aria-label="Delete card"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="flashcard-3d__content">
            <RichContent content={backText} size={size} face="back" />
          </div>

          <div className="flashcard-3d__footer">
            {card.sourceReference ? (
              <span className="flashcard-3d__reference">
                <FileText size={12} />
                {card.sourceReference.documentName} (p. {card.sourceReference.pageNumber})
              </span>
            ) : (
              <span />
            )}

            <span className="flashcard-3d__hint">
              <RotateCw size={12} />
              Flip back
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export type { CardOrientation, Flashcard3DProps, FlashcardSize } from './types';
