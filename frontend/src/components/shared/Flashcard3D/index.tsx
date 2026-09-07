import { useState, type KeyboardEvent, type MouseEvent } from 'react';
import { Edit2, FileText, RotateCw, Trash2 } from 'lucide-react';
import type { Flashcard3DProps } from './types';
import { getFlashcard3DClassNames } from './utils';
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
}: Flashcard3DProps) {
  const [internalFlipped, setInternalFlipped] = useState(false);

  const isFlipped = controlledFlipped !== undefined ? controlledFlipped : internalFlipped;

  const handleCardClick = () => {
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

  const rootClassName = getFlashcard3DClassNames({
    isFlipped,
    size,
    className,
  });

  return (
    <div
      className={rootClassName}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Flashcard: ${card.front.text}. Click to flip.`}
    >
      <div className="flashcard-3d__inner">
        {/* FRONT FACE */}
        <div className="flashcard-3d__face flashcard-3d__face--front">
          <div className="flashcard-3d__header">
            <span className="flashcard-3d__type-badge">Term</span>
            {showActions && (
              <div className="flashcard-3d__actions">
                {onEdit && (
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
                {onDelete && (
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
            )}
          </div>

          <div className="flashcard-3d__content">
            <p className="flashcard-3d__text">{card.front.text}</p>
          </div>

          <div className="flashcard-3d__footer">
            {card.sourceReference ? (
              <span className="flashcard-3d__reference">
                <FileText size={12} />
                {card.sourceReference.documentName} (p. {card.sourceReference.pageNumber})
              </span>
            ) : <span />}

            <span className="flashcard-3d__hint">
              <RotateCw size={12} />
              Flip
            </span>
          </div>
        </div>

        {/* BACK FACE */}
        <div className="flashcard-3d__face flashcard-3d__face--back">
          <div className="flashcard-3d__header">
            <span className="flashcard-3d__type-badge">Definition</span>
            {showActions && (
              <div className="flashcard-3d__actions">
                {onEdit && (
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
                {onDelete && (
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
            )}
          </div>

          <div className="flashcard-3d__content">
            <p className="flashcard-3d__text flashcard-3d__text--back">{card.back.text}</p>
          </div>

          <div className="flashcard-3d__footer">
            {card.sourceReference ? (
              <span className="flashcard-3d__reference">
                <FileText size={12} />
                {card.sourceReference.documentName} (p. {card.sourceReference.pageNumber})
              </span>
            ) : <span />}

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

export type { Flashcard3DProps, FlashcardSize } from './types';
