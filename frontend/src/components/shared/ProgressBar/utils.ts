import type { ProgressBarProps, ProgressSegment } from './types';

/**
 * Calculates clamped percentage (0 to 100) based on value and max
 */
export function calculatePercentage(value: number, max: number): number {
  if (max <= 0) return 0;
  const raw = (value / max) * 100;
  return Math.min(100, Math.max(0, Math.round(raw * 10) / 10));
}

/**
 * Normalizes segments into percentages totaling at most 100%
 */
export function calculateSegmentPercentages(
  segments: ProgressSegment[],
  max: number
): Array<{ id: string; percentage: number; colorVar?: string; label?: string }> {
  if (max <= 0 || !segments.length) return [];

  let accumulated = 0;
  return segments.map((seg) => {
    const rawPct = (seg.value / max) * 100;
    const clampedPct = Math.min(100 - accumulated, Math.max(0, rawPct));
    accumulated += clampedPct;
    return {
      id: seg.id,
      percentage: Math.round(clampedPct * 10) / 10,
      colorVar: seg.colorVar,
      label: seg.label,
    };
  });
}

/**
 * Generates BEM class names for the ProgressBar container
 */
export function getProgressBarClassNames({
  size = 'md',
  variant = 'default',
  className,
}: Pick<ProgressBarProps, 'size' | 'variant' | 'className'>): string {
  const classes = ['progress-bar', `progress-bar--${size}`, `progress-bar--${variant}`];
  if (className) {
    classes.push(className);
  }
  return classes.join(' ');
}
