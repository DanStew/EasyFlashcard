// ==========================================
// EasyFlashcard - Set Models
// ==========================================

export interface SetModel {
  id: string;
  userId: string;
  folderId: string | null;
  name: string;
  description: string | null;
  cardCount: number;
  tags: string[];
  sourceDocumentIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SetCreate {
  name: string;
  folderId?: string | null;
  description?: string | null;
  tags?: string[];
}

export interface SetUpdate {
  name?: string;
  folderId?: string | null;
  description?: string | null;
  tags?: string[];
}

export interface SetFilterParams {
  folderId?: string | null;
  rootOnly?: boolean;
  tag?: string | null;
  search?: string | null;
}
