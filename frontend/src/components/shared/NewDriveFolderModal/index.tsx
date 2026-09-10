// ==========================================
// NewDriveFolderModal - Presentation
// ==========================================

import { useState, type FormEvent } from 'react';
import { FolderPlus } from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { Modal } from '@/components/shared/Modal';
import type { NewDriveFolderModalProps } from './types';
import './style.scss';

export function NewDriveFolderModal({
  isOpen,
  parentFolderName = 'EasyFlashcard',
  parentFolderId = null,
  onClose,
  onCreateFolder,
}: NewDriveFolderModalProps) {
  const [folderName, setFolderName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = folderName.trim();
    if (!trimmed) {
      setError('Please enter a folder name');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onCreateFolder(trimmed, parentFolderId);
      setFolderName('');
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create folder in Google Drive');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setFolderName('');
    setError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create Google Drive Folder"
      subtitle={`Inside folder: "${parentFolderName}"`}
      size="sm"
    >
      <form onSubmit={handleSubmit} className="new-drive-folder-modal">
        <Input
          label="Folder Name"
          placeholder="e.g. Biology 101, Midterms, Chapter 4..."
          value={folderName}
          onChange={(e) => {
            setFolderName(e.target.value);
            if (error) setError(null);
          }}
          error={error || undefined}
          autoFocus
          fullWidth
          required
        />

        <div className="new-drive-folder-modal__actions">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            disabled={isSubmitting || !folderName.trim()}
            leftIcon={<FolderPlus size={16} />}
          >
            Create Folder
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export type { NewDriveFolderModalProps } from './types';
