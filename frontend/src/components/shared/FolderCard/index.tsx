import type { MouseEvent } from 'react';
import { Edit2, Folder as FolderIcon, FolderPlus, MoreVertical, Trash2 } from 'lucide-react';
import { Dropdown } from '@/components/shared/Dropdown';
import type { DropdownItem } from '@/components/shared/Dropdown/types';
import type { FolderCardProps } from './types';
import { formatFolderItemCount, getFolderCardClassName } from './utils';
import './style.scss';

export function FolderCard({
  folder,
  subfolderCount,
  setCount,
  previewItems,
  onClick,
  onRename,
  onDelete,
  onCreateSubfolder,
  viewMode = 'grid',
  className,
}: FolderCardProps) {
  const rootClassName = getFolderCardClassName(viewMode, className);
  const effectiveSubfolderCount = subfolderCount ?? folder.subfolderCount;
  const effectiveSetCount = setCount ?? folder.setCount;
  const effectivePreviewItems = previewItems ?? folder.previewItems ?? [];
  const itemCountText = formatFolderItemCount(effectiveSetCount, effectiveSubfolderCount);

  const menuItems: DropdownItem[] = [];

  if (onCreateSubfolder) {
    menuItems.push({
      id: 'create-subfolder',
      label: 'New Subfolder',
      icon: <FolderPlus size={14} />,
      onClick: () => onCreateSubfolder(folder),
    });
  }

  if (onRename) {
    menuItems.push({
      id: 'rename',
      label: 'Rename',
      icon: <Edit2 size={14} />,
      onClick: () => onRename(folder),
    });
  }

  if (onDelete) {
    menuItems.push({
      id: 'delete',
      label: 'Delete',
      icon: <Trash2 size={14} />,
      variant: 'danger',
      onClick: () => onDelete(folder),
    });
  }

  const handleCardClick = (e: MouseEvent) => {
    // If the click originated inside a dropdown or button, ignore
    if ((e.target as HTMLElement).closest('.dropdown') || (e.target as HTMLElement).closest('.folder-card__actions')) {
      return;
    }
    if (onClick) {
      onClick();
    }
  };

  if (viewMode === 'list') {
    return (
      <div className={rootClassName} onClick={handleCardClick} role="button" tabIndex={0}>
        <div className="folder-card__left">
          <div className="folder-card__icon-box">
            <FolderIcon size={16} />
          </div>
          <div className="folder-card__info">
            <span className="folder-card__name" title={folder.name}>
              {folder.name}
            </span>
            {effectivePreviewItems.length > 0 && (
              <span className="folder-card__preview-inline" title={effectivePreviewItems.join(', ')}>
                Includes: {effectivePreviewItems.slice(0, 2).join(' · ')}
              </span>
            )}
          </div>
        </div>

        <span className="folder-card__count">{itemCountText}</span>

        {menuItems.length > 0 && (
          <div className="folder-card__actions" onClick={(e) => e.stopPropagation()}>
            <Dropdown
              align="right"
              trigger={
                <button type="button" className="folder-card__menu-btn" aria-label="Folder options">
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

  return (
    <div className={rootClassName} onClick={handleCardClick} role="button" tabIndex={0}>
      <div className="folder-card__header">
        <div className="folder-card__icon-box">
          <FolderIcon size={20} />
        </div>

        {menuItems.length > 0 && (
          <div className="folder-card__actions" onClick={(e) => e.stopPropagation()}>
            <Dropdown
              align="right"
              trigger={
                <button type="button" className="folder-card__menu-btn" aria-label="Folder options">
                  <MoreVertical size={16} />
                </button>
              }
              items={menuItems}
            />
          </div>
        )}
      </div>

      <div className="folder-card__body">
        <span className="folder-card__name" title={folder.name}>
          {folder.name}
        </span>
        <span className="folder-card__count">{itemCountText}</span>
        {effectivePreviewItems.length > 0 && (
          <div className="folder-card__preview">
            {effectivePreviewItems.slice(0, 3).map((item, idx) => (
              <span key={idx} className="folder-card__preview-chip" title={item}>
                {item}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export type { FolderCardProps } from './types';
