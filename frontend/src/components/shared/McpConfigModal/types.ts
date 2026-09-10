// ==============================================================================
// EasyFlashcard - MCP Config Modal Types
// ==============================================================================

export type McpConfigTab = 'antigravity' | 'claude' | 'env';

export interface McpConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}
