// ==========================================
// EasyFlashcard - useStudySetSelector Hook
// ==========================================

import { useCallback, useEffect, useState } from 'react';
import { setService } from '@/services/setService';
import type { SetModel } from '@/types/set';

export function useStudySetSelector(initialFolderId?: string | null, isOpen: boolean = false) {
  const [allSets, setAllSets] = useState<SetModel[]>([]);
  const [isLoadingSets, setIsLoadingSets] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentFolderId, setCurrentFolderId] = useState<string | null>(initialFolderId ?? null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSetIds, setSelectedSetIds] = useState<string[]>([]);
  const [isShuffleEnabled, setIsShuffleEnabled] = useState(true);

  // Sync initial folder if updated from props
  useEffect(() => {
    if (isOpen) {
      setCurrentFolderId(initialFolderId ?? null);
    }
  }, [initialFolderId, isOpen]);

  // Load all user sets when the modal opens
  const loadSets = useCallback(async () => {
    try {
      setIsLoadingSets(true);
      setError(null);
      const sets = await setService.listSets();
      setAllSets(sets);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load flashcard sets');
    } finally {
      setIsLoadingSets(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadSets();
    }
  }, [isOpen, loadSets]);

  // Toggle single set selection
  const toggleSet = useCallback((setId: string) => {
    setSelectedSetIds((prev) =>
      prev.includes(setId) ? prev.filter((id) => id !== setId) : [...prev, setId]
    );
  }, []);

  // Toggle select-all for all sets within a folder
  const toggleSelectAllFolder = useCallback((folderSets: SetModel[]) => {
    const selectable = folderSets.filter((s) => s.cardCount > 0);
    if (selectable.length === 0) return;

    setSelectedSetIds((prev) => {
      const prevSet = new Set(prev);
      const allSelected = selectable.every((s) => prevSet.has(s.id));

      if (allSelected) {
        // Deselect all in this folder
        const selectableIds = new Set(selectable.map((s) => s.id));
        return prev.filter((id) => !selectableIds.has(id));
      } else {
        // Select all in this folder
        const updated = new Set(prev);
        selectable.forEach((s) => updated.add(s.id));
        return Array.from(updated);
      }
    });
  }, []);

  // Remove single set chip from tray
  const removeSet = useCallback((setId: string) => {
    setSelectedSetIds((prev) => prev.filter((id) => id !== setId));
  }, []);

  // Clear all selections
  const clearAll = useCallback(() => {
    setSelectedSetIds([]);
  }, []);

  // Drill down / jump to a folder
  const navigateToFolder = useCallback((folderId: string | null) => {
    setCurrentFolderId(folderId);
    setSearchQuery('');
  }, []);

  return {
    allSets,
    isLoadingSets,
    error,
    currentFolderId,
    searchQuery,
    selectedSetIds,
    isShuffleEnabled,
    setSearchQuery,
    setIsShuffleEnabled,
    toggleSet,
    toggleSelectAllFolder,
    removeSet,
    clearAll,
    navigateToFolder,
    refreshSets: loadSets,
  };
}
