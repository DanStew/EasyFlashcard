import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Edit2,
  Folder as FolderIcon,
  FolderPlus,
  Layers,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { Button } from '@/components/shared/Button';
import { EmptyState } from '@/components/shared/EmptyState';
import { ExplorerToolbar, type ExplorerSortOption } from '@/components/shared/ExplorerToolbar';
import { FolderCard } from '@/components/shared/FolderCard';
import { Input } from '@/components/shared/Input';
import { Modal } from '@/components/shared/Modal';
import { SetCard } from '@/components/shared/SetCard';
import { Skeleton } from '@/components/shared/Skeleton';
import { useToast } from '@/hooks/useToast';
import { useWorkspace } from '@/hooks/useWorkspace';
import { ApiError } from '@/services/apiClient';
import { folderService } from '@/services/folderService';
import { setService } from '@/services/setService';
import type { Folder } from '@/types/folder';
import type { SetModel } from '@/types/set';
import { NotFoundView } from '@/views/NotFoundView';
import type { FolderExplorerViewProps } from './types';
import {
  filterAndSortExplorerItems,
  findParentFolderInfo,
  resolveFolderStats,
} from './utils';
import './style.scss';

export function FolderExplorerView({ folderId: propFolderId }: FolderExplorerViewProps) {
  const params = useParams<{ folderId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchParam = searchParams.get('search')?.trim() || '';
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const {
    folderTree,
    refreshFolderTree,
    setActiveFolderId,
    getBreadcrumbsForFolder,
    openStudyModal,
  } = useWorkspace();

  const activeFolderId = propFolderId || params.folderId || null;

  const [currentFolder, setCurrentFolder] = useState<Folder | null>(null);
  const [subfolders, setSubfolders] = useState<Folder[]>([]);
  const [sets, setSets] = useState<SetModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);

  // Search, Sort, and View layout state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<ExplorerSortOption>('updatedAt');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Modal states
  const [isNewSubfolderOpen, setIsNewSubfolderOpen] = useState(false);
  const [targetParentFolder, setTargetParentFolder] = useState<Folder | null>(null);
  const [subfolderName, setSubfolderName] = useState('');
  const [isCreatingSubfolder, setIsCreatingSubfolder] = useState(false);

  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [folderToRename, setFolderToRename] = useState<Folder | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState<Folder | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync active folder ID with WorkspaceContext for sidebar highlight
  useEffect(() => {
    setActiveFolderId(activeFolderId);
    return () => setActiveFolderId(null);
  }, [activeFolderId, setActiveFolderId]);

  const loadFolderData = useCallback(async () => {
    try {
      setIsLoading(true);
      setIsNotFound(false);
      if (searchParam) {
        // Global search mode across whole library
        const [matchingFolders, matchingSets] = await Promise.all([
          folderService.listFolders(null, false, searchParam),
          setService.listSets({ search: searchParam }),
        ]);
        setCurrentFolder(null);
        setSubfolders(matchingFolders);
        setSets(matchingSets);
      } else if (activeFolderId) {
        const [folder, children, folderSets] = await Promise.all([
          folderService.getFolder(activeFolderId),
          folderService.listFolders(activeFolderId),
          setService.listSets({ folderId: activeFolderId }),
        ]);
        setCurrentFolder(folder);
        setRenameValue(folder.name);
        setSubfolders(children);
        setSets(folderSets);
      } else {
        // Root / Library mode: fetch root-level folders and root-level sets only
        const [rootFolders, rootSets] = await Promise.all([
          folderService.listFolders(null, true),
          setService.listSets({ rootOnly: true }),
        ]);
        setCurrentFolder(null);
        setSubfolders(rootFolders);
        setSets(rootSets);
      }
    } catch (err: unknown) {
      if (err instanceof ApiError && err.isNotFound) {
        setIsNotFound(true);
      } else {
        showError(err instanceof Error ? err.message : 'Failed to load folder contents');
      }
    } finally {
      setIsLoading(false);
    }
  }, [activeFolderId, searchParam, showError]);

  useEffect(() => {
    loadFolderData();
  }, [loadFolderData]);

  // Compute breadcrumbs and parent info
  const breadcrumbs = searchParam
    ? [
        { id: 'root', label: 'Library', href: '/' },
        { id: 'search', label: `Search: "${searchParam}"`, href: `/?search=${encodeURIComponent(searchParam)}` },
      ]
    : getBreadcrumbsForFolder(activeFolderId, currentFolder);
  const parentInfo = findParentFolderInfo(folderTree, currentFolder);

  // Subfolder modal handlers
  const handleOpenCreateSubfolder = (targetFolder?: Folder) => {
    setTargetParentFolder(targetFolder || null);
    setSubfolderName('');
    setIsNewSubfolderOpen(true);
  };

  const handleCloseCreateSubfolder = () => {
    setIsNewSubfolderOpen(false);
    setTargetParentFolder(null);
    setSubfolderName('');
  };

  const handleCreateSubfolder = async (e: FormEvent) => {
    e.preventDefault();
    if (!subfolderName.trim()) return;

    const parentId = targetParentFolder ? targetParentFolder.id : activeFolderId;
    try {
      setIsCreatingSubfolder(true);
      const created = await folderService.createFolder({
        name: subfolderName.trim(),
        parentId,
      });
      showSuccess(`Folder "${created.name}" created!`);
      handleCloseCreateSubfolder();
      refreshFolderTree();
      loadFolderData();
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Failed to create folder');
    } finally {
      setIsCreatingSubfolder(false);
    }
  };

  // Rename modal handlers
  const handleOpenRename = (folder?: Folder) => {
    const target = folder || currentFolder;
    if (!target) return;
    setFolderToRename(target);
    setRenameValue(target.name);
    setIsRenameOpen(true);
  };

  const handleCloseRename = () => {
    setIsRenameOpen(false);
    setFolderToRename(null);
    setRenameValue('');
  };

  const handleRename = async (e: FormEvent) => {
    e.preventDefault();
    const target = folderToRename || currentFolder;
    if (!target || !renameValue.trim()) return;

    try {
      setIsRenaming(true);
      const updated = await folderService.updateFolder(target.id, {
        name: renameValue.trim(),
      });
      showSuccess(`Renamed to "${updated.name}"`);
      if (target.id === activeFolderId) {
        setCurrentFolder(updated);
      }
      handleCloseRename();
      refreshFolderTree();
      loadFolderData();
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Failed to rename folder');
    } finally {
      setIsRenaming(false);
    }
  };

  // Delete modal handlers
  const handleOpenDelete = (folder?: Folder) => {
    const target = folder || currentFolder;
    if (!target) return;
    setFolderToDelete(target);
    setIsDeleteOpen(true);
  };

  const handleCloseDelete = () => {
    setIsDeleteOpen(false);
    setFolderToDelete(null);
  };

  const handleDelete = async () => {
    const target = folderToDelete || currentFolder;
    if (!target) return;

    const isCurrentActiveFolder = target.id === activeFolderId;

    try {
      setIsDeleting(true);
      await folderService.deleteFolder(target.id, false);
      showSuccess(`Folder "${target.name}" deleted`);
      handleCloseDelete();
      refreshFolderTree();
      if (isCurrentActiveFolder) {
        if (parentInfo?.id) {
          navigate(`/folder/${parentInfo.id}`);
        } else {
          navigate('/');
        }
      } else {
        loadFolderData();
      }
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Failed to delete folder');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteSet = async (setToDel: SetModel) => {
    try {
      await setService.deleteSet(setToDel.id);
      showSuccess(`Set "${setToDel.name}" deleted`);
      loadFolderData();
      refreshFolderTree();
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Failed to delete set');
    }
  };

  // Filtered and sorted items
  const { folders: displayedFolders, sets: displayedSets, totalCards } = filterAndSortExplorerItems(
    subfolders,
    sets,
    searchQuery,
    sortBy
  );

  const isEmpty = !isLoading && subfolders.length === 0 && sets.length === 0;

  if (isNotFound) {
    return <NotFoundView entityType="folder" />;
  }

  return (
    <div className="folder-explorer-view animate-fade-in">
      {/* Interactive Breadcrumbs Trail */}
      <div className="folder-explorer-view__breadcrumbs-bar">
        <Breadcrumbs items={breadcrumbs} />
      </div>

      {/* Directory Header with Quick Actions */}
      <header className="folder-explorer-view__header">
        <div className="folder-explorer-view__title-group">
          {activeFolderId && (
            <button
              type="button"
              className="folder-explorer-view__up-btn"
              onClick={() => {
                if (parentInfo?.id) {
                  navigate(`/folder/${parentInfo.id}`);
                } else {
                  navigate('/');
                }
              }}
              title={parentInfo?.name ? `Up to ${parentInfo.name}` : 'Up to Library'}
              aria-label="Up one folder level"
            >
              <ArrowLeft size={18} />
            </button>
          )}

          <div className="folder-explorer-view__folder-icon">
            {activeFolderId ? <FolderIcon size={24} /> : <Sparkles size={22} />}
          </div>

          <div className="folder-explorer-view__title-info">
            <div className="folder-explorer-view__title-row">
              <h1 className="folder-explorer-view__title">
                {isLoading ? (
                  <Skeleton variant="text" width="220px" />
                ) : searchParam ? (
                  `Search: "${searchParam}"`
                ) : (
                  currentFolder?.name || 'My Library'
                )}
              </h1>
              {searchParam ? (
                <span className="folder-explorer-view__path-badge">Whole Library</span>
              ) : currentFolder?.path ? (
                <span className="folder-explorer-view__path-badge">{currentFolder.path}</span>
              ) : null}
            </div>

            <div className="folder-explorer-view__subtitle">
              {searchParam ? (
                <span>
                  Found {displayedFolders.length} {displayedFolders.length === 1 ? 'folder' : 'folders'} and {displayedSets.length} {displayedSets.length === 1 ? 'set' : 'sets'}
                </span>
              ) : activeFolderId ? (
                <span>
                  {subfolders.length} {subfolders.length === 1 ? 'subfolder' : 'subfolders'} ·{' '}
                  {sets.length} {sets.length === 1 ? 'set' : 'sets'}
                </span>
              ) : (
                <span>Unified flashcard workspace</span>
              )}
            </div>
          </div>
        </div>

        <div className="folder-explorer-view__actions">
          {searchParam && (
            <Button
              variant="outline"
              size="md"
              leftIcon={<ArrowLeft size={16} />}
              onClick={() => {
                setSearchParams({});
                navigate('/');
              }}
            >
              Clear Search
            </Button>
          )}

          {displayedSets.length > 0 && (
            <Button
              variant="outline"
              size="md"
              leftIcon={<BookOpen size={16} />}
              onClick={() => openStudyModal(activeFolderId)}
              title="Study sets in this folder"
            >
              {activeFolderId ? 'Study Folder' : 'Study Sets'}
            </Button>
          )}

          <Button
            variant="gradient"
            size="md"
            leftIcon={<Plus size={16} />}
            onClick={() =>
              navigate(activeFolderId ? `/create-set?folderId=${activeFolderId}` : '/create-set')
            }
          >
            {activeFolderId ? 'Create Set in Folder' : 'New Flashcard Set'}
          </Button>

          <Button
            variant="secondary"
            size="md"
            leftIcon={<FolderPlus size={16} />}
            onClick={() => handleOpenCreateSubfolder()}
          >
            {activeFolderId ? 'New Subfolder' : 'New Folder'}
          </Button>

          {activeFolderId && (
            <>
              <Button
                variant="ghost"
                size="md"
                leftIcon={<Edit2 size={15} />}
                onClick={() => handleOpenRename()}
              >
                Rename
              </Button>
              <Button
                variant="danger"
                size="md"
                leftIcon={<Trash2 size={15} />}
                onClick={() => handleOpenDelete()}
              >
                Delete
              </Button>
            </>
          )}
        </div>
      </header>

      {/* Explorer Search, Sort, and View Controls */}
      <ExplorerToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortBy={sortBy}
        onSortChange={setSortBy}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        itemSummary={{
          folderCount: displayedFolders.length,
          setCount: displayedSets.length,
          totalCards,
        }}
      />

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="folder-explorer-view__sets-grid">
          <Skeleton variant="card" count={4} />
        </div>
      ) : isEmpty ? (
        /* Unified Empty State */
        <EmptyState
          icon={<Layers size={36} />}
          title={
            activeFolderId
              ? `"${currentFolder?.name}" is empty`
              : 'Your Flashcard Library is empty'
          }
          description="Create your first flashcard set or organize your revision material with folders."
          action={
            <div className="folder-explorer-view__empty-actions">
              <Button
                variant="gradient"
                size="md"
                leftIcon={<Plus size={16} />}
                onClick={() =>
                  navigate(activeFolderId ? `/create-set?folderId=${activeFolderId}` : '/create-set')
                }
              >
                Create Flashcard Set
              </Button>
              <Button
                variant="secondary"
                size="md"
                leftIcon={<FolderPlus size={16} />}
                onClick={() => handleOpenCreateSubfolder()}
              >
                {activeFolderId ? 'New Subfolder' : 'New Folder'}
              </Button>
            </div>
          }
        />
      ) : viewMode === 'list' ? (
        /* Unified File-System List View */
        <div className="folder-explorer-view__list-container">
          {displayedFolders.length > 0 && (
            <>
              <div className="folder-explorer-view__list-category-title">
                Folders ({displayedFolders.length})
              </div>
              {displayedFolders.map((folder) => {
                const stats = resolveFolderStats(folder, folderTree);
                return (
                  <FolderCard
                    key={folder.id}
                    folder={folder}
                    subfolderCount={stats.subfolderCount}
                    setCount={stats.setCount}
                    previewItems={stats.previewItems}
                    viewMode="list"
                    onClick={() => navigate(`/folder/${folder.id}`)}
                    onCreateSubfolder={handleOpenCreateSubfolder}
                    onRename={handleOpenRename}
                    onDelete={handleOpenDelete}
                  />
                );
              })}
            </>
          )}

          {displayedSets.length > 0 && (
            <>
              <div className="folder-explorer-view__list-category-title">
                Flashcard Sets ({displayedSets.length})
              </div>
              {displayedSets.map((set) => (
                <SetCard
                  key={set.id}
                  set={set}
                  viewMode="list"
                  onView={() => navigate(`/set/${set.id}`)}
                  onStudy={() => navigate(`/study?sets=${set.id}`)}
                  onEdit={() => navigate(`/set/${set.id}/edit`)}
                  onDelete={() => handleDeleteSet(set)}
                />
              ))}
            </>
          )}
        </div>
      ) : (
        /* Unified File-System Grid View */
        <>
          {/* Folders Subsection */}
          {displayedFolders.length > 0 && (
            <section className="folder-explorer-view__section">
              <div className="folder-explorer-view__section-header">
                <h2 className="folder-explorer-view__section-title">
                  <span>Folders</span>
                  <span className="folder-explorer-view__section-count">
                    {displayedFolders.length}
                  </span>
                </h2>
              </div>

              <div className="folder-explorer-view__subfolders-grid">
                {displayedFolders.map((folder) => {
                  const stats = resolveFolderStats(folder, folderTree);
                  return (
                    <FolderCard
                      key={folder.id}
                      folder={folder}
                      subfolderCount={stats.subfolderCount}
                      setCount={stats.setCount}
                      previewItems={stats.previewItems}
                      viewMode="grid"
                      onClick={() => navigate(`/folder/${folder.id}`)}
                      onCreateSubfolder={handleOpenCreateSubfolder}
                      onRename={handleOpenRename}
                      onDelete={handleOpenDelete}
                    />
                  );
                })}
              </div>
            </section>
          )}

          {/* Flashcard Sets Subsection */}
          {displayedSets.length > 0 && (
            <section className="folder-explorer-view__section">
              <div className="folder-explorer-view__section-header">
                <h2 className="folder-explorer-view__section-title">
                  <span>Flashcard Sets</span>
                  <span className="folder-explorer-view__section-count">
                    {displayedSets.length}
                  </span>
                </h2>
              </div>

              <div className="folder-explorer-view__sets-grid">
                {displayedSets.map((set) => (
                  <SetCard
                    key={set.id}
                    set={set}
                    viewMode="grid"
                    onView={() => navigate(`/set/${set.id}`)}
                    onStudy={() => navigate(`/study?sets=${set.id}`)}
                    onEdit={() => navigate(`/set/${set.id}/edit`)}
                    onDelete={() => handleDeleteSet(set)}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* Subfolder Creation Modal */}
      <Modal
        isOpen={isNewSubfolderOpen}
        onClose={handleCloseCreateSubfolder}
        title={targetParentFolder || activeFolderId ? 'Create Subfolder' : 'Create Folder'}
        subtitle={`Create a folder in ${targetParentFolder?.name || currentFolder?.name || 'My Library'}`}
      >
        <form onSubmit={handleCreateSubfolder}>
          <Input
            label="Folder Name"
            placeholder="e.g. Biology, Semester 1, Chapter 3"
            value={subfolderName}
            onChange={(e) => setSubfolderName(e.target.value)}
            autoFocus
            fullWidth
            required
          />

          <div className="folder-explorer-view__modal-actions">
            <Button
              type="button"
              variant="ghost"
              onClick={handleCloseCreateSubfolder}
              disabled={isCreatingSubfolder}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isCreatingSubfolder}
              disabled={!subfolderName.trim()}
            >
              Create Folder
            </Button>
          </div>
        </form>
      </Modal>

      {/* Rename Modal */}
      <Modal
        isOpen={isRenameOpen}
        onClose={handleCloseRename}
        title="Rename Folder"
        subtitle={`Rename "${folderToRename?.name || currentFolder?.name || ''}"`}
      >
        <form onSubmit={handleRename}>
          <Input
            label="Folder Name"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            autoFocus
            fullWidth
            required
          />

          <div className="folder-explorer-view__modal-actions">
            <Button
              type="button"
              variant="ghost"
              onClick={handleCloseRename}
              disabled={isRenaming}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isRenaming}
              disabled={!renameValue.trim()}
            >
              Save Name
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={handleCloseDelete}
        title="Delete Folder"
        subtitle={`Are you sure you want to delete "${folderToDelete?.name || currentFolder?.name || 'this folder'}"?`}
      >
        <p>Child sets and subfolders will be moved to the parent directory.</p>
        <div className="folder-explorer-view__modal-actions">
          <Button
            type="button"
            variant="ghost"
            onClick={handleCloseDelete}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={handleDelete}
            isLoading={isDeleting}
          >
            Delete Folder
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export type { FolderExplorerViewProps } from './types';
