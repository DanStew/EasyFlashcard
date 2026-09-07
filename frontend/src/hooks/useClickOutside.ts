import { useEffect, type RefObject } from 'react';

/**
 * Hook that detects clicks or touch events outside the specified ref element and triggers a handler.
 * Also handles the Escape key to dismiss modals/dropdowns.
 *
 * @param ref - React RefObject to the target element
 * @param handler - Callback function invoked when a click outside or Escape occurs
 * @param isActive - Whether the listener is currently active (defaults to true)
 */
export function useClickOutside<T extends HTMLElement>(
  ref: RefObject<T | null>,
  handler: () => void,
  isActive = true
): void {
  useEffect(() => {
    if (!isActive) return;

    const handleClick = (event: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        handler();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handler();
      }
    };

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('touchstart', handleClick);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('touchstart', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [ref, handler, isActive]);
}
