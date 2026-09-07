import type { CardDraft } from './types';

/**
 * Creates an empty card draft row.
 */
export function createEmptyCardDraft(index: number): CardDraft {
  return {
    frontText: '',
    backText: '',
    orderIndex: index,
  };
}

/**
 * Validates that the set has a valid title and at least one non-empty card.
 */
export function validateSetDraft(name: string, cards: CardDraft[]): { valid: boolean; error?: string } {
  if (!name.trim()) {
    return { valid: false, error: 'Please provide a title for your flashcard set.' };
  }

  const validCards = cards.filter((c) => c.frontText.trim() && c.backText.trim());
  if (validCards.length === 0) {
    return { valid: false, error: 'Please provide at least one complete flashcard (term and definition).' };
  }

  return { valid: true };
}

export interface FolderDisplayInfo {
  name: string;
  path: string;
  isRoot: boolean;
}

/**
 * Resolves display details for the selected folder destination.
 */
export function getFolderDisplayInfo(folders: { id: string; name: string; path?: string }[], folderId: string | null): FolderDisplayInfo {
  if (!folderId) {
    return {
      name: 'Root Library',
      path: '/',
      isRoot: true,
    };
  }
  const match = folders.find((f) => f.id === folderId);
  if (match) {
    return {
      name: match.name,
      path: match.path || `/${match.name}/`,
      isRoot: false,
    };
  }
  return {
    name: 'Folder',
    path: '/',
    isRoot: false,
  };
}
