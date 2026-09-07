import { forwardRef } from 'react';
import type { InputProps } from './types';
import { getInputClassNames } from './utils';
import './style.scss';

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled = false,
      id,
      className,
      ...rest
    },
    ref
  ) => {
    const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
    const { wrapperClass, inputClass } = getInputClassNames({
      hasError: Boolean(error),
      isDisabled: disabled,
      fullWidth,
      className,
    });

    return (
      <div className={wrapperClass}>
        {label && (
          <label htmlFor={inputId} className="input-group__label">
            {label}
          </label>
        )}

        <div className="input-group__container">
          {leftIcon && <div className="input-group__icon input-group__icon--left">{leftIcon}</div>}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={inputClass}
            aria-invalid={Boolean(error)}
            {...rest}
          />

          {rightIcon && <div className="input-group__icon input-group__icon--right">{rightIcon}</div>}
        </div>

        {error && <div className="input-group__error">{error}</div>}
        {!error && helperText && <div className="input-group__helper">{helperText}</div>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export type { InputProps } from './types';
