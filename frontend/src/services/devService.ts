// ==========================================
// EasyFlashcard - Developer Environment Service
// ==========================================

import { apiClient } from './apiClient';

export interface SeedResponse {
  status: string;
  message: string;
  userId: string;
  foldersCreated: number;
  setsCreated: number;
  cardsCreated: number;
}

export interface ResetResponse {
  status: string;
  message: string;
  userId: string;
  deletedFolders: number;
  deletedSets: number;
  deletedCards: number;
}

export interface DevStatusResponse {
  environment: string;
  storageBackend: string;
  defaultUserId: string;
  autoSeedDevData: boolean;
  devEndpointsEnabled: boolean;
}

/**
 * Service to interact with developer mode utility endpoints.
 */
export const devService = {
  /**
   * Prepopulates the environment with demo folders, nested subfolders, sets, and flashcards.
   */
  async seedDevData(clearExisting = true): Promise<SeedResponse> {
    const response = await apiClient.post<SeedResponse>('/dev/seed', null, {
      params: { clear_existing: clearExisting },
    });
    return response.data;
  },

  /**
   * Clears all folders, sets, and cards for the current user.
   */
  async resetDevData(): Promise<ResetResponse> {
    const response = await apiClient.post<ResetResponse>('/dev/reset');
    return response.data;
  },

  /**
   * Fetches the current developer mode configuration status.
   */
  async getDevStatus(): Promise<DevStatusResponse> {
    const response = await apiClient.get<DevStatusResponse>('/dev/status');
    return response.data;
  },
};
