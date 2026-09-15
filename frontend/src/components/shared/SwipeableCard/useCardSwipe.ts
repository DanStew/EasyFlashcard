import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { useHaptics } from '@/hooks/useHaptics';
import type { SwipeState } from './types';
import {
  calculateRotation,
  calculateStampOpacity,
  determineDirection,
} from './utils';

interface UseCardSwipeOptions {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onTap?: () => void;
  threshold?: number;
  disabled?: boolean;
}

export function useCardSwipe({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onTap,
  threshold,
  disabled = false,
}: UseCardSwipeOptions) {
  const { hapticTick, hapticThreshold, hapticSuccess, hapticWarning } = useHaptics();

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
  const cardWidthRef = useRef<number>(360);
  const hasTriggeredThresholdHapticRef = useRef(false);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTapTimeRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      if (exitTimerRef.current) {
        clearTimeout(exitTimerRef.current);
      }
    };
  }, []);

  const getEffectiveThreshold = useCallback(() => {
    if (threshold && threshold > 0) return threshold;
    // Calculate dynamic threshold based on card width (28% of width, min 70px, max 140px)
    return Math.min(140, Math.max(70, cardWidthRef.current * 0.28));
  }, [threshold]);

  const handlePointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (disabled || swipeState.isExiting) return;
      if (e.button !== 0) return;

      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      cardWidthRef.current = rect.width || 360;
      hasTriggeredThresholdHapticRef.current = false;

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
      const rawDy = e.clientY - dragStartRef.current.y;
      const dy = rawDy * 0.4; // smooth vertical damping
      const rot = calculateRotation(dx);
      const dir = determineDirection(dx);
      const effectiveThreshold = getEffectiveThreshold();
      const stampOp = calculateStampOpacity(dx, effectiveThreshold);

      // Check if crossing threshold for haptic tick
      const isPastThreshold = Math.abs(dx) >= effectiveThreshold;
      if (isPastThreshold && !hasTriggeredThresholdHapticRef.current) {
        hapticThreshold();
        hasTriggeredThresholdHapticRef.current = true;
      } else if (!isPastThreshold && hasTriggeredThresholdHapticRef.current) {
        hasTriggeredThresholdHapticRef.current = false;
      }

      setSwipeState((prev) => ({
        ...prev,
        offsetX: dx,
        offsetY: dy,
        rotation: rot,
        direction: dir,
        stampOpacity: stampOp,
      }));
    },
    [disabled, getEffectiveThreshold, hapticThreshold]
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
      const effectiveThreshold = getEffectiveThreshold();

      // Tap / Flip handling with debounce
      if (totalDist < 10) {
        const now = Date.now();
        if (now - lastTapTimeRef.current > 280) {
          lastTapTimeRef.current = now;
          hapticTick();
          if (onTap) {
            onTap();
          }
        }
        setSwipeState((prev) => ({
          ...prev,
          offsetX: 0,
          offsetY: 0,
          rotation: 0,
          isDragging: false,
          direction: null,
          stampOpacity: 0,
        }));
        return;
      }

      // Vertical swipe detection (swipe up = flip, swipe down = star)
      if (Math.abs(offsetY) > 55 && Math.abs(offsetY) > Math.abs(offsetX) * 1.4) {
        if (offsetY < 0) {
          // Swiped Up -> Flip card
          hapticTick();
          if (onSwipeUp) {
            onSwipeUp();
          } else if (onTap) {
            onTap();
          }
        } else {
          // Swiped Down -> Star or secondary action
          if (onSwipeDown) {
            hapticTick();
            onSwipeDown();
          }
        }

        // Reset card state
        setSwipeState((prev) => ({
          ...prev,
          offsetX: 0,
          offsetY: 0,
          rotation: 0,
          isDragging: false,
          direction: null,
          stampOpacity: 0,
        }));
        return;
      }

      // Horizontal swipe threshold exceeded
      if (offsetX > effectiveThreshold) {
        // Mastered swipe right
        hapticSuccess();
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
      } else if (offsetX < -effectiveThreshold) {
        // Retry swipe left
        hapticWarning();
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
    [
      getEffectiveThreshold,
      hapticSuccess,
      hapticTick,
      hapticWarning,
      onSwipeDown,
      onSwipeLeft,
      onSwipeRight,
      onSwipeUp,
      onTap,
      swipeState,
    ]
  );

  const triggerSwipe = useCallback(
    (direction: 'left' | 'right') => {
      if (swipeState.isExiting) return;

      const isRight = direction === 'right';
      if (isRight) {
        hapticSuccess();
      } else {
        hapticWarning();
      }

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
    [hapticSuccess, hapticWarning, onSwipeLeft, onSwipeRight, swipeState.isExiting]
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
