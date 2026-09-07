import { AlertCircle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import type { ToastItem, ToastType } from '@/context/ToastContext';
import { getToastItemClassName } from './utils';
import './style.scss';

function getToastIcon(type: ToastType) {
  switch (type) {
    case 'success':
      return <CheckCircle2 size={18} />;
    case 'error':
      return <XCircle size={18} />;
    case 'warning':
      return <AlertCircle size={18} />;
    case 'info':
    default:
      return <Info size={18} />;
  }
}

interface ToastCardProps {
  toast: ToastItem;
  onClose: (id: string) => void;
}

function ToastCard({ toast, onClose }: ToastCardProps) {
  const itemClassName = getToastItemClassName(toast.type);

  return (
    <div className={itemClassName} role="alert">
      <span className="toast-item__icon">{getToastIcon(toast.type)}</span>
      <div className="toast-item__content">
        {toast.title && <h5 className="toast-item__title">{toast.title}</h5>}
        <p className="toast-item__message">{toast.message}</p>
      </div>
      <button
        type="button"
        className="toast-item__close"
        onClick={() => onClose(toast.id)}
        aria-label="Dismiss notification"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onClose={removeToast} />
      ))}
    </div>
  );
}
