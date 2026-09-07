import type { SkeletonProps } from './types';
import { getSkeletonClassName } from './utils';
import './style.scss';

export function Skeleton({
  variant = 'text',
  count = 1,
  className,
  ...rest
}: SkeletonProps) {
  const rootClassName = getSkeletonClassName(variant, className);

  if (count > 1) {
    return (
      <div className="skeleton-group">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className={rootClassName} aria-hidden="true" {...rest} />
        ))}
      </div>
    );
  }

  return <div className={rootClassName} aria-hidden="true" {...rest} />;
}

export type { SkeletonProps, SkeletonVariant } from './types';
