import type { LoadingSpinnerProps } from './types';
import { getLoadingSpinnerClassNames } from './utils';
import './style.scss';

export function LoadingSpinner({
  size = 'md',
  color = 'primary',
  label,
  className,
}: LoadingSpinnerProps) {
  const rootClassName = getLoadingSpinnerClassNames({ size, color, className });

  return (
    <div className={rootClassName} role="status" aria-live="polite">
      <div className="loading-spinner__circle" />
      {label && <span className="loading-spinner__label">{label}</span>}
      <span className="sr-only">Loading</span>
    </div>
  );
}

export type { LoadingSpinnerProps, SpinnerSize } from './types';
