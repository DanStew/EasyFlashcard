import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor Configuration for EasyFlashcard
 * Configured for Android native deployment with local API server connectivity support.
 */
const config: CapacitorConfig = {
  appId: 'com.easyflashcard.app',
  appName: 'EasyFlashcard',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // Allow cleartext HTTP connections for local network backend development & Wi-Fi debugging
    cleartext: true,
  },
  plugins: {
    Keyboard: {
      resize: 'body',
    },
    StatusBar: {
      overlaysWebView: false,
    },
    GoogleAuth: {
      scopes: ['profile', 'email', 'https://www.googleapis.com/auth/drive'],
      serverClientId: '652975745934-fdt5db9qkm7ni511t72tmjd9i0mo3gtq.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
