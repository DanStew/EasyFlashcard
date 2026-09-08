import {
  createContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { BreadcrumbItem } from '@/components/shared/Breadcrumbs/types';
import { folderService } from '@/services/folderService';
import type { FolderTreeItem } from '@/types/folder';
import { buildBreadcrumbTrail, findFolderAncestors } from './workspaceUtils';

export interface WorkspaceContextType {
  folderTree: FolderTreeItem[];
  isLoadingTree: boolean;
  activeFolderId: string | null;
  setActiveFolderId: (id: string | null) => void;
  refreshFolderTree: () => Promise<void>;
  getBreadcrumbsForFolder: (
    folderId: string | null,
    fallbackCurrent?: { id: string; name: string } | null
  ) => BreadcrumbItem[];
  isStudyModalOpen: boolean;
  studyModalFolderId: string | null;
  openStudyModal: (initialFolderId?: string | null) => void;
  closeStudyModal: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export interface WorkspaceProviderProps {
  children: ReactNode;
}

export function WorkspaceProvider({ children }: WorkspaceProviderProps) {
  const [folderTree, setFolderTree] = useState<FolderTreeItem[]>([]);
  const [isLoadingTree, setIsLoadingTree] = useState(false);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [isStudyModalOpen, setIsStudyModalOpen] = useState(false);
  const [studyModalFolderId, setStudyModalFolderId] = useState<string | null>(null);

  const openStudyModal = useCallback((initialFolderId?: string | null) => {
    setStudyModalFolderId(initialFolderId ?? null);
    setIsStudyModalOpen(true);
  }, []);

  const closeStudyModal = useCallback(() => {
    setIsStudyModalOpen(false);
    setStudyModalFolderId(null);
  }, []);

  const refreshFolderTree = useCallback(async () => {
    try {
      setIsLoadingTree(true);
      const tree = await folderService.getFolderTree();
      setFolderTree(tree);
    } catch (err: unknown) {
      console.error('Failed to load folder tree', err);
    } finally {
      setIsLoadingTree(false);
    }
  }, []);

  useEffect(() => {
    refreshFolderTree();
  }, [refreshFolderTree]);

  const getBreadcrumbsForFolder = useCallback(
    (folderId: string | null, fallbackCurrent?: { id: string; name: string } | null): BreadcrumbItem[] => {
      if (!folderId) {
        return [{ id: 'root', label: 'Library', href: '/' }];
      }
      const ancestors = findFolderAncestors(folderTree, folderId);
      return buildBreadcrumbTrail(ancestors, fallbackCurrent);
    },
    [folderTree]
  );

  return (
    <WorkspaceContext.Provider
      value={{
        folderTree,
        isLoadingTree,
        activeFolderId,
        setActiveFolderId,
        refreshFolderTree,
        getBreadcrumbsForFolder,
        isStudyModalOpen,
        studyModalFolderId,
        openStudyModal,
        closeStudyModal,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export { WorkspaceContext };
