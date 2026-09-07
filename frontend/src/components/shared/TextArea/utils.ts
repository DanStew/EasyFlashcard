import type { ForwardedRef, MutableRefObject } from 'react';

/**
 * Computes CSS class names for TextArea wrapper and control.
 */
export function getTextAreaClassNames({
  hasError = false,
  isDisabled = false,
  fullWidth = false,
  autoResize = true,
  className = '',
}: {
  hasError?: boolean;
  isDisabled?: boolean;
  fullWidth?: boolean;
  autoResize?: boolean;
  className?: string;
}): { wrapperClass: string; controlClass: string } {
  const wrapperClass = [
    'textarea-group',
    fullWidth ? 'textarea-group--full-width' : '',
    isDisabled ? 'textarea-group--disabled' : '',
    hasError ? 'textarea-group--error' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const controlClass = [
    'textarea-control',
    autoResize ? 'textarea-control--auto-resize' : '',
    hasError ? 'textarea-control--error' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return { wrapperClass, controlClass };
}

/**
 * Automatically adjusts the height of a textarea element to fit its content,
 * respecting an optional maximum height ceiling.
 */
export function autoResizeTextarea(
  element: HTMLTextAreaElement | null,
  maxHeight?: number
): void {
  if (!element) return;

  // Modern browsers supporting CSS field-sizing handle resizing natively in layout
  if (typeof CSS !== 'undefined' && CSS.supports && CSS.supports('field-sizing', 'content')) {
    return;
  }

  // Graceful JS fallback for browsers without field-sizing support
  element.style.height = 'auto';
  const targetHeight = maxHeight
    ? Math.min(element.scrollHeight, maxHeight)
    : element.scrollHeight;

  element.style.height = `${targetHeight}px`;
}

/**
 * Assigns a DOM element reference to both an internal React ref and an optional forwarded ref.
 */
export function syncRefs<T>(
  node: T | null,
  innerRef: MutableRefObject<T | null>,
  forwardedRef?: ForwardedRef<T> | null
): void {
  innerRef.current = node;
  if (!forwardedRef) return;

  if (typeof forwardedRef === 'function') {
    forwardedRef(node);
  } else {
    forwardedRef.current = node;
  }
}
