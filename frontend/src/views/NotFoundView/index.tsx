import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileQuestion, FolderX, HelpCircle, Plus } from 'lucide-react';
import { Button } from '@/components/shared/Button';
import type { NotFoundViewProps } from './types';
import { getNotFoundConfig } from './utils';
import './style.scss';

export function NotFoundView({
  entityType = 'page',
  title,
  description,
  customBackUrl,
  customBackLabel,
}: NotFoundViewProps) {
  const navigate = useNavigate();
  const config = getNotFoundConfig(entityType);

  const displayTitle = title || config.defaultTitle;
  const displayDescription = description || config.defaultDescription;
  const primaryHref = customBackUrl || config.primaryActionHref;
  const primaryLabel = customBackLabel || config.primaryActionText;

  const renderIcon = () => {
    switch (entityType) {
      case 'set':
        return <FileQuestion size={40} />;
      case 'folder':
        return <FolderX size={40} />;
      case 'page':
      default:
        return <HelpCircle size={40} />;
    }
  };

  return (
    <div className="not-found-view animate-fade-in">
      <div className="not-found-view__card">
        <div className="not-found-view__badge-wrapper">
          <span className="not-found-view__badge">Error {config.code}</span>
        </div>

        <div className="not-found-view__icon-container">
          {renderIcon()}
        </div>

        <h1 className="not-found-view__title">{displayTitle}</h1>
        <p className="not-found-view__description">{displayDescription}</p>

        <div className="not-found-view__actions">
          <Button
            variant="secondary"
            size="lg"
            leftIcon={<ArrowLeft size={18} />}
            onClick={() => navigate(primaryHref)}
          >
            {primaryLabel}
          </Button>

          {config.secondaryActionHref && config.secondaryActionText && (
            <Button
              variant="gradient"
              size="lg"
              leftIcon={<Plus size={18} />}
              onClick={() => navigate(config.secondaryActionHref!)}
            >
              {config.secondaryActionText}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export type { NotFoundViewProps, NotFoundEntityType } from './types';
