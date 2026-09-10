// ==========================================
// EasyFlashcard - Document & MIME Type Formatters
// ==========================================

export interface FileTypeMetadata {
  category: 'pdf' | 'doc' | 'slide' | 'sheet' | 'image' | 'text' | 'archive' | 'generic';
  label: string;
  badgeLabel: string;
  badgeColor: string;
  extension: string;
}

/**
 * Humanizes complex raw MIME types into friendly names and categories.
 * e.g., 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' -> 'Word Document (.docx)'
 */
export function getFileTypeMetadata(mimeType: string = '', filename: string = ''): FileTypeMetadata {
  const lowerMime = mimeType.toLowerCase();
  const lowerName = filename.toLowerCase();

  // PDF
  if (lowerMime.includes('pdf') || lowerName.endsWith('.pdf')) {
    return {
      category: 'pdf',
      label: 'PDF Document',
      badgeLabel: 'PDF',
      badgeColor: '#ef476f',
      extension: '.pdf',
    };
  }

  // Word / Google Docs / Rich text
  if (
    lowerMime.includes('wordprocessingml') ||
    lowerMime.includes('msword') ||
    lowerName.endsWith('.docx') ||
    lowerName.endsWith('.doc') ||
    lowerMime.includes('application/vnd.google-apps.document')
  ) {
    return {
      category: 'doc',
      label: 'Word Document',
      badgeLabel: 'DOCX',
      badgeColor: '#4361ee',
      extension: '.docx',
    };
  }

  // Presentations / Google Slides / PowerPoint
  if (
    lowerMime.includes('presentationml') ||
    lowerMime.includes('powerpoint') ||
    lowerName.endsWith('.pptx') ||
    lowerName.endsWith('.ppt') ||
    lowerMime.includes('application/vnd.google-apps.presentation')
  ) {
    return {
      category: 'slide',
      label: 'Presentation Slides',
      badgeLabel: 'PPTX',
      badgeColor: '#f77f00',
      extension: '.pptx',
    };
  }

  // Spreadsheets / Excel / Google Sheets
  if (
    lowerMime.includes('spreadsheetml') ||
    lowerMime.includes('excel') ||
    lowerName.endsWith('.xlsx') ||
    lowerName.endsWith('.xls') ||
    lowerName.endsWith('.csv') ||
    lowerMime.includes('application/vnd.google-apps.spreadsheet')
  ) {
    return {
      category: 'sheet',
      label: 'Spreadsheet',
      badgeLabel: 'XLSX',
      badgeColor: '#10b981',
      extension: '.xlsx',
    };
  }

  // Images
  if (
    lowerMime.startsWith('image/') ||
    lowerName.endsWith('.png') ||
    lowerName.endsWith('.jpg') ||
    lowerName.endsWith('.jpeg') ||
    lowerName.endsWith('.webp') ||
    lowerName.endsWith('.svg')
  ) {
    const ext = lowerName.split('.').pop()?.toUpperCase() || 'IMAGE';
    return {
      category: 'image',
      label: 'Image File',
      badgeLabel: ext,
      badgeColor: '#06d6a0',
      extension: `.${ext.toLowerCase()}`,
    };
  }

  // Plain Text / Markdown
  if (lowerMime.includes('text/plain') || lowerMime.includes('text/markdown') || lowerName.endsWith('.txt') || lowerName.endsWith('.md')) {
    return {
      category: 'text',
      label: 'Text Document',
      badgeLabel: lowerName.endsWith('.md') ? 'MD' : 'TXT',
      badgeColor: '#8b5cf6',
      extension: lowerName.endsWith('.md') ? '.md' : '.txt',
    };
  }

  // Fallback generic
  const rawExt = lowerName.includes('.') ? lowerName.split('.').pop()?.toUpperCase() : 'DOC';
  return {
    category: 'generic',
    label: 'Document File',
    badgeLabel: rawExt || 'FILE',
    badgeColor: '#64748b',
    extension: rawExt ? `.${rawExt.toLowerCase()}` : '',
  };
}

/**
 * Formats byte size into human readable string (KB, MB, GB).
 */
export function formatFileSize(bytes?: number | null): string {
  if (bytes === undefined || bytes === null || bytes === 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/**
 * Formats a timestamp into human-readable date.
 */
export function formatItemDate(dateString?: string | null): string {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  } catch {
    return '—';
  }
}

/**
 * Formats timestamp with exact time for detail views.
 */
export function formatFullDateTime(dateString?: string | null): string {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  } catch {
    return '—';
  }
}
