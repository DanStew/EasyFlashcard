// ==========================================
// DocumentDetailView - Utilities
// ==========================================

export {
  formatFileSize as formatDocumentSize,
  formatFullDateTime as formatFullDate,
  getFileTypeMetadata,
} from '@/utils/documentFormatters';

/**
 * Truncates long ID strings safely for display.
 */
export function truncateId(id?: string | null, length = 12): string {
  if (!id) return '—';
  if (id.length <= length) return id;
  return `${id.slice(0, length)}...`;
}
