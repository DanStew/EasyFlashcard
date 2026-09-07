import { useRef, useState } from 'react';
import { useClickOutside } from '@/hooks/useClickOutside';
import type { DropdownItem, DropdownProps } from './types';
import { getDropdownItemClassName, getDropdownMenuClassNames } from './utils';
import './style.scss';

export function Dropdown({ trigger, items, align = 'right', className }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useClickOutside(containerRef, () => setIsOpen(false), isOpen);

  const menuClassName = getDropdownMenuClassNames({ isOpen, align, className });

  const handleItemClick = (item: DropdownItem) => {
    if (item.disabled || item.isComingSoon) return;
    setIsOpen(false);
    item.onClick();
  };

  return (
    <div ref={containerRef} className="dropdown-container">
      <div
        className="dropdown-trigger"
        onClick={() => setIsOpen((prev) => !prev)}
        role="button"
        tabIndex={0}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {trigger}
      </div>

      <div className={menuClassName} role="menu">
        {items.map((item) => {
          const itemClassName = getDropdownItemClassName(item);
          return (
            <button
              key={item.id}
              type="button"
              className={itemClassName}
              onClick={() => handleItemClick(item)}
              role="menuitem"
              disabled={item.disabled || item.isComingSoon}
            >
              {item.icon && <span className="dropdown-item__icon">{item.icon}</span>}
              <span>{item.label}</span>
              {item.isComingSoon && <span className="dropdown-item__soon-tag">Soon</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export type { DropdownItem, DropdownProps } from './types';
