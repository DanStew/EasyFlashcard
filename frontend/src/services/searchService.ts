// ==========================================
// EasyFlashcard - Search Service
// ==========================================

import { apiClient } from './apiClient';
import type { Folder } from '@/types/folder';
import type { SetModel } from '@/types/set';

export interface GlobalSearchResult {
  folders: Folder[];
  sets: SetModel[];
  totalCount: number;
}

export const searchService = {
  /**
   * Search across the user's entire library of folders and flashcard sets.
   */
  async search(query: string, limit = 20): Promise<GlobalSearchResult> {
    const trimmed = query.trim();
    if (!trimmed) {
      return { folders: [], sets: [], totalCount: 0 };
    }
    const response = await apiClient.get<GlobalSearchResult>('/search', {
      params: { q: trimmed, limit },
    });
    return response.data;
  },
};
