export type ExplorerSortOption = 'updatedAt' | 'name' | 'cardCount';

export interface ExplorerToolbarProps {
  /** Current search input query */
  searchQuery: string;
  /** Search query change callback */
  onSearchChange: (query: string) => void;
  /** Active sort key */
  sortBy: ExplorerSortOption;
  /** Sort change callback */
  onSortChange: (sort: ExplorerSortOption) => void;
  /** Current view layout mode */
  viewMode: 'grid' | 'list';
  /** View mode toggle callback */
  onViewModeChange: (mode: 'grid' | 'list') => void;
  /** Item metrics summary */
  itemSummary?: {
    folderCount: number;
    setCount: number;
    totalCards?: number;
  };
  /** Optional extra class name */
  className?: string;
}
