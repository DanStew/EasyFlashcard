// ==========================================
// EasyFlashcard - Set Service
// ==========================================

import { apiClient } from './apiClient';
import type { SetCreate, SetFilterParams, SetModel, SetUpdate } from '@/types/set';

export const setService = {
  /**
   * List sets optionally filtered by folder ID, tag, or search string.
   */
  async listSets(params?: SetFilterParams): Promise<SetModel[]> {
    const queryParams: Record<string, string> = {};
    if (params?.folderId) {
      queryParams.folder_id = params.folderId;
    }
    if (params?.rootOnly) {
      queryParams.root_only = 'true';
    }
    if (params?.tag) {
      queryParams.tag = params.tag;
    }
    if (params?.search) {
      queryParams.search = params.search;
    }
    const response = await apiClient.get<SetModel[]>('/sets', {
      params: queryParams,
    });
    return response.data;
  },

  /**
   * Retrieve full details of a specific set.
   */
  async getSet(setId: string): Promise<SetModel> {
    const response = await apiClient.get<SetModel>(`/sets/${setId}`);
    return response.data;
  },

  /**
   * Create a new flashcard set.
   */
  async createSet(data: SetCreate): Promise<SetModel> {
    const response = await apiClient.post<SetModel>('/sets', data);
    return response.data;
  },

  /**
   * Update a set's name, description, folder, or tags.
   */
  async updateSet(setId: string, data: SetUpdate): Promise<SetModel> {
    const response = await apiClient.patch<SetModel>(`/sets/${setId}`, data);
    return response.data;
  },

  /**
   * Delete a flashcard set and its cards.
   */
  async deleteSet(setId: string): Promise<void> {
    await apiClient.delete(`/sets/${setId}`);
  },
};
