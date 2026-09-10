import axios, { AxiosError, AxiosInstance } from 'axios';
import { resolveConfig } from '../config.js';
import type {
  Flashcard,
  FlashcardBulkCreate,
  FlashcardCreate,
  FlashcardReorderRequest,
  FlashcardUpdate,
  Folder,
  FolderCreate,
  FolderTreeItem,
  FolderUpdate,
  SearchResult,
  SetCreate,
  SetModel,
  SetUpdate,
  SetWithCards,
} from './types.js';

export class EasyFlashcardApiClient {
  private client: AxiosInstance;

  constructor() {
    const config = resolveConfig();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-User-ID': config.userId,
    };

    if (config.authToken) {
      headers['Authorization'] = `Bearer ${config.authToken}`;
    }

    this.client = axios.create({
      baseURL: config.apiUrl,
      timeout: 15000,
      headers,
    });

    // Dynamically inject latest user ID and auth token on every request
    this.client.interceptors.request.use((req) => {
      const currentConfig = resolveConfig();
      req.baseURL = currentConfig.apiUrl;
      req.headers.set('X-User-ID', currentConfig.userId);
      if (currentConfig.authToken) {
        req.headers.set('Authorization', `Bearer ${currentConfig.authToken}`);
      }
      return req;
    });
  }

  private handleError(error: unknown, context: string): never {
    if (axios.isAxiosError(error)) {
      const axiosErr = error as AxiosError<{ detail?: string | object }>;
      const status = axiosErr.response?.status;
      const detail = axiosErr.response?.data?.detail;
      const message =
        typeof detail === 'string'
          ? detail
          : typeof detail === 'object'
          ? JSON.stringify(detail)
          : axiosErr.message;
      throw new Error(`[EasyFlashcard API Error] ${context} (HTTP ${status || 'Network'}): ${message}`);
    }
    throw error;
  }

  // ==========================================
  // Folders API
  // ==========================================

  async listFolders(params?: {
    parentId?: string;
    rootOnly?: boolean;
    asTree?: boolean;
    search?: string;
  }): Promise<Folder[] | FolderTreeItem[]> {
    try {
      const response = await this.client.get('/api/v1/folders', {
        params: {
          parent_id: params?.parentId,
          root_only: params?.rootOnly,
          as_tree: params?.asTree,
          search: params?.search,
        },
      });
      return response.data;
    } catch (err) {
      this.handleError(err, 'Failed to list folders');
    }
  }

  async getFolderTree(): Promise<FolderTreeItem[]> {
    try {
      const response = await this.client.get<FolderTreeItem[]>('/api/v1/folders/tree');
      return response.data;
    } catch (err) {
      this.handleError(err, 'Failed to get folder tree');
    }
  }

  async getFolder(folderId: string): Promise<Folder> {
    try {
      const response = await this.client.get<Folder>(`/api/v1/folders/${folderId}`);
      return response.data;
    } catch (err) {
      this.handleError(err, `Failed to get folder ${folderId}`);
    }
  }

  async createFolder(data: FolderCreate): Promise<Folder> {
    try {
      const response = await this.client.post<Folder>('/api/v1/folders', {
        name: data.name,
        parentId: data.parentId ?? null,
      });
      return response.data;
    } catch (err) {
      this.handleError(err, 'Failed to create folder');
    }
  }

  async updateFolder(folderId: string, data: FolderUpdate): Promise<Folder> {
    try {
      const response = await this.client.patch<Folder>(`/api/v1/folders/${folderId}`, data);
      return response.data;
    } catch (err) {
      this.handleError(err, `Failed to update folder ${folderId}`);
    }
  }

  async deleteFolder(folderId: string, cascade = false): Promise<void> {
    try {
      await this.client.delete(`/api/v1/folders/${folderId}`, {
        params: { cascade },
      });
    } catch (err) {
      this.handleError(err, `Failed to delete folder ${folderId}`);
    }
  }

  // ==========================================
  // Sets API
  // ==========================================

  async listSets(params?: {
    folderId?: string;
    rootOnly?: boolean;
    tag?: string;
    search?: string;
  }): Promise<SetModel[]> {
    try {
      const response = await this.client.get<SetModel[]>('/api/v1/sets', {
        params: {
          folder_id: params?.folderId,
          root_only: params?.rootOnly,
          tag: params?.tag,
          search: params?.search,
        },
      });
      return response.data;
    } catch (err) {
      this.handleError(err, 'Failed to list sets');
    }
  }

  async getSet(setId: string): Promise<SetModel> {
    try {
      const response = await this.client.get<SetModel>(`/api/v1/sets/${setId}`);
      return response.data;
    } catch (err) {
      this.handleError(err, `Failed to get set ${setId}`);
    }
  }

  async getSetWithCards(setId: string): Promise<SetWithCards> {
    try {
      const [setDetails, cards] = await Promise.all([
        this.getSet(setId),
        this.listCards(setId),
      ]);
      return {
        ...setDetails,
        cards,
      };
    } catch (err) {
      this.handleError(err, `Failed to get set with cards for set ${setId}`);
    }
  }

  async createSet(data: SetCreate): Promise<SetModel> {
    try {
      const response = await this.client.post<SetModel>('/api/v1/sets', {
        name: data.name,
        folderId: data.folderId ?? null,
        description: data.description ?? null,
        tags: data.tags ?? [],
      });
      return response.data;
    } catch (err) {
      this.handleError(err, 'Failed to create set');
    }
  }

  async updateSet(setId: string, data: SetUpdate): Promise<SetModel> {
    try {
      const response = await this.client.patch<SetModel>(`/api/v1/sets/${setId}`, data);
      return response.data;
    } catch (err) {
      this.handleError(err, `Failed to update set ${setId}`);
    }
  }

  async deleteSet(setId: string): Promise<void> {
    try {
      await this.client.delete(`/api/v1/sets/${setId}`);
    } catch (err) {
      this.handleError(err, `Failed to delete set ${setId}`);
    }
  }

  // ==========================================
  // Flashcards API
  // ==========================================

  async listCards(setId: string): Promise<Flashcard[]> {
    try {
      const response = await this.client.get<Flashcard[]>(`/api/v1/sets/${setId}/cards`);
      return response.data;
    } catch (err) {
      this.handleError(err, `Failed to list cards for set ${setId}`);
    }
  }

  async getCard(cardId: string): Promise<Flashcard> {
    try {
      const response = await this.client.get<Flashcard>(`/api/v1/cards/${cardId}`);
      return response.data;
    } catch (err) {
      this.handleError(err, `Failed to get card ${cardId}`);
    }
  }

  async createCard(setId: string, data: FlashcardCreate): Promise<Flashcard> {
    try {
      const response = await this.client.post<Flashcard>(`/api/v1/sets/${setId}/cards`, data);
      return response.data;
    } catch (err) {
      this.handleError(err, `Failed to add card to set ${setId}`);
    }
  }

  async createCardsBulk(setId: string, data: FlashcardBulkCreate): Promise<Flashcard[]> {
    try {
      const response = await this.client.post<Flashcard[]>(
        `/api/v1/sets/${setId}/cards/bulk`,
        data
      );
      return response.data;
    } catch (err) {
      this.handleError(err, `Failed to batch add cards to set ${setId}`);
    }
  }

  async updateCard(cardId: string, data: FlashcardUpdate): Promise<Flashcard> {
    try {
      const response = await this.client.patch<Flashcard>(`/api/v1/cards/${cardId}`, data);
      return response.data;
    } catch (err) {
      this.handleError(err, `Failed to update card ${cardId}`);
    }
  }

  async deleteCard(cardId: string): Promise<void> {
    try {
      await this.client.delete(`/api/v1/cards/${cardId}`);
    } catch (err) {
      this.handleError(err, `Failed to delete card ${cardId}`);
    }
  }

  async reorderCards(setId: string, data: FlashcardReorderRequest): Promise<Flashcard[]> {
    try {
      const response = await this.client.put<Flashcard[]>(
        `/api/v1/sets/${setId}/cards/reorder`,
        data
      );
      return response.data;
    } catch (err) {
      this.handleError(err, `Failed to reorder cards in set ${setId}`);
    }
  }

  // ==========================================
  // Search API
  // ==========================================

  async searchWorkspace(query: string, limit = 20): Promise<SearchResult> {
    try {
      const response = await this.client.get<SearchResult>('/api/v1/search', {
        params: { q: query, limit },
      });
      return response.data;
    } catch (err) {
      this.handleError(err, `Failed to search workspace with query "${query}"`);
    }
  }
}
