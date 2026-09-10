// ==========================================
// DriveAuthBanner - Types
// ==========================================

import type { DriveErrorCode } from '@/types/document';

export interface DriveAuthBannerProps {
  errorCode: DriveErrorCode | null;
  errorMessage?: string | null;
  onConnectDrive?: () => void;
  onDismiss?: () => void;
  isConnecting?: boolean;
}
