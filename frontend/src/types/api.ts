// ==========================================
// EasyFlashcard - API Types
// ==========================================

export interface ApiErrorResponse {
  detail: string | { loc: (string | number)[]; msg: string; type: string }[];
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
}
