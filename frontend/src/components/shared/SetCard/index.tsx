import type { MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { Edit, Folder as FolderIcon, MoreVertical, Play, Trash2 } from 'lucide-react';
import { Badge } from '@/components/shared/Badge';
import { Button } from '@/components/shared/Button';
import { Dropdown } from '@/components/shared/Dropdown';
import type { DropdownItem } from '@/components/shared/Dropdown/types';
import type { SetCardProps } from './types';
import { formatSetDate, getSetCardClassName } from './utils';
import './style.scss';

export function SetCard({
  set,
  onView,
  onStudy,
  onEdit,
  onDelete,
  viewMode = 'grid',
  className,
}: SetCardProps) {
  const rootClassName = getSetCardClassName(viewMode, className);
  const formattedDate = formatSetDate(set.updatedAt);

  const menuItems: DropdownItem[] = [];

  if (onEdit) {
    menuItems.push({
      id: 'edit',
      label: 'Edit Set',
      icon: <Edit size={14} />,
      onClick: () => onEdit(set),
    });
  }

  if (onDelete) {
    menuItems.push({
      id: 'delete',
      label: 'Delete Set',
      icon: <Trash2 size={14} />,
      variant: 'danger',
      onClick: () => onDelete(set),
    });
  }

  const handleCardClick = (e: MouseEvent) => {
    if (
      (e.target as HTMLElement).closest('.dropdown') ||
      (e.target as HTMLElement).closest('button') ||
      (e.target as HTMLElement).closest('a')
    ) {
      return;
    }
    if (onView) {
      onView(set);
    }
  };

  if (viewMode === 'list') {
    return (
      <div className={rootClassName} onClick={handleCardClick} role="button" tabIndex={0}>
        <div className="set-card__list-info">
          <Badge variant="primary" size="sm">
            {set.cardCount} {set.cardCount === 1 ? 'card' : 'cards'}
          </Badge>

          <Link to={`/set/${set.id}`} className="set-card__title" title={set.name}>
            {set.name}
          </Link>
        </div>

        {set.tags && set.tags.length > 0 && (
          <div className="set-card__tags">
            {set.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="subtle" size="sm">
                #{tag}
              </Badge>
            ))}
          </div>
        )}

        <span className="set-card__date">{formattedDate}</span>

        <div className="set-card__actions" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Play size={13} />}
            onClick={() => onStudy ? onStudy(set) : undefined}
            title="Study this set"
          >
            Study
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => onView ? onView(set) : undefined}
          >
            View
          </Button>

          {menuItems.length > 0 && (
            <Dropdown
              align="right"
              trigger={
                <button type="button" className="set-card__menu-btn" aria-label="Set options">
                  <MoreVertical size={15} />
                </button>
              }
              items={menuItems}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={rootClassName} onClick={handleCardClick} role="button" tabIndex={0}>
      <div>
        <div className="set-card__header">
          <div className="set-card__badges">
            <Badge variant="primary" size="sm">
              {set.cardCount} {set.cardCount === 1 ? 'card' : 'cards'}
            </Badge>
            {set.folderId && (
              <Badge variant="default" size="sm" icon={<FolderIcon size={11} />}>
                Folder
              </Badge>
            )}
          </div>

          {menuItems.length > 0 && (
            <div onClick={(e) => e.stopPropagation()}>
              <Dropdown
                align="right"
                trigger={
                  <button type="button" className="set-card__menu-btn" aria-label="Set options">
                    <MoreVertical size={16} />
                  </button>
                }
                items={menuItems}
              />
            </div>
          )}
        </div>

        <Link to={`/set/${set.id}`} className="set-card__title" title={set.name}>
          {set.name}
        </Link>

        <p className="set-card__desc">
          {set.description || 'No description provided for this flashcard set.'}
        </p>

        {set.tags && set.tags.length > 0 && (
          <div className="set-card__tags">
            {set.tags.map((tag) => (
              <Badge key={tag} variant="subtle" size="sm">
                #{tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="set-card__footer">
        <span className="set-card__date">Updated {formattedDate}</span>

        <div className="set-card__actions" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="subtle"
            size="sm"
            leftIcon={<Play size={13} />}
            onClick={() => onStudy ? onStudy(set) : undefined}
            title="Study this set"
          >
            Study
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => onView ? onView(set) : undefined}
          >
            View
          </Button>
        </div>
      </div>
    </div>
  );
}

export type { SetCardProps } from './types';
