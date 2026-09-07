/**
 * Computes CSS class names for the Input wrapper and control.
 */
export function getInputClassNames({
  hasError = false,
  isDisabled = false,
  fullWidth = false,
  className = '',
}: {
  hasError?: boolean;
  isDisabled?: boolean;
  fullWidth?: boolean;
  className?: string;
}): { wrapperClass: string; inputClass: string } {
  const wrapperClass = [
    'input-group',
    fullWidth ? 'input-group--full-width' : '',
    isDisabled ? 'input-group--disabled' : '',
    hasError ? 'input-group--error' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const inputClass = ['input-control', hasError ? 'input-control--error' : ''].filter(Boolean).join(' ');

  return { wrapperClass, inputClass };
}
