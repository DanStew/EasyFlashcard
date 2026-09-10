// ==========================================
// EasyFlashcard - Document & Google Drive Types
// ==========================================

export interface Document {
  id: string;
  userId: string;
  name: string;
  mimeType: string;
  driveFileId: string;
  driveFolderId?: string | null;
  webViewLink?: string | null;
  webContentLink?: string | null;
  thumbnailLink?: string | null;
  iconLink?: string | null;
  sizeBytes?: number | null;
  pageCount?: number | null;
  linkedSetIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DriveFolderItem {
  id: string;
  name: string;
  parentId?: string | null;
  mimeType: string;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface DriveBreadcrumb {
  id: string;
  name: string;
}

export interface DriveFolderContentsResponse {
  currentFolder: DriveFolderItem;
  breadcrumbs: DriveBreadcrumb[];
  subfolders: DriveFolderItem[];
  files: Document[];
}

export interface CreateSubfolderRequest {
  name: string;
  parentFolderId?: string | null;
}

export interface MoveItemRequest {
  itemId: string;
  targetFolderId: string;
  sourceFolderId?: string | null;
}

export type DriveErrorCode =
  | 'DRIVE_AUTH_REQUIRED'
  | 'DRIVE_PERMISSION_DENIED'
  | 'DRIVE_QUOTA_EXCEEDED'
  | 'DRIVE_ITEM_NOT_FOUND'
  | 'DRIVE_SCOPE_UPGRADE'
  | 'DRIVE_UNKNOWN_ERROR';

export interface DriveErrorDetails {
  code: DriveErrorCode;
  message: string;
}

export interface DriveAuthExchangeRequest {
  code: string;
  redirect_uri?: string;
}

export interface DriveAuthStatus {
  connected: boolean;
  has_refresh_token: boolean;
  expires_at?: string | null;
  email?: string | null;
  scope?: string | null;
  needs_scope_upgrade?: boolean;
}

export interface DriveAuthDisconnectResponse {
  success: boolean;
  message: string;
}

