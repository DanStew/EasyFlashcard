import { forwardRef } from 'react';
import type { CardProps } from './types';
import { getCardClassNames } from './utils';
import './style.scss';

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      variant = 'default',
      padding = 'md',
      header,
      footer,
      hoverable = false,
      className,
      ...rest
    },
    ref
  ) => {
    const computedClassName = getCardClassNames({
      variant,
      padding,
      hoverable,
      className,
    });

    return (
      <div ref={ref} className={computedClassName} {...rest}>
        {header && <div className="card-surface__header">{header}</div>}
        <div className="card-surface__body">{children}</div>
        {footer && <div className="card-surface__footer">{footer}</div>}
      </div>
    );
  }
);

Card.displayName = 'Card';

export type { CardProps, CardVariant } from './types';
