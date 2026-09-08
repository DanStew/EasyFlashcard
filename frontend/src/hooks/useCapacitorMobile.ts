// ==============================================================================
// EasyFlashcard - Capacitor Mobile Hardware & System Integration Hook
// ==============================================================================

import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard } from '@capacitor/keyboard';
import { useTheme } from '@/context/ThemeContext';
import { isCapacitorNative, getPlatformName } from '@/utils/capacitorUtils';

/**
 * Coordinates native Android mobile features:
 * 1. Hardware Back Button navigation with React Router history & root minimization
 * 2. Status Bar background & icon theme synchronization
 * 3. Keyboard behavior adjustments
 */
export function useCapacitorMobile(): void {
  const navigate = useNavigate();
  const location = useLocation();
  const { resolvedTheme } = useTheme();

  // 1. Android Hardware & Gesture Back Button Handling
  useEffect(() => {
    if (!isCapacitorNative() || getPlatformName() !== 'android') {
      return;
    }

    let isMounted = true;

    const backButtonListenerPromise = CapacitorApp.addListener('backButton', ({ canGoBack }) => {
      if (!isMounted) return;

      // If at root workspace without history, minimize or exit app
      if (location.pathname === '/' || !canGoBack) {
        CapacitorApp.exitApp();
      } else {
        // Navigate back in React Router history
        navigate(-1);
      }
    });

    return () => {
      isMounted = false;
      backButtonListenerPromise.then((listener) => {
        listener.remove();
      });
    };
  }, [location.pathname, navigate]);

  // 2. Mobile Status Bar Theme Synchronization
  useEffect(() => {
    if (!isCapacitorNative()) {
      return;
    }

    const updateStatusBar = async () => {
      try {
        const isDark = resolvedTheme === 'dark';
        await StatusBar.setStyle({
          style: isDark ? Style.Dark : Style.Light,
        });

        // Set status bar background color to match app theme background
        await StatusBar.setBackgroundColor({
          color: isDark ? '#090d16' : '#ffffff',
        });
      } catch {
        // Status bar plugin might not be available or supported in certain environments
      }
    };

    updateStatusBar();
  }, [resolvedTheme]);

  // 3. Mobile Virtual Keyboard Event Listener
  useEffect(() => {
    if (!isCapacitorNative()) {
      return;
    }

    let isMounted = true;

    const showListener = Keyboard.addListener('keyboardWillShow', () => {
      if (isMounted) {
        document.body.setAttribute('data-keyboard-visible', 'true');
      }
    });

    const hideListener = Keyboard.addListener('keyboardWillHide', () => {
      if (isMounted) {
        document.body.removeAttribute('data-keyboard-visible');
      }
    });

    return () => {
      isMounted = false;
      showListener.then((l) => l.remove());
      hideListener.then((l) => l.remove());
    };
  }, []);
}
