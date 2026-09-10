// ==========================================
// AIStudioView - Utilities
// ==========================================

import type { DriveErrorCode } from '@/types/document';

/**
 * Extracts structured Google Drive error code and message from API errors.
 */
export function extractDriveError(err: unknown): { code: DriveErrorCode; message: string } {
  if (!err) {
    return { code: 'DRIVE_UNKNOWN_ERROR', message: 'An unexpected error occurred.' };
  }

  const anyErr = err as {
    response?: {
      status?: number;
      data?: {
        detail?: { code?: string; message?: string } | string;
      };
    };
    status?: number;
    message?: string;
  };

  const status = anyErr.response?.status || anyErr.status;
  const detail = anyErr.response?.data?.detail;

  if (typeof detail === 'object' && detail !== null && 'code' in detail) {
    return {
      code: (detail.code as DriveErrorCode) || 'DRIVE_UNKNOWN_ERROR',
      message: detail.message || 'Google Drive error',
    };
  }

  if (status === 401) {
    return {
      code: 'DRIVE_AUTH_REQUIRED',
      message: 'Google Drive authorization is required or expired.',
    };
  }

  if (status === 403) {
    return {
      code: 'DRIVE_PERMISSION_DENIED',
      message:
        typeof detail === 'string'
          ? detail
          : 'Google Drive access was denied or blocked by organization administrator policy.',
    };
  }

  return {
    code: 'DRIVE_UNKNOWN_ERROR',
    message: typeof detail === 'string' ? detail : anyErr.message || 'Failed to load Google Drive files.',
  };
}
