import type { MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
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
  closeOnBackdropClick = true,
  closeOnEsc = true,
  className,
}: ModalProps) {
  useModalEsc(isOpen, onClose, closeOnEsc);

  if (!isOpen) return null;

  const { overlayClass, dialogClass } = getModalClassNames({ size, className });

  const handleBackdropClick = (e: MouseEvent<HTMLDivElement>) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  const modalElement = (
    <div className={overlayClass} onClick={handleBackdropClick} role="dialog" aria-modal="true">
      <div className={dialogClass}>
        {title && (
          <div className="modal-dialog__header">
            <div className="modal-dialog__header-titles">
              <h3 className="modal-dialog__header-title">{title}</h3>
              {subtitle && <p className="modal-dialog__header-subtitle">{subtitle}</p>}
            </div>
            <button
              type="button"
              className="modal-dialog__header-close"
              onClick={onClose}
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

export type { ModalProps, ModalSize } from './types';
