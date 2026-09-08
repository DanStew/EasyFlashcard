import {
  forwardRef,
  useImperativeHandle,
  type CSSProperties,
} from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import type { SwipeableCardProps } from './types';
import { useCardSwipe } from './useCardSwipe';
import { DEFAULT_THRESHOLD, getSwipeableCardClassNames } from './utils';
import './style.scss';

export interface SwipeableCardHandle {
  triggerSwipe: (direction: 'left' | 'right') => void;
}

export const SwipeableCard = forwardRef<SwipeableCardHandle, SwipeableCardProps>(
  function SwipeableCard(
    {
      children,
      onSwipeLeft,
      onSwipeRight,
      onTap,
      threshold = DEFAULT_THRESHOLD,
      disabled = false,
      className,
      retryLabel = 'RETRY',
      masterLabel = 'MASTERED',
    },
    ref
  ) {
    const {
      swipeState,
      handlePointerDown,
      handlePointerMove,
      handlePointerUp,
      handlePointerCancel,
      triggerSwipe,
    } = useCardSwipe({
      onSwipeLeft,
      onSwipeRight,
      onTap,
      threshold,
      disabled,
    });

    useImperativeHandle(ref, () => ({
      triggerSwipe,
    }));

    const rootClassName = getSwipeableCardClassNames({
      isDragging: swipeState.isDragging,
      isExiting: swipeState.isExiting,
      exitDirection: swipeState.exitDirection,
      className,
    });

    const dynamicVars = {
      '--swipe-x': `${swipeState.offsetX}px`,
      '--swipe-y': `${swipeState.offsetY}px`,
      '--swipe-rot': `${swipeState.rotation}deg`,
      '--stamp-opacity': swipeState.stampOpacity.toString(),
    } as CSSProperties;

    return (
      <div
        className={rootClassName}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        <div className="swipeable-card__inner" style={dynamicVars}>
          {/* Retry Stamp (shown when dragging left) */}
          {swipeState.direction === 'left' && (
            <div className="swipeable-card__stamp swipeable-card__stamp--retry" aria-hidden="true">
              <XCircle size={22} />
              <span>{retryLabel}</span>
            </div>
          )}

          {/* Mastered Stamp (shown when dragging right) */}
          {swipeState.direction === 'right' && (
            <div className="swipeable-card__stamp swipeable-card__stamp--mastered" aria-hidden="true">
              <CheckCircle2 size={22} />
              <span>{masterLabel}</span>
            </div>
          )}

          {children}
        </div>
      </div>
    );
  }
);

export type { SwipeableCardProps, SwipeDirection, SwipeState } from './types';
