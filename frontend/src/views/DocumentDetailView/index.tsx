// ==========================================
// DocumentDetailView - Presentation
// ==========================================

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Copy,
  ExternalLink,
  FileText,
  HardDrive,
  Layers,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { useToast } from '@/hooks/useToast';
import { documentService } from '@/services/documentService';
import type { Document } from '@/types/document';
import {
  formatDocumentSize,
  formatFullDate,
  getFileTypeMetadata,
  truncateId,
} from './utils';
import './style.scss';

export function DocumentDetailView() {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [document, setDocument] = useState<Document | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!documentId) return;

    let isMounted = true;
    async function loadDoc() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await documentService.getDocumentById(documentId!);
        if (isMounted) setDocument(data);
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load document metadata');
          showError('Could not load document');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadDoc();
    return () => {
      isMounted = false;
    };
  }, [documentId, showError]);

  const handleGenerateFlashcards = () => {
    if (document?.id) {
      navigate(`/studio?docId=${document.id}`);
    } else {
      navigate('/studio');
    }
  };

  const handleCopyFileId = () => {
    if (document?.driveFileId) {
      navigator.clipboard.writeText(document.driveFileId);
      showSuccess('Google Drive File ID copied to clipboard!');
    }
  };

  if (isLoading) {
    return (
      <div className="doc-detail-view">
        <div className="loading-state-container">
          <Loader2 size={36} className="spin-animation text-primary" />
          <p className="loading-text">Loading document preview from Google Drive...</p>
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="doc-detail-view">
        <header className="doc-detail-view__header">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/studio')}
            leftIcon={<ArrowLeft size={16} />}
          >
            Back to Studio
          </Button>
        </header>
        <div className="form-error-alert">{error || 'Document not found in Google Drive.'}</div>
      </div>
    );
  }

  const fileMeta = getFileTypeMetadata(document.mimeType, document.name);

  // Google Drive preview link transforms standard /view to /preview for embedded iframes
  const embedPreviewUrl = document.webViewLink
    ? document.webViewLink.replace(/\/view(\?.*)?$/, '/preview')
    : null;

  return (
    <div className="doc-detail-view animate-fade-in">
      {/* Top Header Bar */}
      <header className="doc-detail-view__header">
        <div className="doc-detail-view__header-left">
          <button
            type="button"
            className="doc-detail-view__back-btn"
            onClick={() => navigate('/studio')}
            title="Return to AI Flashcard Studio"
          >
            <ArrowLeft size={16} />
            <span>Studio</span>
          </button>

          <div className="doc-detail-view__title-group">
            <div className="doc-detail-view__meta-row">
              <span className="doc-detail-view__type-pill">
                <FileText size={12} />
                <span>{fileMeta.label}</span>
              </span>
              <span>•</span>
              <span>Uploaded {formatFullDate(document.createdAt)}</span>
              <span>•</span>
              <span>{formatDocumentSize(document.sizeBytes)}</span>
            </div>
            <h1 className="doc-detail-view__title" title={document.name}>
              {document.name}
            </h1>
          </div>
        </div>

        <div className="doc-detail-view__header-actions">
          {document.webViewLink && (
            <a
              href={document.webViewLink}
              target="_blank"
              rel="noopener noreferrer"
              className="doc-detail-view__drive-link-btn"
              title="Open document directly in Google Drive"
            >
              <ExternalLink size={15} />
              <span>Open in Drive</span>
            </a>
          )}

          <Button
            variant="gradient"
            size="md"
            onClick={handleGenerateFlashcards}
            leftIcon={<Sparkles size={16} />}
          >
            Generate Flashcards
          </Button>
        </div>
      </header>

      {/* Main Split Layout */}
      <div className="doc-detail-view__layout">
        {/* Document Preview Stage */}
        <section className="doc-detail-view__stage">
          <div className="doc-detail-view__stage-header">
            <div className="doc-detail-view__stage-tag">
              <HardDrive size={15} />
              <span>Google Drive Document Viewer</span>
            </div>

            <div className="doc-detail-view__stage-file-id">
              <span>ID: {truncateId(document.driveFileId, 10)}</span>
              <button
                type="button"
                className="doc-detail-view__copy-id-btn"
                onClick={handleCopyFileId}
                title="Copy full Google Drive File ID"
                aria-label="Copy Google Drive File ID"
              >
                <Copy size={12} />
              </button>
            </div>
          </div>

          <div className="doc-detail-view__iframe-wrapper">
            {embedPreviewUrl &&
            !embedPreviewUrl.includes('preview_sample') &&
            !embedPreviewUrl.includes('sample/view') ? (
              <iframe
                src={embedPreviewUrl}
                title={document.name}
                allow="autoplay"
              />
            ) : (
              <div className="doc-detail-view__mock-preview">
                <div className="doc-detail-view__mock-icon">
                  <FileText size={36} />
                </div>
                <h3 className="doc-detail-view__mock-title">{document.name}</h3>
                <p className="doc-detail-view__mock-desc">
                  Interactive document preview powered by your connected Google Drive storage. Open directly in Google Drive to view or edit full multi-page contents.
                </p>
                {document.webViewLink && (
                  <a
                    href={document.webViewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="doc-detail-view__drive-link-btn"
                  >
                    <ExternalLink size={15} />
                    <span>Open in Google Drive</span>
                  </a>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Sidebar Metadata & Linked Flashcards */}
        <aside className="doc-detail-view__sidebar">
          {/* Document Details Card */}
          <div className="doc-detail-view__sidebar-card">
            <h3 className="doc-detail-view__card-title">Document Information</h3>
            <div className="doc-detail-view__info-row">
              <span className="doc-detail-view__info-label">Format</span>
              <span className="doc-detail-view__info-val">{fileMeta.label}</span>
            </div>
            <div className="doc-detail-view__info-row">
              <span className="doc-detail-view__info-label">File Size</span>
              <span className="doc-detail-view__info-val">{formatDocumentSize(document.sizeBytes)}</span>
            </div>
            <div className="doc-detail-view__info-row">
              <span className="doc-detail-view__info-label">MIME Type</span>
              <span className="doc-detail-view__info-val" title={document.mimeType}>
                {document.mimeType.split('/')[1] || document.mimeType}
              </span>
            </div>
            <div className="doc-detail-view__info-row">
              <span className="doc-detail-view__info-label">Drive File ID</span>
              <span className="doc-detail-view__info-val" title={document.driveFileId}>
                {truncateId(document.driveFileId, 12)}
              </span>
            </div>
            <div className="doc-detail-view__info-row">
              <span className="doc-detail-view__info-label">Storage</span>
              <span className="doc-detail-view__info-val">Google Drive (EasyFlashcard)</span>
            </div>
          </div>

          {/* Linked Flashcard Sets Card */}
          <div className="doc-detail-view__sidebar-card">
            <h3 className="doc-detail-view__card-title">
              <span>Linked Flashcard Sets</span>
              <span className="drive-explorer__section-count">
                {document.linkedSetIds?.length || 0}
              </span>
            </h3>

            {document.linkedSetIds && document.linkedSetIds.length > 0 ? (
              <div className="doc-detail-view__citations-list">
                {document.linkedSetIds.map((setId) => (
                  <Button
                    key={setId}
                    variant="outline"
                    size="sm"
                    fullWidth
                    leftIcon={<BookOpen size={14} />}
                    onClick={() => navigate(`/set/${setId}`)}
                  >
                    View Flashcard Set
                  </Button>
                ))}
              </div>
            ) : (
              <div className="doc-detail-view__citation-empty">
                <Layers size={28} className="text-tertiary" />
                <p className="doc-detail-view__citation-empty-text">
                  No flashcard sets generated from this document yet. Click &quot;Generate Flashcards&quot; to create study cards.
                </p>
                <Button
                  variant="gradient"
                  size="sm"
                  fullWidth
                  leftIcon={<Sparkles size={14} />}
                  onClick={handleGenerateFlashcards}
                >
                  Generate Flashcards
                </Button>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

export type { DocumentDetailViewProps } from './types';
