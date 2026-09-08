import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import type { SwipeState } from './types';
import {
  calculateRotation,
  calculateStampOpacity,
  DEFAULT_THRESHOLD,
  determineDirection,
} from './utils';

interface UseCardSwipeOptions {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onTap?: () => void;
  threshold?: number;
  disabled?: boolean;
}

export function useCardSwipe({
  onSwipeLeft,
  onSwipeRight,
  onTap,
  threshold = DEFAULT_THRESHOLD,
  disabled = false,
}: UseCardSwipeOptions) {
  const [swipeState, setSwipeState] = useState<SwipeState>({
    offsetX: 0,
    offsetY: 0,
    rotation: 0,
    isDragging: false,
    direction: null,
    stampOpacity: 0,
    isExiting: false,
    exitDirection: null,
  });

  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const isPointerDownRef = useRef(false);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (exitTimerRef.current) {
        clearTimeout(exitTimerRef.current);
      }
    };
  }, []);

  const handlePointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (disabled || swipeState.isExiting) return;
      // Only handle primary button
      if (e.button !== 0) return;

      dragStartRef.current = { x: e.clientX, y: e.clientY };
      isPointerDownRef.current = true;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

      setSwipeState((prev) => ({
        ...prev,
        isDragging: true,
      }));
    },
    [disabled, swipeState.isExiting]
  );

  const handlePointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!isPointerDownRef.current || !dragStartRef.current || disabled) return;

      const dx = e.clientX - dragStartRef.current.x;
      const dy = (e.clientY - dragStartRef.current.y) * 0.25; // damp vertical movement
      const rot = calculateRotation(dx);
      const dir = determineDirection(dx);
      const stampOp = calculateStampOpacity(dx, threshold);

      setSwipeState((prev) => ({
        ...prev,
        offsetX: dx,
        offsetY: dy,
        rotation: rot,
        direction: dir,
        stampOpacity: stampOp,
      }));
    },
    [disabled, threshold]
  );

  const finishDrag = useCallback(
    (e?: ReactPointerEvent<HTMLDivElement>) => {
      if (!isPointerDownRef.current) return;
      isPointerDownRef.current = false;

      if (e && e.currentTarget) {
        try {
          (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
        } catch {
          // ignore
        }
      }

      const { offsetX, offsetY } = swipeState;
      const totalDist = Math.hypot(offsetX, offsetY);

      // If barely moved, consider it a tap/flip
      if (totalDist < 6) {
        setSwipeState((prev) => ({
          ...prev,
          offsetX: 0,
          offsetY: 0,
          rotation: 0,
          isDragging: false,
          direction: null,
          stampOpacity: 0,
        }));
        if (onTap) {
          onTap();
        }
        return;
      }

      // Check if threshold exceeded
      if (offsetX > threshold) {
        // Mastered swipe right
        setSwipeState((prev) => ({
          ...prev,
          isDragging: false,
          isExiting: true,
          exitDirection: 'right',
          offsetX: 500,
          rotation: 20,
          stampOpacity: 1,
        }));

        exitTimerRef.current = setTimeout(() => {
          onSwipeRight();
          setSwipeState({
            offsetX: 0,
            offsetY: 0,
            rotation: 0,
            isDragging: false,
            direction: null,
            stampOpacity: 0,
            isExiting: false,
            exitDirection: null,
          });
        }, 260);
      } else if (offsetX < -threshold) {
        // Retry swipe left
        setSwipeState((prev) => ({
          ...prev,
          isDragging: false,
          isExiting: true,
          exitDirection: 'left',
          offsetX: -500,
          rotation: -20,
          stampOpacity: 1,
        }));

        exitTimerRef.current = setTimeout(() => {
          onSwipeLeft();
          setSwipeState({
            offsetX: 0,
            offsetY: 0,
            rotation: 0,
            isDragging: false,
            direction: null,
            stampOpacity: 0,
            isExiting: false,
            exitDirection: null,
          });
        }, 260);
      } else {
        // Spring snap back to center
        setSwipeState((prev) => ({
          ...prev,
          offsetX: 0,
          offsetY: 0,
          rotation: 0,
          isDragging: false,
          direction: null,
          stampOpacity: 0,
        }));
      }
    },
    [onSwipeLeft, onSwipeRight, onTap, swipeState, threshold]
  );

  const triggerSwipe = useCallback(
    (direction: 'left' | 'right') => {
      if (swipeState.isExiting) return;

      const isRight = direction === 'right';
      setSwipeState({
        offsetX: isRight ? 500 : -500,
        offsetY: 0,
        rotation: isRight ? 20 : -20,
        isDragging: false,
        direction,
        stampOpacity: 1,
        isExiting: true,
        exitDirection: direction,
      });

      exitTimerRef.current = setTimeout(() => {
        if (isRight) {
          onSwipeRight();
        } else {
          onSwipeLeft();
        }
        setSwipeState({
          offsetX: 0,
          offsetY: 0,
          rotation: 0,
          isDragging: false,
          direction: null,
          stampOpacity: 0,
          isExiting: false,
          exitDirection: null,
        });
      }, 260);
    },
    [onSwipeLeft, onSwipeRight, swipeState.isExiting]
  );

  return {
    swipeState,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp: finishDrag,
    handlePointerCancel: finishDrag,
    triggerSwipe,
  };
}
