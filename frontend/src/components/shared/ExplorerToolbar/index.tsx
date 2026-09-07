import { LayoutGrid, List, Search, X } from 'lucide-react';
import type { ExplorerSortOption, ExplorerToolbarProps } from './types';
import { formatSummaryPill } from './utils';
import './style.scss';

export function ExplorerToolbar({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  itemSummary,
  className,
}: ExplorerToolbarProps) {
  const rootClassName = className ? `explorer-toolbar ${className}` : 'explorer-toolbar';

  return (
    <div className={rootClassName}>
      <div className="explorer-toolbar__left">
        <div className="explorer-toolbar__search-wrapper">
          <span className="explorer-toolbar__search-icon">
            <Search size={15} />
          </span>
          <input
            type="search"
            className="explorer-toolbar__search-input"
            placeholder="Filter items in this folder..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="explorer-toolbar__search-clear"
              onClick={() => onSearchChange('')}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="explorer-toolbar__right">
        {itemSummary && (
          <span className="explorer-toolbar__summary-pill">
            {formatSummaryPill(
              itemSummary.folderCount,
              itemSummary.setCount,
              itemSummary.totalCards
            )}
          </span>
        )}

        <select
          className="explorer-toolbar__sort-select"
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as ExplorerSortOption)}
          aria-label="Sort items"
        >
          <option value="updatedAt">Recently Updated</option>
          <option value="name">Name (A-Z)</option>
          <option value="cardCount">Most Cards</option>
        </select>

        <div className="explorer-toolbar__view-toggle" role="group" aria-label="View mode">
          <button
            type="button"
            className={`explorer-toolbar__toggle-btn ${viewMode === 'grid' ? 'explorer-toolbar__toggle-btn--active' : ''}`}
            onClick={() => onViewModeChange('grid')}
            title="Grid view"
            aria-label="Grid view"
          >
            <LayoutGrid size={16} />
          </button>
          <button
            type="button"
            className={`explorer-toolbar__toggle-btn ${viewMode === 'list' ? 'explorer-toolbar__toggle-btn--active' : ''}`}
            onClick={() => onViewModeChange('list')}
            title="List view"
            aria-label="List view"
          >
            <List size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export type { ExplorerSortOption, ExplorerToolbarProps } from './types';
