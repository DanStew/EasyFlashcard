// ==========================================
// DriveFileExplorer - Presentation Component
// ==========================================

import { useState } from 'react';
import {
  Folder,
  FolderPlus,
  Grid,
  HardDrive,
  LayoutList,
  Loader2,
  Search,
  UploadCloud,
} from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { DriveFileCard } from '@/components/shared/DriveFileCard';
import { DriveFolderCard } from '@/components/shared/DriveFolderCard';
import { Input } from '@/components/shared/Input';
import type { DriveFileExplorerProps, ViewMode } from './types';
import { filterDriveItems } from './utils';
import './style.scss';

export function DriveFileExplorer({
  contents,
  isLoading,
  onNavigateFolder,
  onOpenDocument,
  onUploadClick,
  onNewFolderClick,
  onMoveItemClick,
  onTrashItemClick,
  onGenerateFlashcardsClick,
}: DriveFileExplorerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  if (isLoading && !contents) {
    return (
      <div className="drive-explorer">
        <div className="drive-explorer__loading">
          <Loader2 size={36} className="drive-explorer__loading-icon" />
          <p className="drive-explorer__loading-text">Loading Google Drive documents...</p>
        </div>
      </div>
    );
  }

  const subfolders = contents?.subfolders || [];
  const files = contents?.files || [];
  const breadcrumbs = contents?.breadcrumbs || [];

  const { filteredFolders, filteredFiles } = filterDriveItems(subfolders, files, searchQuery);
  const isEmpty = filteredFolders.length === 0 && filteredFiles.length === 0;

  return (
    <div className="drive-explorer">
      {/* Explorer Top Toolbar */}
      <div className="drive-explorer__toolbar">
        <div className="drive-explorer__toolbar-left">
          <div className="drive-explorer__breadcrumbs">
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              const isRoot = idx === 0;

              return (
                <span key={crumb.id} className="drive-explorer__crumb-group">
                  <button
                    type="button"
                    className={`drive-explorer__crumb-btn ${
                      isLast ? 'drive-explorer__crumb-btn--active' : ''
                    }`}
                    onClick={() => onNavigateFolder(crumb.id)}
                    title={`Go to ${crumb.name}`}
                  >
                    {isRoot ? <HardDrive size={14} /> : <Folder size={14} />}
                    <span>{crumb.name}</span>
                  </button>
                  {!isLast && <span className="drive-explorer__crumb-sep">/</span>}
                </span>
              );
            })}
          </div>
        </div>

        <div className="drive-explorer__toolbar-right">
          <div className="drive-explorer__search-wrapper">
            <Input
              placeholder="Search files and folders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search size={15} />}
              fullWidth
            />
          </div>

          <div className="drive-explorer__view-toggle">
            <button
              type="button"
              className={`drive-explorer__view-btn ${
                viewMode === 'grid' ? 'drive-explorer__view-btn--active' : ''
              }`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
              aria-label="Grid View"
            >
              <Grid size={16} />
            </button>
            <button
              type="button"
              className={`drive-explorer__view-btn ${
                viewMode === 'list' ? 'drive-explorer__view-btn--active' : ''
              }`}
              onClick={() => setViewMode('list')}
              title="List View"
              aria-label="List View"
            >
              <LayoutList size={16} />
            </button>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={onNewFolderClick}
            leftIcon={<FolderPlus size={15} />}
          >
            New Folder
          </Button>

          <Button
            variant="gradient"
            size="sm"
            onClick={onUploadClick}
            leftIcon={<UploadCloud size={15} />}
          >
            Upload File
          </Button>
        </div>
      </div>

      {/* Explorer Content State */}
      {isEmpty ? (
        <div className="drive-explorer__empty">
          <div className="drive-explorer__empty-icon">
            <UploadCloud size={32} />
          </div>
          <h3 className="drive-explorer__empty-title">
            {searchQuery ? 'No matching items found' : 'This folder is empty'}
          </h3>
          <p className="drive-explorer__empty-desc">
            {searchQuery
              ? `No files or subfolders matched "${searchQuery}". Try a different search query.`
              : 'Upload lecture slides, notes, or study PDFs directly to your Google Drive to build your flashcard library.'}
          </p>
          <div className="drive-explorer__empty-actions">
            <Button
              variant="gradient"
              size="md"
              onClick={onUploadClick}
              leftIcon={<UploadCloud size={16} />}
            >
              Upload Document
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={onNewFolderClick}
              leftIcon={<FolderPlus size={16} />}
            >
              New Subfolder
            </Button>
          </div>
        </div>
      ) : viewMode === 'list' ? (
        /* Unified List View */
        <div className="drive-explorer__list-container">
          {filteredFolders.length > 0 && (
            <>
              <div className="drive-explorer__list-category-title">
                Folders ({filteredFolders.length})
              </div>
              {filteredFolders.map((folder) => (
                <DriveFolderCard
                  key={folder.id}
                  folder={folder}
                  viewMode="list"
                  onClick={() => onNavigateFolder(folder.id)}
                  onMove={() =>
                    onMoveItemClick({ id: folder.id, name: folder.name, isFolder: true })
                  }
                  onTrash={() =>
                    onTrashItemClick({ id: folder.id, name: folder.name, isFolder: true })
                  }
                />
              ))}
            </>
          )}

          {filteredFiles.length > 0 && (
            <>
              <div className="drive-explorer__list-category-title">
                Documents & Files ({filteredFiles.length})
              </div>
              {filteredFiles.map((doc) => (
                <DriveFileCard
                  key={doc.id}
                  document={doc}
                  viewMode="list"
                  onClick={() => onOpenDocument(doc)}
                  onGenerateFlashcards={
                    onGenerateFlashcardsClick
                      ? () => onGenerateFlashcardsClick(doc)
                      : undefined
                  }
                  onMove={() =>
                    onMoveItemClick({ id: doc.driveFileId, name: doc.name, isFolder: false })
                  }
                  onTrash={() =>
                    onTrashItemClick({ id: doc.driveFileId, name: doc.name, isFolder: false })
                  }
                />
              ))}
            </>
          )}
        </div>
      ) : (
        /* Unified Grid View */
        <>
          {/* Folders Subsection */}
          {filteredFolders.length > 0 && (
            <section className="drive-explorer__section">
              <div className="drive-explorer__section-header">
                <h3 className="drive-explorer__section-title">
                  <span>Folders</span>
                  <span className="drive-explorer__section-count">
                    {filteredFolders.length}
                  </span>
                </h3>
              </div>

              <div className="drive-explorer__folders-grid">
                {filteredFolders.map((folder) => (
                  <DriveFolderCard
                    key={folder.id}
                    folder={folder}
                    viewMode="grid"
                    onClick={() => onNavigateFolder(folder.id)}
                    onMove={() =>
                      onMoveItemClick({ id: folder.id, name: folder.name, isFolder: true })
                    }
                    onTrash={() =>
                      onTrashItemClick({ id: folder.id, name: folder.name, isFolder: true })
                    }
                  />
                ))}
              </div>
            </section>
          )}

          {/* Files Subsection */}
          {filteredFiles.length > 0 && (
            <section className="drive-explorer__section">
              <div className="drive-explorer__section-header">
                <h3 className="drive-explorer__section-title">
                  <span>Documents & Files</span>
                  <span className="drive-explorer__section-count">
                    {filteredFiles.length}
                  </span>
                </h3>
              </div>

              <div className="drive-explorer__files-grid">
                {filteredFiles.map((doc) => (
                  <DriveFileCard
                    key={doc.id}
                    document={doc}
                    viewMode="grid"
                    onClick={() => onOpenDocument(doc)}
                    onGenerateFlashcards={
                      onGenerateFlashcardsClick
                        ? () => onGenerateFlashcardsClick(doc)
                        : undefined
                    }
                    onMove={() =>
                      onMoveItemClick({ id: doc.driveFileId, name: doc.name, isFolder: false })
                    }
                    onTrash={() =>
                      onTrashItemClick({ id: doc.driveFileId, name: doc.name, isFolder: false })
                    }
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

export type { DriveFileExplorerProps } from './types';
