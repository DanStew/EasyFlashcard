import type { ReactNode } from 'react';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: ModalSize;
  closeOnBackdropClick?: boolean;
  closeOnEsc?: boolean;
  className?: string;
}
