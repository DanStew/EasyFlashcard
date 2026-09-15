// ==========================================
// EasyFlashcard - QuickAccessNav Types
// ==========================================

import type { QuickAccessItem } from '@/services/quickAccessService';

export interface QuickAccessNavProps {
  items: QuickAccessItem[];
  activeId?: string | null;
  onSelectItem?: (item: QuickAccessItem) => void;
  className?: string;
}
