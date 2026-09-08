import type { FlashcardSize } from './types';

/**
 * Checks if the user is currently selecting text on the page.
 * Prevents accidental card flip triggers while highlighting notes or formulas.
 */
export function hasActiveTextSelection(): boolean {
  if (typeof window === 'undefined') return false;
  const selection = window.getSelection();
  return Boolean(selection && selection.toString().trim().length > 0);
}

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

