import type { SwipeDirection, SwipeState } from './types';

export const DEFAULT_THRESHOLD = 90;
export const MAX_ROTATION_DEG = 12;

/**
 * Calculates rotation degrees for a given horizontal drag offset
 */
export function calculateRotation(offsetX: number): number {
  const rotation = (offsetX / 250) * MAX_ROTATION_DEG;
  return Math.max(-MAX_ROTATION_DEG, Math.min(MAX_ROTATION_DEG, rotation));
}

/**
 * Calculates stamp badge opacity (0 to 1) based on drag offset towards threshold
 */
export function calculateStampOpacity(offsetX: number, threshold: number = DEFAULT_THRESHOLD): number {
  const distance = Math.abs(offsetX);
  if (distance < 15) return 0;
  return Math.min(1, Math.max(0, (distance - 15) / (threshold - 15)));
}

/**
 * Determines swipe direction based on offset and minimum deadzone
 */
export function determineDirection(offsetX: number): SwipeDirection {
  if (offsetX > 15) return 'right';
  if (offsetX < -15) return 'left';
  return null;
}

/**
 * Generates class names for SwipeableCard
 */
export function getSwipeableCardClassNames({
  isDragging,
  isExiting,
  exitDirection,
  className,
}: Pick<SwipeState, 'isDragging' | 'isExiting' | 'exitDirection'> & { className?: string }): string {
  const classes = ['swipeable-card'];
  if (isDragging) classes.push('swipeable-card--dragging');
  if (isExiting && exitDirection) {
    classes.push(`swipeable-card--exiting-${exitDirection}`);
  }
  if (className) classes.push(className);
  return classes.join(' ');
}
