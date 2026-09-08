import type { ReactNode } from 'react';

export type SwipeDirection = 'left' | 'right' | null;

export interface SwipeableCardProps {
  children: ReactNode;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onTap?: () => void;
  threshold?: number;
  disabled?: boolean;
  className?: string;
  retryLabel?: string;
  masterLabel?: string;
}

export interface SwipeState {
  offsetX: number;
  offsetY: number;
  rotation: number;
  isDragging: boolean;
  direction: SwipeDirection;
  stampOpacity: number;
  isExiting: boolean;
  exitDirection: SwipeDirection;
}
