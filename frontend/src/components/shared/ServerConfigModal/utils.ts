// ==============================================================================
// EasyFlashcard - Server Config Modal Logic & Helpers
// ==============================================================================

import {
  DEFAULT_ANDROID_EMULATOR_BASE_URL,
  DEFAULT_WEB_API_BASE_URL,
  getApiBaseUrl,
  getEnvironmentApiBaseUrl,
  getLanApiBaseUrl,
  resetApiBaseUrl,
  setApiBaseUrl,
  testServerConnection,
  type HealthCheckResult,
} from '@/utils/capacitorUtils';
import type { ConnectionStatus } from './types';

export interface PresetServerOption {
  id: string;
  label: string;
  description: string;
  url: string;
}

/**
 * Get available server preset options, dynamically populating Cloud Run if configured.
 */
export function getServerPresets(): readonly PresetServerOption[] {
  const presets: PresetServerOption[] = [];
  const envUrl = getEnvironmentApiBaseUrl();

  // If a remote / Cloud Run production environment URL is set, provide it as primary preset
  if (envUrl && !envUrl.startsWith('/')) {
    presets.push({
      id: 'cloud',
      label: 'Cloud Run (Production)',
      description: 'Configured remote backend endpoint',
      url: envUrl,
    });
  }

  // Host PC Wi-Fi LAN preset
  presets.push({
    id: 'lan',
    label: 'Host PC Wi-Fi LAN',
    description: 'Direct connection from phone on local Wi-Fi',
    url: getLanApiBaseUrl(),
  });

  // Android Emulator preset
  presets.push({
    id: 'emulator',
    label: 'Android Emulator',
    description: 'Virtual device loopback address (10.0.2.2)',
    url: DEFAULT_ANDROID_EMULATOR_BASE_URL,
  });

  // Web Dev Proxy preset
  presets.push({
    id: 'web',
    label: 'Web Proxy Default',
    description: 'Relative API path (/api/v1) for browser dev server',
    url: DEFAULT_WEB_API_BASE_URL,
  });

  return presets;
}

export const SERVER_PRESETS: readonly PresetServerOption[] = getServerPresets();

/**
 * Clean and format server endpoint candidate input.
 */
export function formatCandidateUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';

  // Ensure scheme is present for absolute URLs
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('/')) {
    return `http://${trimmed}`;
  }
  return trimmed;
}

/**
 * Execute server connectivity test and return standardized status.
 */
export async function executeServerTest(
  candidateUrl: string
): Promise<{ status: ConnectionStatus; result: HealthCheckResult }> {
  const formatted = formatCandidateUrl(candidateUrl);
  if (!formatted) {
    return {
      status: 'error',
      result: { success: false, error: 'Please enter a valid server URL' },
    };
  }

  const result = await testServerConnection(formatted);
  return {
    status: result.success ? 'success' : 'error',
    result,
  };
}

/**
 * Save new base URL setting.
 */
export function saveServerEndpoint(candidateUrl: string): void {
  const formatted = formatCandidateUrl(candidateUrl);
  if (formatted) {
    setApiBaseUrl(formatted);
  }
}

/**
 * Reset server endpoint to project default.
 */
export function restoreDefaultServerEndpoint(): string {
  resetApiBaseUrl();
  return getApiBaseUrl();
}
