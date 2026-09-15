import type { ModalSize, ModalVariant } from './types';

/**
 * Computes modal container and dialog class names.
 */
export function getModalClassNames({
  size = 'md',
  variant = 'auto',
  className = '',
}: {
  size?: ModalSize;
  variant?: ModalVariant;
  className?: string;
}): { overlayClass: string; dialogClass: string } {
  const overlayClass = [
    'modal-overlay',
    variant === 'sheet' ? 'modal-overlay--sheet' : '',
    variant === 'dialog' ? 'modal-overlay--dialog' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const dialogClass = [
    'modal-dialog',
    `modal-dialog--${size}`,
    variant === 'sheet' ? 'modal-dialog--sheet' : '',
    variant === 'dialog' ? 'modal-dialog--dialog' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return { overlayClass, dialogClass };
}
