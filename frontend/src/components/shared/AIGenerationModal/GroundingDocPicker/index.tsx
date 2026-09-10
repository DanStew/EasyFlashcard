// ==========================================
// GroundingDocPicker Component
// ==========================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  Folder,
  FileText,
  Check,
  X,
  ChevronRight,
  Search,
  HardDrive,
  RefreshCw,
  AlertCircle,
  FileSpreadsheet,
  FileCode,
  Image as ImageIcon,
} from 'lucide-react';
import { documentService } from '@/services/documentService';
import type { DriveFolderItem } from '@/types/document';
import type { GroundingDocPickerProps, FolderBrowseState } from './types';
import { filterItems, formatFileSize, getDocTypeLabel } from './utils';
import './style.scss';

export const GroundingDocPicker: React.FC<GroundingDocPickerProps> = ({
  selectedDocs,
  onToggleDoc,
  onRemoveDoc,
  onClearAll,
  disabled = false,
}) => {
  const [browseState, setBrowseState] = useState<FolderBrowseState>({
    currentFolder: null,
    breadcrumbs: [],
    subfolders: [],
    files: [],
    isLoading: true,
    error: null,
  });
  const [searchQuery, setSearchQuery] = useState('');

  const loadFolderContents = useCallback(async (folderId?: string) => {
    setBrowseState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await documentService.getDriveFolderContents(folderId);
      setBrowseState({
        currentFolder: data.currentFolder,
        breadcrumbs: data.breadcrumbs || [],
        subfolders: data.subfolders || [],
        files: data.files || [],
        isLoading: false,
        error: null,
      });
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to load Google Drive folder contents.';
      setBrowseState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    }
  }, []);

  useEffect(() => {
    loadFolderContents();
  }, [loadFolderContents]);

  const handleFolderClick = (folder: DriveFolderItem) => {
    setSearchQuery('');
    loadFolderContents(folder.id);
  };

  const handleBreadcrumbClick = (folderId: string) => {
    setSearchQuery('');
    loadFolderContents(folderId);
  };

  const { filteredFolders, filteredFiles } = filterItems(
    browseState.subfolders,
    browseState.files,
    searchQuery
  );

  const isDocSelected = (docId: string): boolean => {
    return selectedDocs.some((d) => d.id === docId);
  };

  const renderDocIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return <FileText size={16} className="grounding-doc-picker__type-icon" />;
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return <FileSpreadsheet size={16} className="grounding-doc-picker__type-icon" />;
    if (mimeType.includes('image')) return <ImageIcon size={16} className="grounding-doc-picker__type-icon" />;
    return <FileCode size={16} className="grounding-doc-picker__type-icon" />;
  };

  return (
    <div className="grounding-doc-picker">
      {/* Attached Grounding Documents Shelf */}
      {selectedDocs.length > 0 && (
        <div className="grounding-doc-picker__selected-shelf">
          <div className="grounding-doc-picker__selected-header">
            <span className="grounding-doc-picker__selected-title">
              <FileText size={13} />
              Attached Grounding Docs ({selectedDocs.length})
            </span>
            <button
              type="button"
              className="grounding-doc-picker__clear-btn"
              onClick={onClearAll}
              disabled={disabled}
            >
              Clear All
            </button>
          </div>
          <div className="grounding-doc-picker__selected-chips">
            {selectedDocs.map((doc) => (
              <div key={doc.id} className="grounding-doc-picker__selected-chip">
                <span className="grounding-doc-picker__chip-name" title={doc.name}>
                  {doc.name}
                </span>
                <button
                  type="button"
                  className="grounding-doc-picker__chip-remove"
                  onClick={() => onRemoveDoc(doc.id)}
                  disabled={disabled}
                  title="Remove document"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation Toolbar */}
      <div className="grounding-doc-picker__nav-bar">
        <div className="grounding-doc-picker__breadcrumbs">
          <button
            type="button"
            className={`grounding-doc-picker__crumb-btn ${
              browseState.breadcrumbs.length <= 1
                ? 'grounding-doc-picker__crumb-btn--active'
                : ''
            }`}
            onClick={() => loadFolderContents()}
            disabled={disabled || browseState.isLoading}
          >
            <HardDrive size={13} />
            Root
          </button>
          {browseState.breadcrumbs.slice(1).map((crumb, idx) => {
            const isLast = idx === browseState.breadcrumbs.length - 2;
            return (
              <React.Fragment key={crumb.id}>
                <ChevronRight size={12} className="grounding-doc-picker__crumb-sep" />
                <button
                  type="button"
                  className={`grounding-doc-picker__crumb-btn ${
                    isLast ? 'grounding-doc-picker__crumb-btn--active' : ''
                  }`}
                  onClick={() => handleBreadcrumbClick(crumb.id)}
                  disabled={disabled || browseState.isLoading}
                >
                  {crumb.name}
                </button>
              </React.Fragment>
            );
          })}
        </div>

        <div className="grounding-doc-picker__search-box">
          <input
            type="text"
            className="input grounding-doc-picker__search-input"
            placeholder="Filter files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={disabled}
          />
        </div>
      </div>

      {/* Explorer Browser Area */}
      <div className="grounding-doc-picker__browser-area">
        {browseState.isLoading ? (
          <div className="grounding-doc-picker__loading-box">
            <RefreshCw size={18} className="spinner" />
            <span>Loading Google Drive documents...</span>
          </div>
        ) : browseState.error ? (
          <div className="grounding-doc-picker__empty-box">
            <AlertCircle size={20} color="var(--color-danger, #ef4444)" />
            <p className="grounding-doc-picker__empty-title">Error Loading Drive</p>
            <p className="grounding-doc-picker__empty-desc">{browseState.error}</p>
          </div>
        ) : (
          <>
            {/* Subfolder list */}
            {filteredFolders.length > 0 && (
              <div className="grounding-doc-picker__folder-row">
                {filteredFolders.map((folder) => (
                  <button
                    key={folder.id}
                    type="button"
                    className="grounding-doc-picker__folder-btn"
                    onClick={() => handleFolderClick(folder)}
                    disabled={disabled}
                  >
                    <Folder size={14} className="grounding-doc-picker__folder-icon" />
                    <span>{folder.name}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Files list */}
            {filteredFiles.length > 0 ? (
              <div className="grounding-doc-picker__files-list">
                {filteredFiles.map((doc) => {
                  const selected = isDocSelected(doc.id);
                  return (
                    <button
                      key={doc.id}
                      type="button"
                      className={`grounding-doc-picker__file-item ${
                        selected ? 'grounding-doc-picker__file-item--selected' : ''
                      }`}
                      onClick={() => onToggleDoc(doc)}
                      disabled={disabled}
                    >
                      <div className="grounding-doc-picker__file-left">
                        <div
                          className={`grounding-doc-picker__file-checkbox ${
                            selected
                              ? 'grounding-doc-picker__file-checkbox--checked'
                              : ''
                          }`}
                        >
                          {selected && <Check size={12} strokeWidth={3} />}
                        </div>
                        {renderDocIcon(doc.mimeType)}
                        <div className="grounding-doc-picker__file-info">
                          <span className="grounding-doc-picker__file-title" title={doc.name}>
                            {doc.name}
                          </span>
                          {doc.sizeBytes ? (
                            <span className="grounding-doc-picker__file-size">
                              {formatFileSize(doc.sizeBytes)}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <span className="grounding-doc-picker__file-type-badge">
                        {getDocTypeLabel(doc.mimeType, doc.name)}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : filteredFolders.length === 0 ? (
              <div className="grounding-doc-picker__empty-box">
                {searchQuery ? (
                  <>
                    <Search size={20} color="var(--text-tertiary)" />
                    <p className="grounding-doc-picker__empty-title">No Matching Documents</p>
                    <p className="grounding-doc-picker__empty-desc">
                      No documents or subfolders in this directory match "{searchQuery}".
                    </p>
                  </>
                ) : (
                  <>
                    <HardDrive size={20} color="var(--text-tertiary)" />
                    <p className="grounding-doc-picker__empty-title">No Documents in this Folder</p>
                    <p className="grounding-doc-picker__empty-desc">
                      Upload documents to this folder in EasyFlashcard or Google Drive to use them as grounding context.
                    </p>
                  </>
                )}
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
};
