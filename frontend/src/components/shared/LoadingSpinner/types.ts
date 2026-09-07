export type SpinnerSize = 'sm' | 'md' | 'lg';

export interface LoadingSpinnerProps {
  size?: SpinnerSize;
  color?: 'primary' | 'white' | 'current';
  label?: string;
  className?: string;
}
