import type { CSSProperties } from 'react';
import type { ProgressBarProps } from './types';
import {
  calculatePercentage,
  calculateSegmentPercentages,
  getProgressBarClassNames,
} from './utils';
import './style.scss';

export function ProgressBar({
  value = 0,
  max = 100,
  segments,
  size = 'md',
  variant = 'default',
  showLabel = false,
  label,
  className,
  ariaLabel = 'Progress',
}: ProgressBarProps) {
  const percentage = calculatePercentage(value, max);
  const rootClassName = getProgressBarClassNames({ size, variant, className });

  const hasSegments = Boolean(segments && segments.length > 0);
  const normalizedSegments = hasSegments ? calculateSegmentPercentages(segments!, max) : [];

  return (
    <div
      className={rootClassName}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={ariaLabel}
    >
      {(showLabel || label) && (
        <div className="progress-bar__header">
          <span>{label || 'Progress'}</span>
          <span>{percentage}%</span>
        </div>
      )}

      <div className="progress-bar__track">
        {hasSegments ? (
          normalizedSegments.map((seg) => (
            <div
              key={seg.id}
              className="progress-bar__segment"
              style={
                {
                  width: `${seg.percentage}%`,
                  backgroundColor: seg.colorVar ? `var(${seg.colorVar})` : undefined,
                } as CSSProperties
              }
              title={seg.label ? `${seg.label}: ${seg.percentage}%` : undefined}
            />
          ))
        ) : (
          <div
            className={`progress-bar__fill progress-bar__fill--${variant}`}
            style={{ width: `${percentage}%` } as CSSProperties}
          />
        )}
      </div>
    </div>
  );
}

export type { ProgressBarProps, ProgressBarSize, ProgressBarVariant, ProgressSegment } from './types';
