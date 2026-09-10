// ==========================================
// EasyFlashcard - Google Drive OAuth & GIS Service
// ==========================================

import { documentService } from './documentService';
import type { DriveAuthStatus } from '@/types/document';

const GOOGLE_GSI_SCRIPT_URL = 'https://accounts.google.com/gsi/client';
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.file';

/**
 * Type declarations for Google Identity Services (GIS) OAuth2 client.
 */
interface CodeResponse {
  code?: string;
  error?: string;
  error_description?: string;
}

interface CodeClient {
  requestCode: () => void;
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initCodeClient: (config: {
            client_id: string;
            scope: string;
            ux_mode?: 'popup' | 'redirect';
            select_account?: boolean;
            prompt?: string;
            callback: (response: CodeResponse) => void;
            error_callback?: (error: unknown) => void;
          }) => CodeClient;
        };
      };
    };
  }
}

/**
 * Dynamically loads the official Google Identity Services script if not already loaded.
 */
export function loadGoogleIdentityServices(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);

  if (window.google?.accounts?.oauth2) {
    return Promise.resolve(true);
  }

  const existingScript = document.querySelector(`script[src="${GOOGLE_GSI_SCRIPT_URL}"]`);
  if (existingScript) {
    return new Promise((resolve) => {
      existingScript.addEventListener('load', () => resolve(true));
      existingScript.addEventListener('error', () => resolve(false));
    });
  }

  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = GOOGLE_GSI_SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.warn('Failed to load Google Identity Services SDK.');
      resolve(false);
    };
    document.head.appendChild(script);
  });
}

/**
 * Returns the configured Google OAuth Client ID from environment variables.
 */
export function getGoogleOAuthClientId(): string {
  return (
    import.meta.env.VITE_OAUTH_CLIENT_ID ||
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    import.meta.env.VITE_FIREBASE_APP_ID ||
    ''
  ).trim();
}

/**
 * Requests an offline Google OAuth 2.0 authorization code via GIS popup.
 */
export async function requestGoogleDriveAuthCode(): Promise<string> {
  const clientId = getGoogleOAuthClientId();

  // If no OAuth client ID is configured in the environment, fallback to dev mock code
  if (!clientId || clientId.startsWith('your_')) {
    console.info('No VITE_OAUTH_CLIENT_ID configured. Operating in dev mock mode.');
    return 'mock_code_dev';
  }

  const isGisLoaded = await loadGoogleIdentityServices();
  if (!isGisLoaded || !window.google?.accounts?.oauth2) {
    throw new Error('Google Identity Services SDK could not be initialized.');
  }

  return new Promise<string>((resolve, reject) => {
    try {
      const client = window.google!.accounts!.oauth2!.initCodeClient({
        client_id: clientId,
        scope: DRIVE_SCOPE,
        ux_mode: 'popup',
        select_account: true,
        prompt: 'consent',
        callback: (response: CodeResponse) => {
          if (response.error) {
            reject(new Error(response.error_description || response.error));
            return;
          }
          if (response.code) {
            resolve(response.code);
          } else {
            reject(new Error('No authorization code was returned by Google.'));
          }
        },
        error_callback: (err: unknown) => {
          reject(err instanceof Error ? err : new Error('Google OAuth popup encountered an error.'));
        },
      });

      client.requestCode();
    } catch (err) {
      reject(err instanceof Error ? err : new Error('Failed to launch Google OAuth popup.'));
    }
  });
}

/**
 * Launches the persistent Google Drive connection flow and saves refresh token on the server.
 */
export async function connectPersistentGoogleDrive(): Promise<DriveAuthStatus> {
  const code = await requestGoogleDriveAuthCode();
  const status = await documentService.exchangeDriveAuthCode(code);
  return status;
}
