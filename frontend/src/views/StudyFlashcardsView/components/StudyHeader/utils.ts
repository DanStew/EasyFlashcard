import type { CardOrientation } from '../../types';

export function getOrientationLabel(orientation: CardOrientation): string {
  return orientation === 'term-first' ? 'Term Front' : 'Definition Front';
}

export function getHeaderClassNames(isFocusMode: boolean): string {
  const classes = ['study-header'];
  if (isFocusMode) classes.push('study-header--focus');
  return classes.join(' ');
}

export function formatProgressBadge(currentIndex?: number, totalCards?: number): string | null {
  if (totalCards === undefined || totalCards === 0) return null;
  const current = Math.min(totalCards, (currentIndex ?? 0) + 1);
  return `Card ${current} of ${totalCards}`;
}
