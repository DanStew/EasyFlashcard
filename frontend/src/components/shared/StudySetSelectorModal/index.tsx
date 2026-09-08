// ==========================================
// EasyFlashcard - StudySetSelectorModal
// ==========================================

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Check,
  ChevronRight,
  Folder as FolderIcon,
  Layers,
  Search,
  Shuffle,
  X,
} from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Modal } from '@/components/shared/Modal';
import { useWorkspace } from '@/hooks/useWorkspace';
import type { StudySetSelectorModalProps } from './types';
import { useStudySetSelector } from './useStudySetSelector';
import {
  areAllSetsSelected,
  buildFolderMap,
  buildSelectorBreadcrumbs,
  computeSelectedStats,
  getChildFolders,
  getSetsForFolder,
  searchSets,
} from './utils';
import './style.scss';

/**
 * Large modal dialog allowing learners to browse folders, search sets across
 * their library, select multiple flashcard decks, and launch combined study mode.
 */
export function StudySetSelectorModal({
  isOpen,
  onClose,
  initialFolderId,
}: StudySetSelectorModalProps) {
  const navigate = useNavigate();
  const { folderTree } = useWorkspace();

  const {
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
  } = useStudySetSelector(initialFolderId, isOpen);

  // Memoized directory structures and search results
  const folderMap = useMemo(() => buildFolderMap(folderTree), [folderTree]);
  const breadcrumbs = useMemo(
    () => buildSelectorBreadcrumbs(folderTree, currentFolderId),
    [folderTree, currentFolderId]
  );
  const childFolders = useMemo(
    () => getChildFolders(folderTree, currentFolderId),
    [folderTree, currentFolderId]
  );
  const folderSets = useMemo(
    () => getSetsForFolder(allSets, currentFolderId),
    [allSets, currentFolderId]
  );
  const searchResults = useMemo(
    () => searchSets(allSets, searchQuery, folderMap),
    [allSets, searchQuery, folderMap]
  );

  const { selectedSets, totalCards } = useMemo(
    () => computeSelectedStats(selectedSetIds, allSets),
    [selectedSetIds, allSets]
  );

  const isSearching = searchQuery.trim().length > 0;
  const allFolderSetsSelected = areAllSetsSelected(folderSets, selectedSetIds);

  const handleLaunchStudy = () => {
    if (selectedSetIds.length === 0 || totalCards === 0) return;
    onClose();
    const queryParams = new URLSearchParams();
    queryParams.set('sets', selectedSetIds.join(','));
    if (isShuffleEnabled) {
      queryParams.set('shuffle', 'true');
    }
    navigate(`/study?${queryParams.toString()}`);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="study-selector__modal-title">
          <BookOpen size={20} />
          <span>Study Mode · Select Flashcard Sets</span>
        </div>
      }
      subtitle="Pick one or multiple sets across your library to combine into a unified revision deck."
      size="xl"
      className="study-set-selector-modal"
    >
      <div className="study-selector">
        {/* Topbar: Library Search & Breadcrumb Explorer */}
        <div className="study-selector__topbar">
          <div className="study-selector__search-wrapper">
            <Search size={16} className="study-selector__search-icon" />
            <input
              type="text"
              className="study-selector__search-input"
              placeholder="Search sets across all folders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus={isOpen}
            />
            {isSearching && (
              <button
                type="button"
                className="study-selector__search-clear"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {!isSearching && (
            <nav className="study-selector__breadcrumbs" aria-label="Folder Navigation">
              {breadcrumbs.map((crumb, idx) => {
                const isLast = idx === breadcrumbs.length - 1;
                return (
                  <div key={crumb.id || 'root'} className="study-selector__breadcrumb-item">
                    {idx > 0 && (
                      <span className="study-selector__breadcrumb-sep">
                        <ChevronRight size={13} />
                      </span>
                    )}
                    <button
                      type="button"
                      className={`study-selector__breadcrumb-btn ${
                        isLast ? 'study-selector__breadcrumb-btn--active' : ''
                      }`}
                      onClick={() => navigateToFolder(crumb.id)}
                    >
                      {idx === 0 && <FolderIcon size={13} />}
                      <span>{crumb.name}</span>
                    </button>
                  </div>
                );
              })}
            </nav>
          )}
        </div>

        {/* Explorer Content Area */}
        <div className="study-selector__content">
          {isLoadingSets ? (
            <div className="study-selector__loading">
              <LoadingSpinner size="md" label="Loading flashcard sets..." />
            </div>
          ) : error ? (
            <EmptyState
              title="Failed to load sets"
              description={error}
              icon={<BookOpen size={36} />}
            />
          ) : isSearching ? (
            /* SEARCH RESULTS MODE */
            <div className="study-selector__search-results">
              <div className="study-selector__section-title">
                <span>Matching Sets ({searchResults.length})</span>
              </div>

              {searchResults.length === 0 ? (
                <EmptyState
                  title="No sets found"
                  description={`No flashcard sets matching "${searchQuery}".`}
                  icon={<Search size={36} />}
                />
              ) : (
                <div className="study-selector__sets-list">
                  {searchResults.map(({ set, folderPath }) => {
                    const isSelected = selectedSetIds.includes(set.id);
                    const isEmpty = set.cardCount === 0;

                    return (
                      <div
                        key={set.id}
                        className={`study-selector__set-row ${
                          isSelected ? 'study-selector__set-row--selected' : ''
                        } ${isEmpty ? 'study-selector__set-row--disabled' : ''}`}
                        onClick={() => !isEmpty && toggleSet(set.id)}
                        role="checkbox"
                        aria-checked={isSelected}
                        tabIndex={isEmpty ? -1 : 0}
                      >
                        <div
                          className={`study-selector__checkbox ${
                            isSelected ? 'study-selector__checkbox--checked' : ''
                          } ${isEmpty ? 'study-selector__checkbox--disabled' : ''}`}
                        >
                          {isSelected && <Check size={13} />}
                        </div>

                        <div className="study-selector__set-info">
                          <div className="study-selector__set-title-row">
                            <span className="study-selector__set-name">{set.name}</span>
                          </div>
                          <p className="study-selector__set-path">{folderPath}</p>
                        </div>

                        <div className="study-selector__set-meta">
                          <span
                            className={`study-selector__card-badge ${
                              isEmpty ? 'study-selector__card-badge--empty' : ''
                            }`}
                          >
                            {set.cardCount} {set.cardCount === 1 ? 'card' : 'cards'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* FOLDER EXPLORER DRILL-DOWN MODE */
            <>
              {/* Subfolders Grid */}
              {childFolders.length > 0 && (
                <section className="study-selector__folders-section">
                  <div className="study-selector__section-title">
                    <span>Folders ({childFolders.length})</span>
                  </div>
                  <div className="study-selector__folders-grid">
                    {childFolders.map((subfolder) => (
                      <button
                        type="button"
                        key={subfolder.id}
                        className="study-selector__folder-card"
                        onClick={() => navigateToFolder(subfolder.id)}
                      >
                        <div className="study-selector__folder-icon">
                          <FolderIcon size={18} />
                        </div>
                        <div className="study-selector__folder-details">
                          <h4 className="study-selector__folder-name">{subfolder.name}</h4>
                          <span className="study-selector__folder-count">
                            {subfolder.setCount} {subfolder.setCount === 1 ? 'set' : 'sets'}
                          </span>
                        </div>
                        <ChevronRight size={15} color="var(--text-tertiary)" />
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {/* Sets in Current Folder */}
              <section className="study-selector__sets-section">
                <div className="study-selector__sets-header">
                  <div className="study-selector__section-title study-selector__section-title--no-margin">
                    <span>Flashcard Sets ({folderSets.length})</span>
                  </div>

                  {folderSets.length > 0 && (
                    <button
                      type="button"
                      className="study-selector__select-all-btn"
                      onClick={() => toggleSelectAllFolder(folderSets)}
                    >
                      <span>
                        {allFolderSetsSelected
                          ? 'Deselect All in Folder'
                          : 'Select All in Folder'}
                      </span>
                    </button>
                  )}
                </div>

                {folderSets.length === 0 && childFolders.length === 0 ? (
                  <EmptyState
                    title="No sets in this folder"
                    description="This folder does not contain any flashcard sets yet."
                    icon={<Layers size={36} />}
                  />
                ) : folderSets.length === 0 ? (
                  <p className="study-selector__chips-empty study-selector__empty-folder-hint">
                    No sets directly in this folder. Explore subfolders above.
                  </p>
                ) : (
                  <div className="study-selector__sets-list">
                    {folderSets.map((set) => {
                      const isSelected = selectedSetIds.includes(set.id);
                      const isEmpty = set.cardCount === 0;

                      return (
                        <div
                          key={set.id}
                          className={`study-selector__set-row ${
                            isSelected ? 'study-selector__set-row--selected' : ''
                          } ${isEmpty ? 'study-selector__set-row--disabled' : ''}`}
                          onClick={() => !isEmpty && toggleSet(set.id)}
                          role="checkbox"
                          aria-checked={isSelected}
                          tabIndex={isEmpty ? -1 : 0}
                        >
                          <div
                            className={`study-selector__checkbox ${
                              isSelected ? 'study-selector__checkbox--checked' : ''
                            } ${isEmpty ? 'study-selector__checkbox--disabled' : ''}`}
                          >
                            {isSelected && <Check size={13} />}
                          </div>

                          <div className="study-selector__set-info">
                            <div className="study-selector__set-title-row">
                              <span className="study-selector__set-name">{set.name}</span>
                            </div>
                            {set.description && (
                              <p className="study-selector__set-path">{set.description}</p>
                            )}
                          </div>

                          <div className="study-selector__set-meta">
                            <span
                              className={`study-selector__card-badge ${
                                isEmpty ? 'study-selector__card-badge--empty' : ''
                              }`}
                            >
                              {set.cardCount} {set.cardCount === 1 ? 'card' : 'cards'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </>
          )}
        </div>

        {/* Persistent Bottom Selection Dock */}
        <footer className="study-selector__dock">
          {/* Selected Chips Strip */}
          <div className="study-selector__chips-row">
            {selectedSets.length === 0 ? (
              <span className="study-selector__chips-empty">
                No sets selected yet. Check sets above to add them to your study session.
              </span>
            ) : (
              selectedSets.map((set) => (
                <span key={set.id} className="study-selector__chip">
                  <span className="study-selector__chip-name" title={set.name}>
                    {set.name}
                  </span>
                  <span className="study-selector__chip-count">({set.cardCount})</span>
                  <button
                    type="button"
                    className="study-selector__chip-remove"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSet(set.id);
                    }}
                    title={`Remove ${set.name}`}
                    aria-label={`Remove ${set.name}`}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))
            )}
          </div>

          {/* Action Bar */}
          <div className="study-selector__actions-bar">
            <div className="study-selector__summary-text">
              <span className="study-selector__summary-title">
                {selectedSets.length === 0
                  ? '0 Sets Selected'
                  : `${selectedSets.length} ${
                      selectedSets.length === 1 ? 'Set' : 'Sets'
                    } Selected`}
              </span>
              <span className="study-selector__summary-subtitle">
                {totalCards} {totalCards === 1 ? 'card' : 'cards'} total
              </span>
            </div>

            <div className="study-selector__options-group">
              <label className="study-selector__shuffle-label">
                <input
                  type="checkbox"
                  checked={isShuffleEnabled}
                  onChange={(e) => setIsShuffleEnabled(e.target.checked)}
                />
                <Shuffle size={14} />
                <span>Shuffle across sets</span>
              </label>
            </div>

            <div className="study-selector__cta-group">
              {selectedSets.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearAll}>
                  Clear All
                </Button>
              )}

              <Button
                variant="gradient"
                size="md"
                leftIcon={<BookOpen size={16} />}
                disabled={selectedSets.length === 0 || totalCards === 0}
                onClick={handleLaunchStudy}
              >
                Start Study Session ({totalCards})
              </Button>
            </div>
          </div>
        </footer>
      </div>
    </Modal>
  );
}

export type { StudySetSelectorModalProps } from './types';
