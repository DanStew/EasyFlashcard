// ==========================================
// AIStudioView - Presentation Component
// ==========================================

import { HardDrive, Sparkles } from 'lucide-react';
import { AIGenerationHub } from '@/components/shared/AIGenerationHub';
import { AIGenerationModal } from '@/components/shared/AIGenerationModal';
import { Badge } from '@/components/shared/Badge';
import { DriveAuthBanner } from '@/components/shared/DriveAuthBanner';
import { DriveFileExplorer } from '@/components/shared/DriveFileExplorer';
import { DriveUploadModal } from '@/components/shared/DriveUploadModal';
import { MoveDriveItemModal } from '@/components/shared/MoveDriveItemModal';
import { NewDriveFolderModal } from '@/components/shared/NewDriveFolderModal';
import type { Document } from '@/types/document';
import { useAIStudio } from './useAIStudio';
import './style.scss';

export function AIStudioView() {
  const {
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
  } = useAIStudio();

  const handleGenerateFlashcards = (doc: Document) => {
    handleOpenAIGenModal('document', doc);
  };

  const totalDocs = contents?.files.length || 0;
  const totalFolders = contents?.subfolders.length || 0;
  const totalLinkedSets =
    contents?.files.reduce((acc, f) => acc + (f.linkedSetIds?.length || 0), 0) || 0;

  return (
    <div className="ai-studio-view animate-fade-in">
      {/* Hero Header Banner */}
      <section className="ai-studio-view__hero">
        <div className="ai-studio-view__hero-left">
          <div className="ai-studio-view__badge-row">
            <Badge variant="primary" size="sm">
              <Sparkles size={12} />
              <span>AI Flashcard Studio</span>
            </Badge>
            <Badge variant="subtle" size="sm">
              <HardDrive size={12} />
              <span>Google Drive Synced</span>
            </Badge>
          </div>

          <h1 className="ai-studio-view__title">
            AI Flashcard Studio & <span className="ai-studio-view__accent">Document Hub</span>
          </h1>

          <p className="ai-studio-view__subtitle">
            Synthesize smart flashcards with AI from prompts, topics, or study PDFs directly from your personal <strong>EasyFlashcard</strong> Google Drive directory.
          </p>
        </div>

        <div className="ai-studio-view__stats">
          <div className="ai-studio-view__stat-card">
            <span className="ai-studio-view__stat-value">{totalDocs}</span>
            <span className="ai-studio-view__stat-label">Documents</span>
          </div>
          <div className="ai-studio-view__stat-card">
            <span className="ai-studio-view__stat-value">{totalFolders}</span>
            <span className="ai-studio-view__stat-label">Folders</span>
          </div>
          <div className="ai-studio-view__stat-card">
            <span className="ai-studio-view__stat-value">{totalLinkedSets}</span>
            <span className="ai-studio-view__stat-label">Linked Sets</span>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="ai-studio-view__main">
        {/* Permission / Quota / Auth Error Warning Banner */}
        {errorCode && !isBannerDismissed && (
          <DriveAuthBanner
            errorCode={errorCode}
            errorMessage={errorMessage}
            onConnectDrive={handleConnectDrive}
            onDismiss={handleDismissBanner}
            isConnecting={isConnectingDrive}
          />
        )}

        {/* AI Flashcard Generation Hub */}
        <section className="ai-studio-view__hub-section">
          <AIGenerationHub
            onOpenUpload={() => setIsUploadModalOpen(true)}
            onOpenPromptModal={(mode) => handleOpenAIGenModal(mode)}
            onExploreDocuments={() => {}}
          />
        </section>

        {/* Google Drive Document Library & File Explorer */}
        <section className="ai-studio-view__explorer-section">
          <div className="ai-studio-view__section-header">
            <div>
              <h2 className="ai-studio-view__section-title">Connected Google Drive Library</h2>
              <p className="ai-studio-view__section-tagline">
                Manage lecture notes, slides, and study PDFs in your EasyFlashcard Drive folder
              </p>
            </div>
          </div>

          <DriveFileExplorer
            contents={contents}
            isLoading={isLoading}
            onNavigateFolder={handleNavigateFolder}
            onOpenDocument={handleOpenDocument}
            onUploadClick={() => setIsUploadModalOpen(true)}
            onNewFolderClick={() => setIsNewFolderModalOpen(true)}
            onMoveItemClick={(item) => setMoveItemTarget(item)}
            onTrashItemClick={handleTrashItem}
            onGenerateFlashcardsClick={handleGenerateFlashcards}
          />
        </section>
      </main>

      {/* Modals */}
      <DriveUploadModal
        isOpen={isUploadModalOpen}
        targetFolderName={contents?.currentFolder.name}
        targetFolderId={contents?.currentFolder.id}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={handleUpload}
      />

      <NewDriveFolderModal
        isOpen={isNewFolderModalOpen}
        parentFolderName={contents?.currentFolder.name}
        parentFolderId={contents?.currentFolder.id}
        onClose={() => setIsNewFolderModalOpen(false)}
        onCreateFolder={handleCreateFolder}
      />

      <MoveDriveItemModal
        isOpen={Boolean(moveItemTarget)}
        item={moveItemTarget}
        currentFolderId={contents?.currentFolder.id || ''}
        rootFolderId={contents?.breadcrumbs[0]?.id || ''}
        availableFolders={contents?.subfolders || []}
        onClose={() => setMoveItemTarget(null)}
        onMoveItem={handleMoveItem}
      />

      <AIGenerationModal
        isOpen={isAIGenModalOpen}
        initialMode={aiGenInitialMode}
        initialDocumentId={aiGenSelectedDoc?.id}
        initialDocumentName={aiGenSelectedDoc?.name}
        onClose={() => setIsAIGenModalOpen(false)}
        onGenerate={handleExecuteAIGeneration}
      />
    </div>
  );
}

export default AIStudioView;
