// ============================================================================
// EasyFlashcard Domain Types & Schemas
// ============================================================================

export interface CardFace {
  text: string;
  imageUrl?: string | null;
  imageAlt?: string | null;
}

export interface DocumentReference {
  documentId: string;
  documentName: string;
  pageNumber: number;
  groundingEvidence?: string | null;
}

export interface Flashcard {
  id: string;
  setId: string;
  front: CardFace;
  back: CardFace;
  orderIndex: number;
  sourceReference?: DocumentReference | null;
  createdAt: string;
  updatedAt: string;
}

export interface FlashcardCreate {
  front: CardFace;
  back: CardFace;
  orderIndex?: number;
  sourceReference?: DocumentReference | null;
}

export interface FlashcardBulkCreate {
  cards: FlashcardCreate[];
}

export interface FlashcardUpdate {
  front?: CardFace;
  back?: CardFace;
  orderIndex?: number;
  sourceReference?: DocumentReference | null;
}

export interface FlashcardReorderRequest {
  cardIds: string[];
}

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
  name?: string | null;
  folderId?: string | null;
  description?: string | null;
  tags?: string[];
}

export interface SetWithCards extends SetModel {
  cards: Flashcard[];
}

export interface Folder {
  id: string;
  userId: string;
  parentId: string | null;
  name: string;
  path: string;
  createdAt: string;
  updatedAt: string;
}

export interface FolderTreeItem extends Folder {
  subfolders: FolderTreeItem[];
  setCount: number;
}

export interface FolderCreate {
  name: string;
  parentId?: string | null;
}

export interface FolderUpdate {
  name?: string | null;
  parentId?: string | null;
}

export interface SearchResult {
  folders: Folder[];
  sets: SetModel[];
  totalCount: number;
}
