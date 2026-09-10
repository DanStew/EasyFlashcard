// ==========================================
// DriveFolderCard - Presentation Component
// ==========================================

import type { MouseEvent } from 'react';
import { Folder, MoreVertical, MoveRight, Trash2 } from 'lucide-react';
import { Dropdown } from '@/components/shared/Dropdown';
import type { DropdownItem } from '@/components/shared/Dropdown/types';
import type { DriveFolderCardProps } from './types';
import { getDriveFolderCardClass } from './utils';
import './style.scss';

export function DriveFolderCard({
  folder,
  viewMode = 'grid',
  onClick,
  onMove,
  onTrash,
  className,
}: DriveFolderCardProps) {
  const rootClassName = getDriveFolderCardClass(viewMode, className);

  const menuItems: DropdownItem[] = [];

  if (onMove) {
    menuItems.push({
      id: 'move',
      label: 'Move folder',
      icon: <MoveRight size={14} />,
      onClick: onMove,
    });
  }

  if (onTrash) {
    menuItems.push({
      id: 'trash',
      label: 'Move to Trash',
      icon: <Trash2 size={14} />,
      variant: 'danger',
      onClick: onTrash,
    });
  }

  const handleCardClick = (e: MouseEvent) => {
    if (
      (e.target as HTMLElement).closest('.dropdown') ||
      (e.target as HTMLElement).closest('.drive-folder-card__actions')
    ) {
      return;
    }
    onClick();
  };

  return (
    <div
      className={rootClassName}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      title={folder.name}
    >
      <div className="drive-folder-card__left">
        <div className="drive-folder-card__icon-box">
          <Folder size={18} />
        </div>
        <div className="drive-folder-card__info">
          <span className="drive-folder-card__name">{folder.name}</span>
          <span className="drive-folder-card__meta">Google Drive Folder</span>
        </div>
      </div>

      {menuItems.length > 0 && (
        <div
          className="drive-folder-card__actions"
          onClick={(e) => e.stopPropagation()}
        >
          <Dropdown
            align="right"
            trigger={
              <button
                type="button"
                className="drive-folder-card__menu-btn"
                aria-label="Folder options"
              >
                <MoreVertical size={15} />
              </button>
            }
            items={menuItems}
          />
        </div>
      )}
    </div>
  );
}

export type { DriveFolderCardProps } from './types';
