import type { EmptyStateProps } from './types';
import { getEmptyStateClassName } from './utils';
import './style.scss';

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  const rootClassName = getEmptyStateClassName(className);

  return (
    <div className={rootClassName}>
      {icon && <div className="empty-state__icon">{icon}</div>}
      <h4 className="empty-state__title">{title}</h4>
      {description && <p className="empty-state__description">{description}</p>}
      {action && <div className="empty-state__action">{action}</div>}
    </div>
  );
}

export type { EmptyStateProps } from './types';
