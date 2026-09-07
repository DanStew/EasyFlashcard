import { useEffect } from 'react';

/**
 * Custom hook to handle Escape key press and scroll locking when modal is open.
 */
export function useModalEsc(isOpen: boolean, onClose: () => void, enabled = true): void {
  useEffect(() => {
    if (!isOpen || !enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, enabled]);
}
