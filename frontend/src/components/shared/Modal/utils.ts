import type { ModalSize } from './types';

/**
 * Computes modal container and dialog class names.
 */
export function getModalClassNames({
  size = 'md',
  className = '',
}: {
  size?: ModalSize;
  className?: string;
}): { overlayClass: string; dialogClass: string } {
  const overlayClass = 'modal-overlay';
  const dialogClass = ['modal-dialog', `modal-dialog--${size}`, className].filter(Boolean).join(' ');

  return { overlayClass, dialogClass };
}
