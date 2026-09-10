// ==========================================
// DriveUploadModal - Presentation
// ==========================================

import { useRef, useState, type DragEvent, type ChangeEvent } from 'react';
import { FileText, Trash2, UploadCloud } from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { Modal } from '@/components/shared/Modal';
import { formatFileSize } from '@/utils/documentFormatters';
import type { DriveUploadModalProps } from './types';
import './style.scss';

export function DriveUploadModal({
  isOpen,
  targetFolderName = 'EasyFlashcard',
  targetFolderId = null,
  onClose,
  onUpload,
}: DriveUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFile(e.dataTransfer.files[0]);
      setError(null);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile) return;
    try {
      setIsUploading(true);
      setError(null);
      await onUpload(selectedFile, targetFolderId);
      setSelectedFile(null);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to upload file to Google Drive');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (isUploading) return;
    setSelectedFile(null);
    setError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Upload Document to Google Drive"
      subtitle={`Uploading directly to "${targetFolderName}"`}
      size="md"
    >
      <div className="drive-upload-modal">
        {error && <div className="form-error-alert">{error}</div>}

        {!selectedFile ? (
          <div
            className={`drive-upload-modal__dropzone ${
              isDragging ? 'drive-upload-modal__dropzone--active' : ''
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden-file-input"
              accept=".pdf,.docx,.pptx,.txt,.md,.png,.jpg,.jpeg"
              onChange={handleFileChange}
            />
            <div className="drive-upload-modal__icon">
              <UploadCloud size={24} />
            </div>
            <h4 className="drive-upload-modal__title">
              Drag & drop your document here, or browse
            </h4>
            <p className="drive-upload-modal__subtitle">
              Supports PDF, Slides, Docs, and Images • Destination: <strong>{targetFolderName}</strong>
            </p>
          </div>
        ) : (
          <div className="drive-upload-modal__file-preview">
            <div className="drive-upload-modal__file-info">
              <FileText size={22} className="text-primary" />
              <div>
                <div className="drive-upload-modal__file-name">{selectedFile.name}</div>
                <div className="drive-upload-modal__file-size">{formatFileSize(selectedFile.size)}</div>
              </div>
            </div>
            {!isUploading && (
              <button
                type="button"
                className="drive-upload-modal__remove-btn"
                onClick={() => setSelectedFile(null)}
                title="Remove selected file"
                aria-label="Remove selected file"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        )}

        {isUploading && (
          <div className="drive-upload-modal__progress-bar">
            <div className="drive-upload-modal__progress-fill" />
          </div>
        )}

        <div className="drive-upload-modal__actions">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleUploadSubmit}
            disabled={!selectedFile || isUploading}
            isLoading={isUploading}
            leftIcon={<UploadCloud size={16} />}
          >
            {isUploading ? 'Uploading to Drive...' : 'Upload to Drive'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export type { DriveUploadModalProps } from './types';
