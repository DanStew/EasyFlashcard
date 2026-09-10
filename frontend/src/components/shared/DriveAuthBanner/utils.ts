// ==========================================
// DriveAuthBanner - Utilities
// ==========================================

import type { DriveErrorCode } from '@/types/document';

export interface BannerInfo {
  variant: 'warning' | 'error' | 'info';
  title: string;
  description: string;
  actionText: string | null;
}

/**
 * Resolves presentation content and severity for various Google Drive error conditions.
 */
export function getBannerInfoForError(code: DriveErrorCode | null, customMsg?: string | null): BannerInfo {
  switch (code) {
    case 'DRIVE_PERMISSION_DENIED':
      return {
        variant: 'error',
        title: 'Google Drive Access Restricted by Organization Policy',
        description:
          customMsg ||
          'Your school or corporate Google Workspace administrator has blocked third-party applications from accessing Google Drive. EasyFlashcard cannot connect to this Drive account.',
        actionText: null,
      };
    case 'DRIVE_QUOTA_EXCEEDED':
      return {
        variant: 'error',
        title: 'Google Drive Storage Full',
        description:
          customMsg ||
          'Your Google Drive storage limit has been reached. Please free up space in your Google Drive or delete unused files before uploading more documents.',
        actionText: null,
      };
    case 'DRIVE_ITEM_NOT_FOUND':
      return {
        variant: 'error',
        title: 'Google Drive Folder Not Found',
        description:
          customMsg ||
          'The requested folder or file was not found in your Google Drive. It may have been renamed, moved, or deleted outside EasyFlashcard.',
        actionText: null,
      };
    case 'DRIVE_AUTH_REQUIRED':
      return {
        variant: 'warning',
        title: 'Google Drive Connection Required',
        description:
          customMsg ||
          'Your Google Drive authorization has expired or is missing. Connect your Google account to access, manage, and upload study documents in EasyFlashcard.',
        actionText: 'Connect Google Drive',
      };
    case 'DRIVE_SCOPE_UPGRADE':
      return {
        variant: 'info',
        title: 'Upgrade Drive Permissions for Full Folder Sync',
        description:
          customMsg ||
          'Your Google Drive connection is using legacy restricted permissions. Upgrade permissions once so EasyFlashcard can automatically discover all files and subfolders created directly in your Google Drive.',
        actionText: 'Upgrade Permissions & Sync',
      };
    case 'DRIVE_UNKNOWN_ERROR':
    default:
      return {
        variant: 'error',
        title: 'Google Drive Sync Issue',
        description:
          customMsg ||
          'Unable to communicate with Google Drive. Please check your network connection or try refreshing the page.',
        actionText: null,
      };
  }
}
