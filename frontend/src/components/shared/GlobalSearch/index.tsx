import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Folder as FolderIcon,
  Layers,
  Loader2,
  Search,
  X,
} from 'lucide-react';
import { searchService, type GlobalSearchResult } from '@/services/searchService';
import type { GlobalSearchProps } from './types';
import {
  buildNavigableItemList,
  formatFolderDetails,
  formatSetMeta,
  getNextIndex,
} from './utils';
import './style.scss';

export function GlobalSearch({
  placeholder = 'Search sets and folders...',
  value: controlledValue,
  onChange,
  onNavigateToFullSearch,
  className = '',
}: GlobalSearchProps) {
  const navigate = useNavigate();
  const [internalQuery, setInternalQuery] = useState('');
  const query = controlledValue !== undefined ? controlledValue : internalQuery;

  const setQuery = useCallback(
    (newVal: string) => {
      if (controlledValue === undefined) {
        setInternalQuery(newVal);
      }
      onChange?.(newVal);
    },
    [controlledValue, onChange]
  );

  const [results, setResults] = useState<GlobalSearchResult>({
    folders: [],
    sets: [],
    totalCount: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Flat list of navigable items for keyboard traversal
  const navigableItems = useMemo(
    () => buildNavigableItemList(results.folders, results.sets, query),
    [results.folders, results.sets, query]
  );

  // Debounced search trigger
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults({ folders: [], sets: [], totalCount: 0 });
      setIsLoading(false);
      setActiveIndex(-1);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const data = await searchService.search(trimmed, 8);
        setResults(data);
        setActiveIndex(-1);
      } catch (err: unknown) {
        console.error('Failed to execute search', err);
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside to dismiss
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global hotkey listener (Ctrl+K / Cmd+K / Slash)
  useEffect(() => {
    const handleGlobalKeyDown = (e: globalThis.KeyboardEvent) => {
      const isInputActive =
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (e.key === '/' && !isInputActive) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setIsOpen(true);
  };

  const handleClear = () => {
    setQuery('');
    setResults({ folders: [], sets: [], totalCount: 0 });
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  const handleSelectFolder = useCallback(
    (folderId: string) => {
      setIsOpen(false);
      navigate(`/folder/${folderId}`);
    },
    [navigate]
  );

  const handleSelectSet = useCallback(
    (setId: string) => {
      setIsOpen(false);
      navigate(`/set/${setId}`);
    },
    [navigate]
  );

  const handleViewAll = useCallback(() => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setIsOpen(false);
    if (onNavigateToFullSearch) {
      onNavigateToFullSearch(trimmed);
    } else {
      navigate(`/?search=${encodeURIComponent(trimmed)}`);
    }
  }, [query, onNavigateToFullSearch, navigate]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || navigableItems.length === 0) {
      if (e.key === 'Enter' && query.trim()) {
        e.preventDefault();
        handleViewAll();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => getNextIndex(prev, navigableItems.length, 'down'));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => getNextIndex(prev, navigableItems.length, 'up'));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < navigableItems.length) {
        const item = navigableItems[activeIndex];
        if (item.type === 'folder') {
          handleSelectFolder(item.folder.id);
        } else if (item.type === 'set') {
          handleSelectSet(item.set.id);
        } else if (item.type === 'view_all') {
          handleViewAll();
        }
      } else if (query.trim()) {
        handleViewAll();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const hasResults = results.folders.length > 0 || results.sets.length > 0;
  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);
  const shortcutText = isMac ? '⌘K' : 'Ctrl+K';

  return (
    <div
      ref={containerRef}
      className={`global-search ${className}`}
      role="search"
    >
      <div className="global-search__input-container">
        <span className="global-search__search-icon" aria-hidden="true">
          <Search size={16} />
        </span>

        <input
          ref={inputRef}
          type="search"
          className="global-search__input"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          aria-label="Search sets and folders"
        />

        <div className="global-search__input-actions">
          {isLoading ? (
            <span className="global-search__loading-spinner" aria-label="Searching">
              <Loader2 size={14} />
            </span>
          ) : query ? (
            <button
              type="button"
              className="global-search__clear-btn"
              onClick={handleClear}
              aria-label="Clear search"
            >
              <X size={12} />
            </button>
          ) : (
            <span className="global-search__shortcut-badge" aria-hidden="true">
              {shortcutText}
            </span>
          )}
        </div>
      </div>

      {/* Floating Dropdown Results Popover */}
      {isOpen && query.trim() !== '' && (
        <div className="global-search__dropdown" role="listbox">
          {hasResults ? (
            <>
              {/* Folders Section */}
              {results.folders.length > 0 && (
                <div className="global-search__section">
                  <div className="global-search__section-header">
                    <span>Folders</span>
                    <span className="global-search__section-count">
                      {results.folders.length}
                    </span>
                  </div>

                  {results.folders.map((folder) => {
                    const itemIndex = navigableItems.findIndex(
                      (i) => i.type === 'folder' && i.folder.id === folder.id
                    );
                    const isActive = activeIndex === itemIndex;

                    return (
                      <button
                        key={folder.id}
                        type="button"
                        className={`global-search__item ${
                          isActive ? 'global-search__item--active' : ''
                        }`}
                        onClick={() => handleSelectFolder(folder.id)}
                        onMouseEnter={() => setActiveIndex(itemIndex)}
                      >
                        <div className="global-search__item-icon global-search__item-icon--folder">
                          <FolderIcon size={16} />
                        </div>
                        <div className="global-search__item-content">
                          <span className="global-search__item-title">
                            {folder.name}
                          </span>
                          <span className="global-search__item-details">
                            {formatFolderDetails(folder)}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Sets Section */}
              {results.sets.length > 0 && (
                <div className="global-search__section">
                  <div className="global-search__section-header">
                    <span>Flashcard Sets</span>
                    <span className="global-search__section-count">
                      {results.sets.length}
                    </span>
                  </div>

                  {results.sets.map((set) => {
                    const itemIndex = navigableItems.findIndex(
                      (i) => i.type === 'set' && i.set.id === set.id
                    );
                    const isActive = activeIndex === itemIndex;

                    return (
                      <button
                        key={set.id}
                        type="button"
                        className={`global-search__item ${
                          isActive ? 'global-search__item--active' : ''
                        }`}
                        onClick={() => handleSelectSet(set.id)}
                        onMouseEnter={() => setActiveIndex(itemIndex)}
                      >
                        <div className="global-search__item-icon global-search__item-icon--set">
                          <Layers size={16} />
                        </div>
                        <div className="global-search__item-content">
                          <span className="global-search__item-title">
                            {set.name}
                          </span>
                          <span className="global-search__item-details">
                            {formatSetMeta(set)}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* View All Results Button */}
              {(() => {
                const viewAllIndex = navigableItems.findIndex(
                  (i) => i.type === 'view_all'
                );
                const isActive = activeIndex === viewAllIndex;

                return (
                  <button
                    type="button"
                    className={`global-search__view-all ${
                      isActive ? 'global-search__view-all--active' : ''
                    }`}
                    onClick={handleViewAll}
                    onMouseEnter={() => setActiveIndex(viewAllIndex)}
                  >
                    <span>View all results for "{query.trim()}" in Library</span>
                    <ArrowRight size={14} />
                  </button>
                );
              })()}

              {/* Keyboard navigation hints */}
              <div className="global-search__footer">
                <div className="global-search__footer-hints">
                  <span>
                    <kbd>↑</kbd> <kbd>↓</kbd> navigate
                  </span>
                  <span>
                    <kbd>↵</kbd> select
                  </span>
                  <span>
                    <kbd>esc</kbd> close
                  </span>
                </div>
              </div>
            </>
          ) : (
            !isLoading && (
              <div className="global-search__empty">
                <p>No sets or folders found for "{query.trim()}"</p>
                <span>Try searching with a different name or keyword.</span>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

export type { GlobalSearchProps } from './types';
