// ==========================================
// DocumentDetailView - Types
// ==========================================

import type { Document } from '@/types/document';

export interface DocumentDetailViewProps {
  documentId?: string;
}

export type DocumentDetailProps = DocumentDetailViewProps;

export interface DocumentDetailState {
  document: Document | null;
  isLoading: boolean;
  error: string | null;
}
