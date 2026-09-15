import { useMemo, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Bot,
  FilePlus,
  FolderPlus,
  Home,
  LogIn,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  RefreshCw,
  Server,
  Sparkles,
  Upload,
  User as UserIcon,
} from 'lucide-react';
import { AuthModal } from '@/components/shared/AuthModal';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { Button } from '@/components/shared/Button';
import { GlobalSearch } from '@/components/shared/GlobalSearch';
import { QuickAccessNav } from '@/components/shared/QuickAccessNav';
import { Input } from '@/components/shared/Input';
import { McpConfigModal } from '@/components/shared/McpConfigModal';
import { MobileBottomNav } from '@/components/shared/MobileBottomNav';
import { Modal } from '@/components/shared/Modal';
import { ServerConfigModal } from '@/components/shared/ServerConfigModal';
import { StudySetSelectorModal } from '@/components/shared/StudySetSelectorModal';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { getUserDisplayName, getUserInitial } from '@/context/authUtils';
import { useAuth } from '@/hooks/useAuth';
import { useQuickAccess } from '@/hooks/useQuickAccess';
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
  const {
    folderTree,
    refreshFolderTree,
    activeFolderId,
    isStudyModalOpen,
    studyModalFolderId,
    openStudyModal,
    closeStudyModal,
  } = useWorkspace();

  const fallbackQuickAccess = useMemo(() => {
    return folderTree.slice(0, 6).map((f) => ({
      id: f.id,
      type: 'folder' as const,
      name: f.name,
    }));
  }, [folderTree]);

  const { quickAccessItems } = useQuickAccess({
    limit: 8,
    fallbackItems: fallbackQuickAccess,
  });

  const {
    currentUser,
    isAuthenticated,
    logout,
    isAuthModalOpen,
    openAuthModal,
    closeAuthModal,
  } = useAuth();

  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth > 1024;
    }
    return true;
  });

  // Modals state
  const [isQuickActionSheetOpen, setIsQuickActionSheetOpen] = useState(false);
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [isServerConfigOpen, setIsServerConfigOpen] = useState(false);
  const [isMcpConfigOpen, setIsMcpConfigOpen] = useState(false);
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

  const handleSignOut = async () => {
    try {
      await logout();
      showSuccess('Signed out successfully.');
      await refreshFolderTree();
      navigate('/');
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Failed to sign out');
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

  const isStudyMode =
    location.pathname === '/study' || location.pathname.endsWith('/study');

  const { layoutClass, sidebarClass } = getAppLayoutClassNames({
    isSidebarOpen,
    isStudyMode,
  });

  return (
    <div className={layoutClass}>
      {/* Top Navigation Bar (Hidden in Study Mode for Full Focus) */}
      {!isStudyMode && (
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
            {!isAuthenticated && (
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<LogIn size={16} />}
                onClick={openAuthModal}
                title="Sign in with Email"
              >
                Sign In
              </Button>
            )}

            <button
              type="button"
              className="app-topbar__toggle-btn"
              onClick={() => setIsServerConfigOpen(true)}
              title="Configure Backend Server Connection"
              aria-label="Configure Backend Server Connection"
            >
              <Server size={18} />
            </button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<BookOpen size={16} />}
              onClick={() => openStudyModal()}
              title="Launch Multi-Set Study Mode"
            >
              Study Mode
            </Button>
          </div>
        </header>
      )}

      {/* Main Body (Sidebar + Content) */}
      <div className="app-body">
        {/* Mobile Backdrop */}
        {!isStudyMode && isSidebarOpen && (
          <div
            className="app-sidebar-backdrop"
            onClick={() => setIsSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Sidebar */}
        {!isStudyMode && (
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

              <Button
                variant="secondary"
                size="sm"
                fullWidth
                leftIcon={<BookOpen size={15} />}
                onClick={() => {
                  if (window.innerWidth <= 1024) setIsSidebarOpen(false);
                  openStudyModal();
                }}
              >
                Study Mode
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

              <Link
                to="/studio"
                className={`app-sidebar__nav-link ${
                  location.pathname.startsWith('/studio') || location.pathname.startsWith('/documents')
                    ? 'app-sidebar__nav-link--active'
                    : ''
                }`}
                onClick={() => {
                  if (window.innerWidth <= 1024) setIsSidebarOpen(false);
                }}
              >
                <span className="app-sidebar__nav-icon">
                  <Sparkles size={18} />
                </span>
                <span>AI Flashcard Studio</span>
              </Link>
            </div>

            {/* Quick Access Section */}
            <span className="app-sidebar__nav-title">Quick Access</span>
            <div className="app-sidebar__quick-access-container">
              <QuickAccessNav
                items={quickAccessItems}
                activeId={activeFolderId}
                onSelectItem={() => {
                  if (window.innerWidth <= 1024) setIsSidebarOpen(false);
                }}
              />
            </div>

            {/* Sidebar Footer */}
            <div className="app-sidebar__footer">
              {/* User Profile Card */}
              <div className="app-sidebar__user-card">
                <div className="app-sidebar__user-card-avatar">
                  {isAuthenticated ? getUserInitial(currentUser) : <UserIcon size={16} />}
                </div>
                <div className="app-sidebar__user-card-info">
                  <span className="app-sidebar__user-card-label" title={getUserDisplayName(currentUser)}>
                    {getUserDisplayName(currentUser)}
                  </span>
                  {isAuthenticated && currentUser?.email && (
                    <span className="app-sidebar__user-card-email" title={currentUser.email}>
                      {currentUser.email}
                    </span>
                  )}
                  <div className="app-sidebar__user-card-actions">
                    {isAuthenticated ? (
                      <button
                        type="button"
                        className="app-sidebar__auth-action-btn app-sidebar__auth-action-btn--signout"
                        onClick={handleSignOut}
                        title="Sign out of your account"
                      >
                        <LogOut size={11} />
                        <span>Sign Out</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="app-sidebar__auth-action-btn"
                        onClick={openAuthModal}
                        title="Sign in with your email account"
                      >
                        <LogIn size={11} />
                        <span>Sign In</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Utility Toolbar */}
              <div className="app-sidebar__footer-toolbar">
                <div className="app-sidebar__toolbar-group">
                  <button
                    type="button"
                    className="app-sidebar__action-icon-btn app-sidebar__action-icon-btn--mcp"
                    onClick={() => setIsMcpConfigOpen(true)}
                    title="AI Agent & MCP Integration (Antigravity, Claude, Cursor)"
                    aria-label="AI Agent & MCP Integration"
                  >
                    <Bot size={16} />
                  </button>
                  <button
                    type="button"
                    className="app-sidebar__action-icon-btn"
                    onClick={() => setIsServerConfigOpen(true)}
                    title="Configure Backend Server Connection (LAN / Mobile)"
                    aria-label="Configure Backend Server Connection"
                  >
                    <Server size={15} />
                  </button>
                  {!isAuthenticated && (
                    <button
                      type="button"
                      className="app-sidebar__seed-btn"
                      onClick={handleSeedDemoData}
                      disabled={isSeeding}
                      title="Prepopulate sample folders, sets, and flashcards"
                    >
                      <RefreshCw className={isSeeding ? 'app-sidebar__seed-icon--spin' : ''} size={11} />
                      <span>{isSeeding ? '...' : 'Seed'}</span>
                    </button>
                  )}
                </div>

                <ThemeToggle />
              </div>
            </div>
          </aside>
        )}

        {/* Main View Area */}
        <div className="app-main">
          <main className="app-content">{children}</main>
        </div>
      </div>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
      />

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

      {/* Global Multi-Set Study Mode Selector Modal */}
      <StudySetSelectorModal
        isOpen={isStudyModalOpen}
        onClose={closeStudyModal}
        initialFolderId={studyModalFolderId}
      />

      {/* Backend Server Connection Settings Modal */}
      <ServerConfigModal
        isOpen={isServerConfigOpen}
        onClose={() => setIsServerConfigOpen(false)}
      />

      {/* AI Agent & MCP Integration Modal */}
      <McpConfigModal
        isOpen={isMcpConfigOpen}
        onClose={() => setIsMcpConfigOpen(false)}
      />

      {/* Mobile Bottom Navigation Dock (< 768px viewports, Hidden in Study Mode) */}
      {!isStudyMode && (
        <MobileBottomNav
          onOpenQuickCreate={() => setIsQuickActionSheetOpen(true)}
        />
      )}

      {/* Mobile Quick Action Sheet Modal */}
      <Modal
        isOpen={isQuickActionSheetOpen}
        onClose={() => setIsQuickActionSheetOpen(false)}
        title="Create & Synthesize"
        subtitle="Quickly add new study materials"
        variant="sheet"
      >
        <div className="mobile-quick-action-sheet">
          <button
            type="button"
            className="mobile-quick-action-sheet__item"
            onClick={() => {
              setIsQuickActionSheetOpen(false);
              navigate(activeFolderId ? `/create-set?folderId=${activeFolderId}` : '/create-set');
            }}
          >
            <div className="mobile-quick-action-sheet__item-icon mobile-quick-action-sheet__item-icon--primary">
              <FilePlus size={20} />
            </div>
            <div className="mobile-quick-action-sheet__item-info">
              <span className="mobile-quick-action-sheet__item-title">New Flashcard Set</span>
              <span className="mobile-quick-action-sheet__item-subtitle">
                Create cards manually with Markdown & LaTeX equations
              </span>
            </div>
          </button>

          <button
            type="button"
            className="mobile-quick-action-sheet__item"
            onClick={() => {
              setIsQuickActionSheetOpen(false);
              setParentFolderId(activeFolderId);
              setIsNewFolderOpen(true);
            }}
          >
            <div className="mobile-quick-action-sheet__item-icon mobile-quick-action-sheet__item-icon--warning">
              <FolderPlus size={20} />
            </div>
            <div className="mobile-quick-action-sheet__item-info">
              <span className="mobile-quick-action-sheet__item-title">New Folder</span>
              <span className="mobile-quick-action-sheet__item-subtitle">
                Organize your sets into hierarchical subject categories
              </span>
            </div>
          </button>

          <button
            type="button"
            className="mobile-quick-action-sheet__item"
            onClick={() => {
              setIsQuickActionSheetOpen(false);
              navigate('/studio');
            }}
          >
            <div className="mobile-quick-action-sheet__item-icon mobile-quick-action-sheet__item-icon--secondary">
              <Sparkles size={20} />
            </div>
            <div className="mobile-quick-action-sheet__item-info">
              <span className="mobile-quick-action-sheet__item-title">AI Flashcard Studio</span>
              <span className="mobile-quick-action-sheet__item-subtitle">
                Generate instant flashcard sets from topics, prompts, or notes
              </span>
            </div>
          </button>

          <button
            type="button"
            className="mobile-quick-action-sheet__item"
            onClick={() => {
              setIsQuickActionSheetOpen(false);
              navigate('/studio');
            }}
          >
            <div className="mobile-quick-action-sheet__item-icon mobile-quick-action-sheet__item-icon--success">
              <Upload size={20} />
            </div>
            <div className="mobile-quick-action-sheet__item-info">
              <span className="mobile-quick-action-sheet__item-title">Upload Study Document</span>
              <span className="mobile-quick-action-sheet__item-subtitle">
                Upload lecture slides or PDFs to your Google Drive
              </span>
            </div>
          </button>
        </div>
      </Modal>
    </div>
  );
}

export type { AppLayoutProps } from './types';
