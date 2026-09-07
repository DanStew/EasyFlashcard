import { forwardRef, useEffect, useRef, type ChangeEvent } from 'react';
import type { TextAreaProps } from './types';
import { autoResizeTextarea, getTextAreaClassNames, syncRefs } from './utils';
import './style.scss';

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = false,
      disabled = false,
      autoResize = true,
      maxHeight,
      id,
      className,
      rows = 3,
      value,
      defaultValue,
      onChange,
      ...rest
    },
    ref
  ) => {
    const innerRef = useRef<HTMLTextAreaElement | null>(null);
    const inputId = id || (label ? `textarea-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    const { wrapperClass, controlClass } = getTextAreaClassNames({
      hasError: Boolean(error),
      isDisabled: disabled,
      fullWidth,
      autoResize,
      className,
    });

    useEffect(() => {
      if (autoResize && innerRef.current) {
        autoResizeTextarea(innerRef.current, maxHeight);
      }
    }, [value, defaultValue, autoResize, maxHeight]);

    const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
      if (autoResize) {
        autoResizeTextarea(e.target, maxHeight);
      }
      onChange?.(e);
    };

    return (
      <div className={wrapperClass}>
        {label && (
          <label htmlFor={inputId} className="textarea-group__label">
            {label}
          </label>
        )}

        <div className="textarea-group__container">
          <textarea
            ref={(node) => syncRefs(node, innerRef, ref)}
            id={inputId}
            rows={rows}
            disabled={disabled}
            className={controlClass}
            aria-invalid={Boolean(error)}
            value={value}
            defaultValue={defaultValue}
            onChange={handleChange}
            {...rest}
          />
        </div>

        {error && <div className="textarea-group__error">{error}</div>}
        {!error && helperText && <div className="textarea-group__helper">{helperText}</div>}
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';

export type { TextAreaProps } from './types';
