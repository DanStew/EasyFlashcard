// ==========================================
// GroundingDocPicker - Utilities
// ==========================================

import type { Document, DriveFolderItem } from '@/types/document';

/**
 * Formats bytes into human-readable string.
 */
export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Filters folders and documents based on a search query.
 */
export function filterItems(
  subfolders: DriveFolderItem[],
  files: Document[],
  searchQuery: string
): { filteredFolders: DriveFolderItem[]; filteredFiles: Document[] } {
  const query = searchQuery.trim().toLowerCase();
  if (!query) {
    return { filteredFolders: subfolders, filteredFiles: files };
  }

  const filteredFolders = subfolders.filter((f) =>
    f.name.toLowerCase().includes(query)
  );
  const filteredFiles = files.filter((doc) =>
    doc.name.toLowerCase().includes(query)
  );

  return { filteredFolders, filteredFiles };
}

/**
 * Extracts a concise short name or extension badge for a document.
 */
export function getDocTypeLabel(mimeType: string, name: string): string {
  const ext = name.split('.').pop()?.toUpperCase() || '';
  if (ext && ext.length <= 4) return ext;
  if (mimeType.includes('pdf')) return 'PDF';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'DOC';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'PPT';
  if (mimeType.includes('image')) return 'IMG';
  return 'FILE';
}
