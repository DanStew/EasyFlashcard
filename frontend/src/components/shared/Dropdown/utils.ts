import type { DropdownItem } from './types';

/**
 * Computes menu alignment and state classes.
 */
export function getDropdownMenuClassNames({
  isOpen,
  align = 'right',
  className = '',
}: {
  isOpen: boolean;
  align?: 'left' | 'right';
  className?: string;
}): string {
  return [
    'dropdown-menu',
    `dropdown-menu--align-${align}`,
    isOpen ? 'dropdown-menu--open animate-fade-in' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
}

/**
 * Computes item class name.
 */
export function getDropdownItemClassName(item: DropdownItem): string {
  return [
    'dropdown-item',
    item.variant === 'danger' ? 'dropdown-item--danger' : '',
    item.disabled || item.isComingSoon ? 'dropdown-item--disabled' : '',
  ]
    .filter(Boolean)
    .join(' ');
}
