import { useState, type MouseEvent } from 'react';
import { ChevronRight, Folder as FolderIcon, FolderOpen, Plus } from 'lucide-react';
import type { FolderTreeItem } from '@/types/folder';
import type { FolderTreeNavProps } from './types';
import { getFolderItemClassNames } from './utils';
import './style.scss';

interface FolderNodeProps {
  item: FolderTreeItem;
  activeFolderId?: string | null;
  onSelectFolder?: (folderId: string) => void;
  onCreateSubfolder?: (parentId: string) => void;
}

function FolderNode({
  item,
  activeFolderId,
  onSelectFolder,
  onCreateSubfolder,
}: FolderNodeProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasSubfolders = Boolean(item.subfolders && item.subfolders.length > 0);
  const isActive = activeFolderId === item.id;

  const handleToggle = (e: MouseEvent) => {
    e.stopPropagation();
    setIsExpanded((prev) => !prev);
  };

  const handleSelect = () => {
    if (onSelectFolder) onSelectFolder(item.id);
  };

  const handleAddSubfolder = (e: MouseEvent) => {
    e.stopPropagation();
    if (onCreateSubfolder) onCreateSubfolder(item.id);
  };

  const rowClassName = getFolderItemClassNames({
    isActive,
    isExpanded,
    hasChildren: hasSubfolders,
  });

  return (
    <div className="folder-node">
      <div className={rowClassName} onClick={handleSelect}>
        {hasSubfolders ? (
          <span className="folder-nav-item__toggle" onClick={handleToggle}>
            <ChevronRight size={14} />
          </span>
        ) : (
          <span className="folder-nav-item__toggle folder-nav-item__toggle--placeholder" />
        )}

        <span className="folder-nav-item__icon">
          {isExpanded || isActive ? <FolderOpen size={16} /> : <FolderIcon size={16} />}
        </span>

        <span className="folder-nav-item__name" title={item.name}>
          {item.name}
        </span>

        {item.setCount > 0 && (
          <span className="folder-nav-item__count" title={`${item.setCount} sets`}>
            {item.setCount}
          </span>
        )}

        {onCreateSubfolder && (
          <div className="folder-nav-item__actions">
            <button
              type="button"
              className="folder-nav-item__action-btn"
              onClick={handleAddSubfolder}
              title="Add subfolder"
              aria-label="Add subfolder"
            >
              <Plus size={12} />
            </button>
          </div>
        )}
      </div>

      {isExpanded && hasSubfolders && (
        <div className="folder-node__children">
          {item.subfolders.map((child) => (
            <FolderNode
              key={child.id}
              item={child}
              activeFolderId={activeFolderId}
              onSelectFolder={onSelectFolder}
              onCreateSubfolder={onCreateSubfolder}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FolderTreeNav({
  tree,
  activeFolderId,
  onSelectFolder,
  onCreateSubfolder,
  isLoading,
}: FolderTreeNavProps) {
  if (isLoading) {
    return <div className="folder-tree-nav__empty">Loading folders...</div>;
  }

  if (!tree || tree.length === 0) {
    return <div className="folder-tree-nav__empty">No folders created yet</div>;
  }

  return (
    <div className="folder-tree-nav">
      {tree.map((item) => (
        <FolderNode
          key={item.id}
          item={item}
          activeFolderId={activeFolderId}
          onSelectFolder={onSelectFolder}
          onCreateSubfolder={onCreateSubfolder}
        />
      ))}
    </div>
  );
}

export type { FolderTreeNavProps } from './types';
