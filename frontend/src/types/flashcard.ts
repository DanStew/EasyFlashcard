// ==========================================
// EasyFlashcard - Flashcard Models
// ==========================================

export interface CardFace {
  text: string;
  imageUrl?: string | null;
  imageAlt?: string | null;
}

export interface DocumentReference {
  documentId: string;
  documentName: string;
  pageNumber: number;
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
