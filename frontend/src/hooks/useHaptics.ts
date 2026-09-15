// ==============================================================================
// EasyFlashcard - Tactile Haptics Hook for Mobile Devices
// ==============================================================================

import { useCallback } from 'react';

export type HapticType = 'tick' | 'threshold' | 'success' | 'warning' | 'selection';

/**
 * Provides tactile haptic vibration patterns for mobile web and Capacitor apps.
 * Gracefully degrades on desktop or devices without vibration hardware.
 */
export function useHaptics() {
  const triggerHaptic = useCallback((type: HapticType = 'tick') => {
    if (typeof window === 'undefined' || !('navigator' in window) || !navigator.vibrate) {
      return;
    }

    try {
      switch (type) {
        case 'tick':
          // Subtle 8ms tick for button taps, flips, and navigation clicks
          navigator.vibrate(8);
          break;
        case 'threshold':
          // 22ms medium pulse when crossing card swipe threshold
          navigator.vibrate(22);
          break;
        case 'selection':
          // 12ms crisp pulse for selecting items or toggling stars
          navigator.vibrate(12);
          break;
        case 'success':
          // Light double-tap pulse (15ms pulse, 30ms gap, 15ms pulse) for mastering or saving
          navigator.vibrate([15, 30, 15]);
          break;
        case 'warning':
          // Damped 35ms pulse for retry or delete actions
          navigator.vibrate(35);
          break;
        default:
          navigator.vibrate(10);
      }
    } catch {
      // Ignore vibration errors on unsupported or locked browsers
    }
  }, []);

  return {
    triggerHaptic,
    hapticTick: () => triggerHaptic('tick'),
    hapticThreshold: () => triggerHaptic('threshold'),
    hapticSelection: () => triggerHaptic('selection'),
    hapticSuccess: () => triggerHaptic('success'),
    hapticWarning: () => triggerHaptic('warning'),
  };
}
