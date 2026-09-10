// ==========================================
// AIStudioView - State & Side Effects Hook with Cache
// ==========================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/useToast';
import { aiGenerationApi } from '@/services/aiGenerationApi';
import { linkGoogleDriveAccount, signInWithGoogle } from '@/services/authService';
import { documentService } from '@/services/documentService';
import { folderService } from '@/services/folderService';
import { connectPersistentGoogleDrive } from '@/services/gdriveAuthService';
import type { AIGenerationEvent, AIGenerationRequest } from '@/types/aiGeneration';

import type { Document, DriveErrorCode, DriveFolderContentsResponse } from '@/types/document';
import type { Folder } from '@/types/folder';
import { extractDriveError } from './utils';

// In-memory client-side cache for folder responses
const driveFolderCache = new Map<string, { data: DriveFolderContentsResponse; timestamp: number }>();
const CACHE_TTL_MS = 60 * 1000; // 1 minute fresh cache

export function useAIStudio() {
  const { folderId } = useParams<{ folderId?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [contents, setContents] = useState<DriveFolderContentsResponse | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isConnectingDrive, setIsConnectingDrive] = useState<boolean>(false);
  const [needsScopeUpgrade, setNeedsScopeUpgrade] = useState<boolean>(false);
  const [errorCode, setErrorCode] = useState<DriveErrorCode | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isBannerDismissed, setIsBannerDismissed] = useState<boolean>(false);

  // Modals state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState<boolean>(false);
  const [isAIGenModalOpen, setIsAIGenModalOpen] = useState<boolean>(false);
  const [aiGenSelectedDoc, setAIGenSelectedDoc] = useState<Document | null>(null);
  const [moveItemTarget, setMoveItemTarget] = useState<{ id: string; name: string; isFolder: boolean } | null>(
    null
  );

  // Generation state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationEvent, setGenerationEvent] = useState<AIGenerationEvent | null>(null);

  const activeFolderKey = folderId || 'root';
  const isFetchingRef = useRef(false);

  // Automatically open modal if docId is passed in URL query
  useEffect(() => {
    const docId = searchParams.get('docId');
    if (!docId) return;

    let isMounted = true;
    async function loadPreselectedDoc() {
      try {
        const doc = await documentService.getDocumentById(docId!);
        if (isMounted && doc) {
          setAIGenSelectedDoc(doc);
          setGenerationEvent(null);
          setIsGenerating(false);
          setIsAIGenModalOpen(true);
          // Clean up search param from URL without page refresh
          setSearchParams(
            (prev) => {
              const next = new URLSearchParams(prev);
              next.delete('docId');
              return next;
            },
            { replace: true }
          );
        }
      } catch (err: unknown) {
        console.error('Failed to pre-select document for AI Studio:', err);
      }
    }

    loadPreselectedDoc();
    return () => {
      isMounted = false;
    };
  }, [searchParams, setSearchParams]);

  // Check initial drive auth status for scope upgrade requirement
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const authStatus = await documentService.getDriveAuthStatus();
        setNeedsScopeUpgrade(Boolean(authStatus.needs_scope_upgrade));
      } catch {
        // Fallback
      }
    };
    checkAuthStatus();
  }, []);

  // Load app folders for destination selection
  useEffect(() => {
    const loadFolders = async () => {
      try {
        const userFolders = await folderService.listFolders();
        setFolders(userFolders);
      } catch {
        // Fallback
      }
    };
    loadFolders();
  }, []);

  const fetchFolderContents = useCallback(async (targetId?: string, forceRefresh = false) => {
    const key = targetId || 'root';
    if (forceRefresh) {
      driveFolderCache.delete(key);
    }
    const cached = driveFolderCache.get(key);
    const isCacheValid = cached && Date.now() - cached.timestamp < CACHE_TTL_MS;

    // Fast-path: Immediately render cached data if available without loading spinner
    if (cached && !forceRefresh) {
      setContents(cached.data);
      setIsLoading(false);
      if (isCacheValid) return;
    } else if (!cached) {
      setIsLoading(true);
    }

    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      setErrorCode(null);
      setErrorMessage(null);
      setIsBannerDismissed(false);
      const data = await documentService.getDriveFolderContents(targetId);
      driveFolderCache.set(key, { data, timestamp: Date.now() });
      setContents(data);
    } catch (err: unknown) {
      const parsed = extractDriveError(err);
      setErrorCode(parsed.code);
      setErrorMessage(parsed.message);
      setIsBannerDismissed(false);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchFolderContents(folderId);
  }, [folderId, fetchFolderContents]);

  const invalidateCache = useCallback(() => {
    driveFolderCache.clear();
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    driveFolderCache.clear();
    try {
      await fetchFolderContents(folderId, true);
      const authStatus = await documentService.getDriveAuthStatus();
      setNeedsScopeUpgrade(Boolean(authStatus.needs_scope_upgrade));
      showSuccess('Google Drive synchronized!');
    } catch (err: unknown) {
      const parsed = extractDriveError(err);
      showError(parsed.message);
    } finally {
      setIsRefreshing(false);
    }
  }, [folderId, fetchFolderContents, showSuccess, showError]);

  const handleConnectDrive = async () => {
    try {
      setIsConnectingDrive(true);
      // Step 1: Attempt persistent GIS OAuth code flow with backend refresh token exchange
      await connectPersistentGoogleDrive();
      setNeedsScopeUpgrade(false);
      showSuccess('Google Drive permissions upgraded & connected!');
      invalidateCache();
      await fetchFolderContents(folderId, true);
    } catch {
      // Step 2: Fallback to Firebase popup link/sign-in if GIS popup is blocked or in mock mode
      try {
        await linkGoogleDriveAccount();
        setNeedsScopeUpgrade(false);
        showSuccess('Connected Google Drive!');
        invalidateCache();
        await fetchFolderContents(folderId, true);
      } catch {
        try {
          await signInWithGoogle();
          setNeedsScopeUpgrade(false);
          showSuccess('Connected Google Drive!');
          invalidateCache();
          await fetchFolderContents(folderId, true);
        } catch (innerErr: unknown) {
          const parsed = extractDriveError(innerErr);
          setErrorCode(parsed.code);
          setErrorMessage(parsed.message);
          showError(parsed.message);
        }
      }
    } finally {
      setIsConnectingDrive(false);
    }
  };


  const handleNavigateFolder = (targetFolderId: string | null) => {
    if (!targetFolderId || targetFolderId === contents?.breadcrumbs[0]?.id) {
      navigate('/studio');
    } else {
      navigate(`/studio/folder/${targetFolderId}`);
    }
  };

  const handleOpenDocument = (doc: Document) => {
    navigate(`/studio/document/${doc.id}`);
  };

  const handleUpload = async (file: File, targetFolderId?: string | null) => {
    try {
      const activeFolder = targetFolderId || contents?.currentFolder.id;
      const uploaded = await documentService.uploadDocument(file, activeFolder || undefined);
      showSuccess(`Uploaded "${uploaded.name}" to Google Drive!`);
      invalidateCache();
      await fetchFolderContents(folderId, true);
    } catch (err: unknown) {
      const parsed = extractDriveError(err);
      showError(parsed.message);
      throw new Error(parsed.message);
    }
  };

  const handleCreateFolder = async (name: string, parentFolderId?: string | null) => {
    try {
      const activeParent = parentFolderId || contents?.currentFolder.id;
      const created = await documentService.createDriveSubfolder({
        name,
        parentFolderId: activeParent,
      });
      showSuccess(`Folder "${created.name}" created in Google Drive!`);
      invalidateCache();
      await fetchFolderContents(folderId, true);
    } catch (err: unknown) {
      const parsed = extractDriveError(err);
      showError(parsed.message);
      throw new Error(parsed.message);
    }
  };

  const handleMoveItem = async (itemId: string, targetFolderId: string, sourceFolderId?: string | null) => {
    try {
      await documentService.moveDriveItem({
        itemId,
        targetFolderId,
        sourceFolderId,
      });
      showSuccess('Moved item in Google Drive successfully!');
      invalidateCache();
      await fetchFolderContents(folderId, true);
    } catch (err: unknown) {
      const parsed = extractDriveError(err);
      showError(parsed.message);
      throw new Error(parsed.message);
    }
  };

  const handleTrashItem = async (item: { id: string; name: string; isFolder: boolean }) => {
    const confirmed = window.confirm(`Move "${item.name}" to Google Drive Trash?`);
    if (!confirmed) return;

    try {
      await documentService.trashDriveItem(item.id);
      showSuccess(`Moved "${item.name}" to Google Drive Trash.`);
      invalidateCache();
      await fetchFolderContents(folderId, true);
    } catch (err: unknown) {
      const parsed = extractDriveError(err);
      showError(parsed.message);
    }
  };

  const handleDismissBanner = () => {
    setIsBannerDismissed(true);
  };

  const handleOpenAIGenModal = (doc: Document | null = null) => {
    setAIGenSelectedDoc(doc);
    setGenerationEvent(null);
    setIsGenerating(false);
    setIsAIGenModalOpen(true);
  };

  const handleStartAIGeneration = async (request: AIGenerationRequest) => {
    try {
      setIsGenerating(true);
      setGenerationEvent({
        stage: 'init',
        progress: 5,
        message: 'Initializing AI Multi-Agent Studio...',
        cardCount: 0,
      });

      const finalEvent = await aiGenerationApi.generateStream(request, (event) => {
        setGenerationEvent(event);
      });

      if (finalEvent.stage === 'completed' && finalEvent.setId) {
        showSuccess(`Flashcard Set "${finalEvent.setName || 'Study Set'}" synthesized successfully!`);
      } else if (finalEvent.stage === 'error') {
        showError(finalEvent.error || finalEvent.message || 'AI Generation failed');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'AI Generation failed';
      setGenerationEvent({
        stage: 'error',
        progress: 0,
        message,
        cardCount: 0,
        error: message,
      });
      showError(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNavigateToSet = (setId: string) => {
    navigate(`/sets/${setId}`);
  };

  return {
    contents,
    folders,
    isLoading,
    isRefreshing,
    isConnectingDrive,
    needsScopeUpgrade,
    errorCode,
    errorMessage,
    isBannerDismissed,
    isUploadModalOpen,
    isNewFolderModalOpen,
    isAIGenModalOpen,
    aiGenSelectedDoc,
    moveItemTarget,
    activeFolderKey,
    isGenerating,
    generationEvent,
    setIsUploadModalOpen,
    setIsNewFolderModalOpen,
    setIsAIGenModalOpen,
    setMoveItemTarget,
    handleConnectDrive,
    handleRefresh,
    handleDismissBanner,
    handleNavigateFolder,
    handleOpenDocument,
    handleUpload,
    handleCreateFolder,
    handleMoveItem,
    handleTrashItem,
    handleOpenAIGenModal,
    handleStartAIGeneration,
    handleNavigateToSet,
  };
}
