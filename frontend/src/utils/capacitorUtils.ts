// ==============================================================================
// EasyFlashcard - Capacitor & Mobile Platform Utilities
// ==============================================================================

import { Capacitor } from '@capacitor/core';

/**
 * Storage keys and default network constants for cross-platform execution.
 */
export const STORAGE_KEY_API_BASE_URL = 'easyflashcard_api_base_url';
export const EVENT_API_BASE_URL_CHANGED = 'easyflashcard_api_base_url_changed';

export const DEFAULT_WEB_API_BASE_URL = '/api/v1';
export const DEFAULT_ANDROID_LAN_BASE_URL = 'http://192.168.1.77:8000/api/v1';
export const DEFAULT_ANDROID_EMULATOR_BASE_URL = 'http://10.0.2.2:8000/api/v1';

/**
 * Check whether the application is running inside a native Capacitor wrapper (Android/iOS).
 */
export function isCapacitorNative(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Get current platform identifier: 'android', 'ios', or 'web'.
 */
export function getPlatformName(): 'android' | 'ios' | 'web' {
  const platform = Capacitor.getPlatform();
  if (platform === 'android' || platform === 'ios') {
    return platform;
  }
  return 'web';
}

/**
 * Retrieve the active API base URL.
 * Order of precedence:
 * 1. User-customized URL from local storage (allows on-device endpoint changes)
 * 2. Vite environment variable `VITE_API_BASE_URL`
 * 3. Default fallback: LAN IP for native Android, or relative `/api/v1` for web
 */
export function getApiBaseUrl(): string {
  try {
    const customUrl = localStorage.getItem(STORAGE_KEY_API_BASE_URL);
    if (customUrl && customUrl.trim().length > 0) {
      return customUrl.trim().replace(/\/+$/, '');
    }
  } catch {
    // LocalStorage inaccessible
  }

  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim().length > 0) {
    return envUrl.trim().replace(/\/+$/, '');
  }

  // Native Android shell needs absolute host address because localhost points to the phone itself
  if (isCapacitorNative() && getPlatformName() === 'android') {
    return DEFAULT_ANDROID_LAN_BASE_URL;
  }

  return DEFAULT_WEB_API_BASE_URL;
}

/**
 * Persists a new API base URL to local storage and dispatches a change event.
 */
export function setApiBaseUrl(url: string): void {
  const sanitized = url.trim().replace(/\/+$/, '');
  try {
    localStorage.setItem(STORAGE_KEY_API_BASE_URL, sanitized);
  } catch {
    // LocalStorage inaccessible
  }

  window.dispatchEvent(
    new CustomEvent(EVENT_API_BASE_URL_CHANGED, { detail: { url: sanitized } })
  );
}

/**
 * Clears custom API base URL from local storage.
 */
export function resetApiBaseUrl(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_API_BASE_URL);
  } catch {
    // LocalStorage inaccessible
  }

  window.dispatchEvent(
    new CustomEvent(EVENT_API_BASE_URL_CHANGED, { detail: { url: getApiBaseUrl() } })
  );
}

/**
 * Response structure for ping test.
 */
export interface HealthCheckResult {
  success: boolean;
  statusText?: string;
  statusCode?: number;
  durationMs?: number;
  error?: string;
}

/**
 * Tests reachability of an API server endpoint by sending a request to `/health` or `/api/v1/health`.
 */
export async function testServerConnection(candidateBaseUrl: string): Promise<HealthCheckResult> {
  const startTime = performance.now();
  const trimmedUrl = candidateBaseUrl.trim().replace(/\/+$/, '');

  // Determine health URL candidate: if candidate already contains /api/v1, test /health on root or endpoint
  const targetUrl = trimmedUrl.endsWith('/api/v1')
    ? `${trimmedUrl}/health`
    : `${trimmedUrl}/health`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const durationMs = Math.round(performance.now() - startTime);

    if (response.ok) {
      return {
        success: true,
        statusCode: response.status,
        statusText: response.statusText,
        durationMs,
      };
    }

    return {
      success: false,
      statusCode: response.status,
      statusText: response.statusText,
      durationMs,
      error: `Server returned HTTP ${response.status}`,
    };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    const durationMs = Math.round(performance.now() - startTime);
    const message = err instanceof Error ? err.message : 'Connection failed';
    return {
      success: false,
      durationMs,
      error: message.includes('aborted') ? 'Connection timed out (4s)' : message,
    };
  }
}
