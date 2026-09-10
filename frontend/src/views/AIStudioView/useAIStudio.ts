// ==========================================
// AIStudioView - State & Side Effects Hook with Cache
// ==========================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { AIGenerationConfig, AIGenerationMode } from '@/components/shared/AIGenerationModal/types';
import { useToast } from '@/hooks/useToast';
import { linkGoogleDriveAccount, signInWithGoogle } from '@/services/authService';
import { documentService } from '@/services/documentService';
import type { Document, DriveErrorCode, DriveFolderContentsResponse } from '@/types/document';
import { extractDriveError } from './utils';

// In-memory client-side cache for folder responses
const driveFolderCache = new Map<string, { data: DriveFolderContentsResponse; timestamp: number }>();
const CACHE_TTL_MS = 60 * 1000; // 1 minute fresh cache

export function useAIStudio() {
  const { folderId } = useParams<{ folderId?: string }>();
  const navigate = useNavigate();
  const { showSuccess, showInfo, showError } = useToast();

  const [contents, setContents] = useState<DriveFolderContentsResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isConnectingDrive, setIsConnectingDrive] = useState<boolean>(false);
  const [errorCode, setErrorCode] = useState<DriveErrorCode | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isBannerDismissed, setIsBannerDismissed] = useState<boolean>(false);

  // Modals state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState<boolean>(false);
  const [isAIGenModalOpen, setIsAIGenModalOpen] = useState<boolean>(false);
  const [aiGenInitialMode, setAIGenInitialMode] = useState<AIGenerationMode>('prompt');
  const [aiGenSelectedDoc, setAIGenSelectedDoc] = useState<Document | null>(null);
  const [moveItemTarget, setMoveItemTarget] = useState<{ id: string; name: string; isFolder: boolean } | null>(
    null
  );

  const activeFolderKey = folderId || 'root';
  const isFetchingRef = useRef(false);

  const fetchFolderContents = useCallback(async (targetId?: string, forceRefresh = false) => {
    const key = targetId || 'root';
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

  const handleConnectDrive = async () => {
    try {
      setIsConnectingDrive(true);
      await linkGoogleDriveAccount();
      showSuccess('Successfully connected Google Drive!');
      invalidateCache();
      await fetchFolderContents(folderId, true);
    } catch {
      try {
        await signInWithGoogle();
        showSuccess('Connected Google Drive!');
        invalidateCache();
        await fetchFolderContents(folderId, true);
      } catch (innerErr: unknown) {
        const parsed = extractDriveError(innerErr);
        setErrorCode(parsed.code);
        setErrorMessage(parsed.message);
        showError(parsed.message);
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

  const handleOpenAIGenModal = (mode: AIGenerationMode = 'prompt', doc: Document | null = null) => {
    setAIGenInitialMode(mode);
    setAIGenSelectedDoc(doc);
    setIsAIGenModalOpen(true);
  };

  const handleExecuteAIGeneration = (config: AIGenerationConfig) => {
    showInfo(
      `AI Flashcard Studio generation configured (${config.cardCount} cards, ${config.difficulty} difficulty). Generation will execute automatically in the upcoming AI release!`
    );
  };

  return {
    contents,
    isLoading,
    isConnectingDrive,
    errorCode,
    errorMessage,
    isBannerDismissed,
    isUploadModalOpen,
    isNewFolderModalOpen,
    isAIGenModalOpen,
    aiGenInitialMode,
    aiGenSelectedDoc,
    moveItemTarget,
    activeFolderKey,
    setIsUploadModalOpen,
    setIsNewFolderModalOpen,
    setIsAIGenModalOpen,
    setMoveItemTarget,
    handleConnectDrive,
    handleDismissBanner,
    handleNavigateFolder,
    handleOpenDocument,
    handleUpload,
    handleCreateFolder,
    handleMoveItem,
    handleTrashItem,
    handleOpenAIGenModal,
    handleExecuteAIGeneration,
  };
}
