// ==========================================
// DriveFileExplorer - Utilities
// ==========================================

import type { Document, DriveFolderItem } from '@/types/document';

/**
 * Formats byte size into human readable string.
 */
export function formatFileSize(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Formats ISO date string into readable short date.
 */
export function formatItemDate(isoString?: string | null): string {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

/**
 * Determines file icon classification from MIME type or file extension.
 */
export function getFileTypeCategory(mimeType: string, filename: string): 'pdf' | 'slide' | 'doc' | 'image' | 'generic' {
  const lowerName = filename.toLowerCase();
  const lowerMime = mimeType.toLowerCase();

  if (lowerName.endsWith('.pdf') || lowerMime.includes('pdf')) {
    return 'pdf';
  }
  if (
    lowerName.endsWith('.pptx') ||
    lowerName.endsWith('.ppt') ||
    lowerMime.includes('presentation') ||
    lowerMime.includes('powerpoint')
  ) {
    return 'slide';
  }
  if (
    lowerName.endsWith('.docx') ||
    lowerName.endsWith('.doc') ||
    lowerMime.includes('document') ||
    lowerMime.includes('word') ||
    lowerMime.includes('text')
  ) {
    return 'doc';
  }
  if (
    lowerName.endsWith('.png') ||
    lowerName.endsWith('.jpg') ||
    lowerName.endsWith('.jpeg') ||
    lowerName.endsWith('.webp') ||
    lowerMime.includes('image')
  ) {
    return 'image';
  }
  return 'generic';
}

/**
 * Filters folders and documents by search query.
 */
export function filterDriveItems(
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
  const filteredFiles = files.filter((f) =>
    f.name.toLowerCase().includes(query)
  );

  return { filteredFolders, filteredFiles };
}
