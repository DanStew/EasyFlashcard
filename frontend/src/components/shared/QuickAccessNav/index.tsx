// ==========================================
// EasyFlashcard - QuickAccessNav Component
// ==========================================

import { Link, useLocation } from 'react-router-dom';
import { Folder as FolderIcon, Layers as SetIcon } from 'lucide-react';
import type { QuickAccessNavProps } from './types';
import { getQuickAccessItemHref, isQuickAccessItemActive } from './utils';
import './style.scss';

/**
 * Renders the Quick Access navigation list in the sidebar,
 * displaying high-frecency sets and folders with clean icons and titles.
 */
export function QuickAccessNav({
  items,
  onSelectItem,
  className = '',
}: QuickAccessNavProps) {
  const location = useLocation();

  if (items.length === 0) {
    return (
      <div className={`quick-access-nav ${className}`.trim()}>
        <div className="quick-access-nav__empty">
          No recently studied sets or folders yet
        </div>
      </div>
    );
  }

  return (
    <nav
      className={`quick-access-nav ${className}`.trim()}
      aria-label="Quick Access"
    >
      <ul className="quick-access-nav__list">
        {items.map((item) => {
          const href = getQuickAccessItemHref(item);
          const isActive = isQuickAccessItemActive(item, location.pathname);

          return (
            <li key={`${item.type}-${item.id}`}>
              <Link
                to={href}
                className={`quick-access-nav__item ${
                  isActive ? 'quick-access-nav__item--active' : ''
                }`}
                onClick={() => onSelectItem?.(item)}
                title={item.name}
              >
                <span className="quick-access-nav__icon">
                  {item.type === 'folder' ? (
                    <FolderIcon size={16} />
                  ) : (
                    <SetIcon size={16} />
                  )}
                </span>
                <span className="quick-access-nav__label">{item.name}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
