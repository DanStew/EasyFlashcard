import type { ButtonSize, ButtonVariant } from './types';

/**
 * Computes CSS class names for the Button component based on variants, sizes, and states.
 */
export function getButtonClassName({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  disabled = false,
  isComingSoon = false,
  className = '',
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  isLoading?: boolean;
  disabled?: boolean;
  isComingSoon?: boolean;
  className?: string;
}): string {
  const classes = [
    'btn',
    `btn--${variant}`,
    `btn--${size}`,
    fullWidth ? 'btn--full-width' : '',
    isLoading ? 'btn--loading' : '',
    disabled || isComingSoon ? 'btn--disabled' : '',
    isComingSoon ? 'btn--coming-soon' : '',
    className,
  ];

  return classes.filter(Boolean).join(' ');
}
