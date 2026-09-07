import type { FlashcardSize } from './types';

/**
 * Computes root class name for Flashcard3D component.
 */
export function getFlashcard3DClassNames({
  isFlipped = false,
  size = 'md',
  className = '',
}: {
  isFlipped?: boolean;
  size?: FlashcardSize;
  className?: string;
}): string {
  return [
    'flashcard-3d',
    `flashcard-3d--${size}`,
    isFlipped ? 'flashcard-3d--flipped' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
}
