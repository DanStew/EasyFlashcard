// ==========================================
// EasyFlashcard - Document & Google Drive Service
// ==========================================

import { apiClient } from './apiClient';
import type {
  CreateSubfolderRequest,
  Document,
  DriveFolderContentsResponse,
  DriveFolderItem,
  MoveItemRequest,
} from '@/types/document';

export const documentService = {
  /**
   * Fetches contents of a Google Drive folder in the EasyFlashcard hierarchy.
   */
  async getDriveFolderContents(folderId?: string): Promise<DriveFolderContentsResponse> {
    const params = folderId ? { folder_id: folderId } : {};
    const res = await apiClient.get<DriveFolderContentsResponse>('/documents/drive/contents', {
      params,
    });
    return res.data;
  },

  /**
   * Creates a new subfolder in Google Drive.
   */
  async createDriveSubfolder(payload: CreateSubfolderRequest): Promise<DriveFolderItem> {
    const res = await apiClient.post<DriveFolderItem>('/documents/drive/folders', {
      name: payload.name,
      parentFolderId: payload.parentFolderId || null,
    });
    return res.data;
  },

  /**
   * Uploads a document (PDF, Doc, Slide, Image) directly into the selected Google Drive folder.
   */
  async uploadDocument(file: File, folderId?: string): Promise<Document> {
    const formData = new FormData();
    formData.append('file', file);
    if (folderId) {
      formData.append('folder_id', folderId);
    }

    const res = await apiClient.post<Document>('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000,
    });
    return res.data;
  },

  /**
   * Moves a file or folder into a new destination folder in Google Drive.
   */
  async moveDriveItem(payload: MoveItemRequest): Promise<boolean> {
    const res = await apiClient.patch<{ success: boolean }>('/documents/drive/items/move', payload);
    return res.data.success;
  },

  /**
   * Moves a file or folder to the user's Google Drive Trash.
   */
  async trashDriveItem(itemId: string): Promise<boolean> {
    const res = await apiClient.delete<{ success: boolean }>(`/documents/drive/items/${itemId}`);
    return res.data.success;
  },

  /**
   * Retrieves document metadata along with linked flashcard sets.
   */
  async getDocumentById(documentId: string): Promise<Document> {
    const res = await apiClient.get<Document>(`/documents/${documentId}`);
    return res.data;
  },

  /**
   * Lists all documents belonging to the user.
   */
  async listUserDocuments(): Promise<Document[]> {
    const res = await apiClient.get<Document[]>('/documents');
    return res.data;
  },
};
