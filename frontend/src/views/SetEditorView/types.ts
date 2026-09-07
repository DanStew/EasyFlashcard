export interface CardDraft {
  id?: string;
  frontText: string;
  backText: string;
  orderIndex: number;
}

export interface SetEditorState {
  name: string;
  description: string;
  folderId: string;
  tagsString: string;
  cards: CardDraft[];
  isLoading: boolean;
  isSaving: boolean;
}
