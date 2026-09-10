// ==========================================
// MoveDriveItemModal - Presentation
// ==========================================

import { useState } from 'react';
import { ArrowRight, Folder } from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { Modal } from '@/components/shared/Modal';
import type { MoveDriveItemModalProps } from './types';
import './style.scss';

export function MoveDriveItemModal({
  isOpen,
  item,
  currentFolderId,
  rootFolderId,
  availableFolders,
  onClose,
  onMoveItem,
}: MoveDriveItemModalProps) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!item) return null;

  // Options include Root EasyFlashcard + all available subfolders (excluding the item itself if it's a folder)
  const rootOption = { id: rootFolderId, name: 'EasyFlashcard (Root)' };
  const allDestinations = [
    rootOption,
    ...availableFolders.filter((f) => f.id !== item.id),
  ];

  const handleMove = async () => {
    if (!selectedFolderId || selectedFolderId === currentFolderId) return;

    try {
      setIsSubmitting(true);
      setError(null);
      await onMoveItem(item.id, selectedFolderId, currentFolderId);
      setSelectedFolderId(null);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to move item in Google Drive');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setSelectedFolderId(null);
    setError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Move "${item.name}"`}
      subtitle="Select a target destination folder in your Google Drive"
      size="sm"
    >
      <div className="move-drive-item-modal">
        {error && <div className="form-error-alert">{error}</div>}

        <div className="move-drive-item-modal__folder-list">
          {allDestinations.map((folder) => {
            const isCurrent = folder.id === currentFolderId;
            const isSelected = folder.id === selectedFolderId;

            return (
              <button
                key={folder.id}
                type="button"
                className={`move-drive-item-modal__folder-option ${
                  isSelected ? 'move-drive-item-modal__folder-option--selected' : ''
                } ${isCurrent ? 'move-drive-item-modal__folder-option--current' : ''}`}
                onClick={() => !isCurrent && setSelectedFolderId(folder.id)}
                disabled={isCurrent || isSubmitting}
              >
                <div className="move-drive-item-modal__folder-icon">
                  <Folder size={18} />
                </div>
                <span className="move-drive-item-modal__folder-name">{folder.name}</span>
                {isCurrent && <span className="move-drive-item-modal__badge">Current Location</span>}
              </button>
            );
          })}
        </div>

        <div className="move-drive-item-modal__actions">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleMove}
            isLoading={isSubmitting}
            disabled={isSubmitting || !selectedFolderId || selectedFolderId === currentFolderId}
            leftIcon={<ArrowRight size={16} />}
          >
            Move Here
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export type { MoveDriveItemModalProps } from './types';
