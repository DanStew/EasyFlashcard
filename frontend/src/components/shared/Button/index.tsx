import { forwardRef } from 'react';
import type { ButtonProps } from './types';
import { getButtonClassName } from './utils';
import './style.scss';

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled = false,
      isComingSoon = false,
      tooltip,
      className,
      ...rest
    },
    ref
  ) => {
    const computedClassName = getButtonClassName({
      variant,
      size,
      fullWidth,
      isLoading,
      disabled,
      isComingSoon,
      className,
    });

    const isActionDisabled = disabled || isLoading || isComingSoon;

    return (
      <button
        ref={ref}
        type={rest.type || 'button'}
        disabled={isActionDisabled}
        className={computedClassName}
        title={tooltip || (isComingSoon ? 'Coming Soon in future update' : undefined)}
        aria-busy={isLoading}
        {...rest}
      >
        {isLoading ? (
          <span className="btn__spinner" aria-hidden="true" />
        ) : (
          leftIcon && <span className="btn__icon btn__icon--left">{leftIcon}</span>
        )}

        <span className="btn__content">{children}</span>

        {!isLoading && rightIcon && (
          <span className="btn__icon btn__icon--right">{rightIcon}</span>
        )}

        {isComingSoon && <span className="btn__coming-soon-tag">Soon</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

export type { ButtonProps, ButtonSize, ButtonVariant } from './types';
