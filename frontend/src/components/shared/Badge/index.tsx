import type { BadgeProps } from './types';
import { getBadgeClassNames } from './utils';
import './style.scss';

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  pill = true,
  icon,
  className,
  ...rest
}: BadgeProps) {
  const computedClassName = getBadgeClassNames({
    variant,
    size,
    pill,
    className,
  });

  return (
    <span className={computedClassName} {...rest}>
      {icon && <span className="badge__icon">{icon}</span>}
      <span>{children}</span>
    </span>
  );
}

export type { BadgeProps, BadgeSize, BadgeVariant } from './types';
