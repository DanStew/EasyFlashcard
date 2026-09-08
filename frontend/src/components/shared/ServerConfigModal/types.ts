// ==============================================================================
// EasyFlashcard - Server Config Modal Types
// ==============================================================================

import type { HealthCheckResult } from '@/utils/capacitorUtils';

export interface ServerConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export type ConnectionStatus = 'idle' | 'testing' | 'success' | 'error';

export interface ServerConfigState {
  apiUrl: string;
  isTesting: boolean;
  status: ConnectionStatus;
  testResult: HealthCheckResult | null;
}
