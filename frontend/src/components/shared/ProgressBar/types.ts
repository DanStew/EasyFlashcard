export type ProgressBarSize = 'sm' | 'md' | 'lg';
export type ProgressBarVariant = 'default' | 'success' | 'gradient';

export interface ProgressSegment {
  id: string;
  value: number;
  colorVar?: string;
  label?: string;
}

export interface ProgressBarProps {
  value?: number;
  max?: number;
  segments?: ProgressSegment[];
  size?: ProgressBarSize;
  variant?: ProgressBarVariant;
  showLabel?: boolean;
  label?: string;
  className?: string;
  ariaLabel?: string;
}
