// ==========================================
// EasyFlashcard - Folder Service
// ==========================================

import { apiClient } from './apiClient';
import type { Folder, FolderCreate, FolderTreeItem, FolderUpdate } from '@/types/folder';

export const folderService = {
  /**
   * Fetch complete nested hierarchical tree of folders.
   */
  async getFolderTree(): Promise<FolderTreeItem[]> {
    const response = await apiClient.get<FolderTreeItem[]>('/folders/tree');
    return response.data;
  },

  /**
   * List folders optionally filtered by parent folder ID, root-level only, or search query.
   */
  async listFolders(
    parentId?: string | null,
    rootOnly?: boolean,
    search?: string
  ): Promise<Folder[]> {
    const params: Record<string, string> = {};
    if (rootOnly) {
      params.root_only = 'true';
    } else if (parentId !== undefined && parentId !== null) {
      params.parent_id = parentId;
    }
    if (search && search.trim()) {
      params.search = search.trim();
    }
    const response = await apiClient.get<Folder[]>('/folders', { params });
    return response.data;
  },

  /**
   * Retrieve a single folder by ID.
   */
  async getFolder(folderId: string): Promise<Folder> {
    const response = await apiClient.get<Folder>(`/folders/${folderId}`);
    return response.data;
  },

  /**
   * Create a new folder or subfolder.
   */
  async createFolder(data: FolderCreate): Promise<Folder> {
    const response = await apiClient.post<Folder>('/folders', data);
    return response.data;
  },

  /**
   * Update folder name or change parent folder.
   */
  async updateFolder(folderId: string, data: FolderUpdate): Promise<Folder> {
    const response = await apiClient.patch<Folder>(`/folders/${folderId}`, data);
    return response.data;
  },

  /**
   * Delete a folder by ID (optionally cascading).
   */
  async deleteFolder(folderId: string, cascade = false): Promise<void> {
    await apiClient.delete(`/folders/${folderId}`, {
      params: { cascade },
    });
  },
};
