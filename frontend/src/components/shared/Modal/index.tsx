import { useRef, useState, type MouseEvent, type TouchEvent } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useHaptics } from '@/hooks/useHaptics';
import type { ModalProps } from './types';
import { useModalEsc } from './useModalEsc';
import { getModalClassNames } from './utils';
import './style.scss';

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md',
  variant = 'auto',
  dragToDismiss = true,
  closeOnBackdropClick = true,
  closeOnEsc = true,
  className,
}: ModalProps) {
  useModalEsc(isOpen, onClose, closeOnEsc);
  const { hapticTick } = useHaptics();

  const touchStartYRef = useRef<number | null>(null);
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  if (!isOpen) return null;

  const { overlayClass, dialogClass } = getModalClassNames({ size, variant, className });

  const handleBackdropClick = (e: MouseEvent<HTMLDivElement>) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      hapticTick();
      onClose();
    }
  };

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    if (!dragToDismiss) return;
    touchStartYRef.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (!touchStartYRef.current || !dragToDismiss) return;
    const dy = e.touches[0].clientY - touchStartYRef.current;
    if (dy > 0) {
      // Only drag downwards
      setDragOffsetY(dy);
    }
  };

  const handleTouchEnd = () => {
    if (!dragToDismiss) return;
    touchStartYRef.current = null;
    setIsDragging(false);

    if (dragOffsetY > 120) {
      hapticTick();
      onClose();
    }
    setDragOffsetY(0);
  };

  const dialogStyle = dragOffsetY > 0 ? { transform: `translateY(${dragOffsetY}px)`, transition: isDragging ? 'none' : 'transform 200ms ease' } : undefined;

  const modalElement = (
    <div className={overlayClass} onClick={handleBackdropClick} role="dialog" aria-modal="true">
      <div className={dialogClass} style={dialogStyle}>
        {/* Mobile Bottom Sheet Pull-Down Drag Handle */}
        <div
          className="modal-dialog__drag-handle-area"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="modal-dialog__drag-handle" />
        </div>

        {title && (
          <div
            className="modal-dialog__header"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="modal-dialog__header-titles">
              <h3 className="modal-dialog__header-title">{title}</h3>
              {subtitle && <p className="modal-dialog__header-subtitle">{subtitle}</p>}
            </div>
            <button
              type="button"
              className="modal-dialog__header-close"
              onClick={() => {
                hapticTick();
                onClose();
              }}
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>
          </div>
        )}

        <div className="modal-dialog__body">{children}</div>

        {footer && <div className="modal-dialog__footer">{footer}</div>}
      </div>
    </div>
  );

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(modalElement, document.body);
}

export type { ModalProps, ModalSize, ModalVariant } from './types';
