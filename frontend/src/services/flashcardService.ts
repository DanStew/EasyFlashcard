// ==========================================
// EasyFlashcard - Flashcard Service
// ==========================================

import { apiClient } from './apiClient';
import type {
  Flashcard,
  FlashcardBulkCreate,
  FlashcardCreate,
  FlashcardReorderRequest,
  FlashcardUpdate,
} from '@/types/flashcard';

export const flashcardService = {
  /**
   * List all cards contained within a specific set.
   */
  async listCardsBySet(setId: string): Promise<Flashcard[]> {
    const response = await apiClient.get<Flashcard[]>(`/sets/${setId}/cards`);
    return response.data;
  },

  /**
   * Retrieve a single flashcard by ID.
   */
  async getCard(cardId: string): Promise<Flashcard> {
    const response = await apiClient.get<Flashcard>(`/cards/${cardId}`);
    return response.data;
  },

  /**
   * Create and add a new flashcard to a set.
   */
  async createCard(setId: string, data: FlashcardCreate): Promise<Flashcard> {
    const response = await apiClient.post<Flashcard>(`/sets/${setId}/cards`, data);
    return response.data;
  },

  /**
   * Batch create multiple flashcards in a set.
   */
  async createCardsBulk(setId: string, data: FlashcardBulkCreate): Promise<Flashcard[]> {
    const response = await apiClient.post<Flashcard[]>(`/sets/${setId}/cards/bulk`, data);
    return response.data;
  },

  /**
   * Update a flashcard.
   */
  async updateCard(cardId: string, data: FlashcardUpdate): Promise<Flashcard> {
    const response = await apiClient.patch<Flashcard>(`/cards/${cardId}`, data);
    return response.data;
  },

  /**
   * Delete a flashcard from its set.
   */
  async deleteCard(cardId: string): Promise<void> {
    await apiClient.delete(`/cards/${cardId}`);
  },

  /**
   * Reorder cards within a set.
   */
  async reorderCards(setId: string, data: FlashcardReorderRequest): Promise<Flashcard[]> {
    const response = await apiClient.put<Flashcard[]>(`/sets/${setId}/cards/reorder`, data);
    return response.data;
  },
};
