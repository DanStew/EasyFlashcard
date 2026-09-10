// ==========================================
// DriveFileCard - Presentation Component
// ==========================================

import type { MouseEvent } from 'react';
import {
  ExternalLink,
  Eye,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Layers,
  MoreVertical,
  MoveRight,
  Presentation,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { Dropdown } from '@/components/shared/Dropdown';
import type { DropdownItem } from '@/components/shared/Dropdown/types';
import {
  formatFileSize,
  formatItemDate,
  getFileTypeMetadata,
} from '@/utils/documentFormatters';
import type { DriveFileCardProps } from './types';
import { getDriveFileCardClass } from './utils';
import './style.scss';

export function DriveFileCard({
  document,
  viewMode = 'grid',
  onClick,
  onGenerateFlashcards,
  onOpenInDrive,
  onMove,
  onTrash,
  className,
}: DriveFileCardProps) {
  const rootClassName = getDriveFileCardClass(viewMode, className);
  const fileMeta = getFileTypeMetadata(document.mimeType, document.name);

  const menuItems: DropdownItem[] = [
    {
      id: 'preview',
      label: 'Preview Document',
      icon: <Eye size={14} />,
      onClick: onClick,
    },
  ];

  if (onGenerateFlashcards) {
    menuItems.push({
      id: 'generate',
      label: 'Generate Flashcards',
      icon: <Sparkles size={14} />,
      onClick: onGenerateFlashcards,
    });
  }

  if (document.webViewLink || onOpenInDrive) {
    menuItems.push({
      id: 'drive-link',
      label: 'Open in Google Drive',
      icon: <ExternalLink size={14} />,
      onClick: () => {
        if (onOpenInDrive) {
          onOpenInDrive();
        } else if (document.webViewLink) {
          window.open(document.webViewLink, '_blank', 'noopener,noreferrer');
        }
      },
    });
  }

  if (onMove) {
    menuItems.push({
      id: 'move',
      label: 'Move file',
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

  const renderIcon = (size = 22) => {
    switch (fileMeta.category) {
      case 'pdf':
        return <FileText size={size} />;
      case 'doc':
        return <FileText size={size} />;
      case 'slide':
        return <Presentation size={size} />;
      case 'sheet':
        return <FileSpreadsheet size={size} />;
      case 'image':
        return <ImageIcon size={size} />;
      default:
        return <FileText size={size} />;
    }
  };

  const handleCardClick = (e: MouseEvent) => {
    if (
      (e.target as HTMLElement).closest('.dropdown') ||
      (e.target as HTMLElement).closest('.drive-file-card__footer') ||
      (e.target as HTMLElement).closest('.drive-file-card__list-actions')
    ) {
      return;
    }
    onClick();
  };

  const hasLinkedSets = document.linkedSetIds && document.linkedSetIds.length > 0;

  if (viewMode === 'list') {
    return (
      <div
        className={rootClassName}
        onClick={handleCardClick}
        role="button"
        tabIndex={0}
        title={document.name}
      >
        <div className="drive-file-card__left">
          <div
            className={`drive-file-card__list-icon drive-file-card__icon drive-file-card__icon--${fileMeta.category}`}
          >
            {renderIcon(18)}
          </div>
          <div className="drive-file-card__info">
            <span className="drive-file-card__name">{document.name}</span>
            <div className="drive-file-card__meta-row">
              <span>{fileMeta.badgeLabel}</span>
              <span>•</span>
              <span>{formatFileSize(document.sizeBytes)}</span>
              <span>•</span>
              <span>{formatItemDate(document.createdAt)}</span>
            </div>
          </div>
        </div>

        {hasLinkedSets && (
          <span className="drive-file-card__sets-pill">
            <Layers size={12} />
            {document.linkedSetIds.length} {document.linkedSetIds.length === 1 ? 'Set' : 'Sets'}
          </span>
        )}

        <div
          className="drive-file-card__list-actions"
          onClick={(e) => e.stopPropagation()}
        >
          {onGenerateFlashcards && (
            <button
              type="button"
              className="drive-file-card__generate-btn"
              onClick={onGenerateFlashcards}
              title="Generate Flashcards with AI"
            >
              <Sparkles size={12} />
              <span>Generate</span>
            </button>
          )}

          <Dropdown
            align="right"
            trigger={
              <button
                type="button"
                className="drive-file-card__menu-btn"
                aria-label="File options"
              >
                <MoreVertical size={15} />
              </button>
            }
            items={menuItems}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={rootClassName}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      title={document.name}
    >
      {/* Top Preview Stage */}
      <div className="drive-file-card__preview-stage">
        <span className="drive-file-card__type-badge">{fileMeta.badgeLabel}</span>
        <div
          className={`drive-file-card__preview-icon-box drive-file-card__icon drive-file-card__icon--${fileMeta.category}`}
        >
          {renderIcon(26)}
        </div>
      </div>

      {/* Middle Content */}
      <div className="drive-file-card__content">
        <span className="drive-file-card__name">{document.name}</span>
        <div className="drive-file-card__meta-row">
          <span>{formatFileSize(document.sizeBytes)}</span>
          <span>•</span>
          <span>{formatItemDate(document.createdAt)}</span>
        </div>
      </div>

      {/* Card Footer */}
      <div
        className="drive-file-card__footer"
        onClick={(e) => e.stopPropagation()}
      >
        {hasLinkedSets ? (
          <span className="drive-file-card__sets-pill">
            <Layers size={11} />
            {document.linkedSetIds.length} {document.linkedSetIds.length === 1 ? 'Set' : 'Sets'}
          </span>
        ) : (
          <span className="drive-file-card__ready-text">Ready for AI</span>
        )}

        <div className="drive-file-card__actions-group">
          {onGenerateFlashcards && (
            <button
              type="button"
              className="drive-file-card__generate-btn"
              onClick={onGenerateFlashcards}
              title="Generate Flashcards with AI"
            >
              <Sparkles size={12} />
              <span>Generate</span>
            </button>
          )}

          <Dropdown
            align="right"
            trigger={
              <button
                type="button"
                className="drive-file-card__menu-btn"
                aria-label="File options"
              >
                <MoreVertical size={15} />
              </button>
            }
            items={menuItems}
          />
        </div>
      </div>
    </div>
  );
}

export type { DriveFileCardProps } from './types';
