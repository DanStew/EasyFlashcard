import { useRef, useState, type KeyboardEvent } from 'react';
import { Check, Folder as FolderIcon, Home } from 'lucide-react';
import { useClickOutside } from '@/hooks/useClickOutside';
import type { FolderSelectProps } from './types';
import { getFolderDisplayInfo, getFolderSelectClassNames } from './utils';
import './style.scss';

/**
 * Shared dropdown selector for choosing a destination folder.
 */
export function FolderSelect({
  folders,
  selectedFolderId,
  onSelectFolder,
  label = 'Destination Folder',
  disabled = false,
  className,
}: FolderSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useClickOutside(containerRef, () => setIsOpen(false), isOpen);

  const { containerClass, triggerClass, dropdownClass } = getFolderSelectClassNames({
    isOpen,
    disabled,
    className,
  });

  const display = getFolderDisplayInfo(folders, selectedFolderId);

  const handleToggle = () => {
    if (disabled) return;
    setIsOpen((prev) => !prev);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen((prev) => !prev);
    }
  };

  const handleSelect = (folderId: string) => {
    onSelectFolder(folderId);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={containerClass}>
      {label && <span className="folder-select__label">{label}</span>}

      <div
        className={triggerClass}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="folder-select__info">
          <span className="folder-select__icon">
            {display.isRoot ? <Home size={16} /> : <FolderIcon size={16} />}
          </span>
          <div className="folder-select__text">
            <span className="folder-select__name">{display.name}</span>
            <span className="folder-select__path">{display.path}</span>
          </div>
        </div>

        <span className="folder-select__badge">
          {isOpen ? 'Done' : 'Change'}
        </span>
      </div>

      <div className={dropdownClass} role="listbox" aria-label="Select destination folder">
        {/* Root Library Option */}
        <button
          type="button"
          className={`folder-select__option ${
            !selectedFolderId ? 'folder-select__option--selected' : ''
          }`}
          onClick={() => handleSelect('')}
          role="option"
          aria-selected={!selectedFolderId}
        >
          <div className="folder-select__option-content">
            <span className="folder-select__option-icon">
              <Home size={15} />
            </span>
            <span className="folder-select__option-name">Root Library</span>
          </div>
          <span className="folder-select__option-path">/</span>
          {!selectedFolderId && (
            <span className="folder-select__check">
              <Check size={14} />
            </span>
          )}
        </button>

        {/* User Folders */}
        {folders.map((folder) => {
          const isSelected = selectedFolderId === folder.id;
          return (
            <button
              key={folder.id}
              type="button"
              className={`folder-select__option ${
                isSelected ? 'folder-select__option--selected' : ''
              }`}
              onClick={() => handleSelect(folder.id)}
              role="option"
              aria-selected={isSelected}
            >
              <div className="folder-select__option-content">
                <span className="folder-select__option-icon">
                  <FolderIcon size={15} />
                </span>
                <span className="folder-select__option-name">{folder.name}</span>
              </div>
              <span className="folder-select__option-path">{folder.path || '/'}</span>
              {isSelected && (
                <span className="folder-select__check">
                  <Check size={14} />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export type { FolderSelectProps, FolderDisplayInfo } from './types';
