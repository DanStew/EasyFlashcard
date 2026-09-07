import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  FolderPlus,
  Home,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/shared/Badge';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { Button } from '@/components/shared/Button';
import { FolderTreeNav } from '@/components/shared/FolderTreeNav';
import { GlobalSearch } from '@/components/shared/GlobalSearch';
import { Input } from '@/components/shared/Input';
import { Modal } from '@/components/shared/Modal';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { useToast } from '@/hooks/useToast';
import { useWorkspace } from '@/hooks/useWorkspace';
import { devService } from '@/services/devService';
import { folderService } from '@/services/folderService';
import type { AppLayoutProps } from './types';
import { getAppLayoutClassNames } from './utils';
import './style.scss';

export function AppLayout({
  children,
  breadcrumbs,
  searchValue,
  onSearchChange,
}: AppLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { showSuccess, showError } = useToast();
  const { folderTree, isLoadingTree, refreshFolderTree, activeFolderId } = useWorkspace();

  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth > 1024;
    }
    return true;
  });

  // Modals state
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [parentFolderId, setParentFolderId] = useState<string | null>(null);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const handleSeedDemoData = async () => {
    try {
      setIsSeeding(true);
      const res = await devService.seedDevData(true);
      showSuccess(
        `Prepopulated ${res.foldersCreated} folders, ${res.setsCreated} sets, and ${res.cardsCreated} cards!`
      );
      await refreshFolderTree();
      navigate('/');
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Failed to seed demo data');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleCreateFolder = async (e: FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    try {
      setIsCreatingFolder(true);
      const created = await folderService.createFolder({
        name: newFolderName.trim(),
        parentId: parentFolderId,
      });
      showSuccess(`Folder "${created.name}" created successfully!`);
      setNewFolderName('');
      setParentFolderId(null);
      setIsNewFolderOpen(false);
      refreshFolderTree();
      navigate(`/folder/${created.id}`);
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Failed to create folder');
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const handleOpenSubfolderModal = (parentId: string) => {
    setParentFolderId(parentId);
    setIsNewFolderOpen(true);
  };

  const { layoutClass, sidebarClass } = getAppLayoutClassNames({
    isSidebarOpen,
  });

  return (
    <div className={layoutClass}>
      {/* Top Navigation Bar with Single Brand & Toggle Button */}
      <header className="app-topbar">
        <div className="app-topbar__brand-group">
          <Link to="/" className="app-topbar__brand">
            <div className="app-topbar__brand-logo">
              <Sparkles size={20} />
            </div>
            <span className="app-topbar__brand-text">
              Easy<span className="app-topbar__brand-accent">Flashcard</span>
            </span>
          </Link>

          <button
            type="button"
            className="app-topbar__toggle-btn"
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            title={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {isSidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
          </button>
        </div>

        <div className="app-topbar__center">
          {breadcrumbs && breadcrumbs.length > 0 && (
            <Breadcrumbs
              items={breadcrumbs}
              onNavigate={(href) => navigate(href)}
            />
          )}
        </div>

        <div className="app-topbar__search">
          <GlobalSearch
            placeholder="Search sets and folders..."
            value={searchValue}
            onChange={onSearchChange}
            onNavigateToFullSearch={(query) => {
              if (onSearchChange) {
                onSearchChange(query);
              }
              navigate(`/?search=${encodeURIComponent(query)}`);
            }}
          />
        </div>

        <div className="app-topbar__right">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<BookOpen size={16} />}
            isComingSoon
            tooltip="Study carousel & review mode coming soon"
          >
            Study Mode
          </Button>
        </div>
      </header>

      {/* Main Body (Sidebar + Content) */}
      <div className="app-body">
        {/* Mobile Backdrop */}
        {isSidebarOpen && (
          <div
            className="app-sidebar-backdrop"
            onClick={() => setIsSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Sidebar */}
        <aside className={sidebarClass}>
          {/* Quick Action Buttons */}
          <div className="app-sidebar__quick-actions">
            <Button
              variant="gradient"
              size="md"
              fullWidth
              leftIcon={<Plus size={16} />}
              onClick={() => {
                if (window.innerWidth <= 1024) setIsSidebarOpen(false);
                navigate('/create-set');
              }}
            >
              Create Set
            </Button>

            <Button
              variant="secondary"
              size="sm"
              fullWidth
              leftIcon={<FolderPlus size={15} />}
              onClick={() => {
                setParentFolderId(null);
                setIsNewFolderOpen(true);
              }}
            >
              New Folder
            </Button>
          </div>

          {/* Navigation Sections */}
          <div className="app-sidebar__nav-section">
            <Link
              to="/"
              className={`app-sidebar__nav-link ${location.pathname === '/' ? 'app-sidebar__nav-link--active' : ''}`}
              onClick={() => {
                if (window.innerWidth <= 1024) setIsSidebarOpen(false);
              }}
            >
              <span className="app-sidebar__nav-icon">
                <Home size={18} />
              </span>
              <span>Library</span>
            </Link>

            {/* AI Generator Link (Future placeholder with Coming Soon) */}
            <div
              className="app-sidebar__nav-link app-sidebar__nav-link--teaser"
              title="AI Document Converter coming in next release"
            >
              <span className="app-sidebar__nav-icon">
                <Sparkles size={18} />
              </span>
              <span>AI Flashcard Studio</span>
              <Badge variant="coming-soon" size="sm" className="app-sidebar__nav-teaser-badge">
                Soon
              </Badge>
            </div>
          </div>

          {/* Hierarchical Folder Explorer Tree */}
          <span className="app-sidebar__nav-title">Folders & Organization</span>
          <div className="app-sidebar__tree-container">
            <FolderTreeNav
              tree={folderTree}
              isLoading={isLoadingTree}
              activeFolderId={activeFolderId}
              onSelectFolder={(folderId) => {
                if (window.innerWidth <= 1024) setIsSidebarOpen(false);
                navigate(`/folder/${folderId}`);
              }}
              onCreateSubfolder={handleOpenSubfolderModal}
            />
          </div>

          {/* Sidebar Footer */}
          <div className="app-sidebar__footer">
            <div className="app-sidebar__user-badge">
              <div className="app-sidebar__user-badge-avatar">D</div>
              <div className="app-sidebar__user-badge-info">
                <span className="app-sidebar__user-badge-label">Developer Mode</span>
                <button
                  type="button"
                  className="app-sidebar__seed-btn"
                  onClick={handleSeedDemoData}
                  disabled={isSeeding}
                  title="Prepopulate sample folders, sets, and flashcards"
                >
                  <RefreshCw className={isSeeding ? 'app-sidebar__seed-icon--spin' : ''} size={11} />
                  <span>{isSeeding ? 'Seeding...' : 'Seed Data'}</span>
                </button>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </aside>

        {/* Main View Area */}
        <div className="app-main">
          <main className="app-content">{children}</main>
        </div>
      </div>

      {/* Create Folder Modal */}
      <Modal
        isOpen={isNewFolderOpen}
        onClose={() => setIsNewFolderOpen(false)}
        title={parentFolderId ? 'Create Subfolder' : 'Create New Folder'}
        subtitle="Organize your flashcard sets in hierarchical folders"
      >
        <form onSubmit={handleCreateFolder}>
          <Input
            label="Folder Name"
            placeholder="e.g. Biology, Semester 1, Organic Chemistry"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            autoFocus
            fullWidth
            required
          />

          <div className="app-modal-actions">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsNewFolderOpen(false)}
              disabled={isCreatingFolder}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isCreatingFolder}
              disabled={!newFolderName.trim()}
            >
              Create Folder
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export type { AppLayoutProps } from './types';
