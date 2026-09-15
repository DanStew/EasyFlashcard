// ==========================================
// EasyFlashcard - useQuickAccess Hook
// ==========================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  quickAccessService,
  type ActivityAction,
  type ActivityEntityType,
  type QuickAccessItem,
} from '@/services/quickAccessService';

export interface UseQuickAccessOptions {
  limit?: number;
  fallbackItems?: Array<{ id: string; type: ActivityEntityType; name: string }>;
}

export function useQuickAccess(options: UseQuickAccessOptions = {}) {
  const { limit = 8, fallbackItems } = options;

  const [items, setItems] = useState<QuickAccessItem[]>(() =>
    quickAccessService.getTopQuickAccessItems(limit, fallbackItems)
  );

  const refresh = useCallback(() => {
    setItems(quickAccessService.getTopQuickAccessItems(limit, fallbackItems));
  }, [limit, fallbackItems]);

  useEffect(() => {
    refresh();
    const unsubscribe = quickAccessService.subscribe(refresh);
    return () => unsubscribe();
  }, [refresh]);

  const recordActivity = useCallback(
    (
      entityId: string,
      entityType: ActivityEntityType,
      name: string,
      action: ActivityAction = 'view'
    ) => {
      quickAccessService.recordActivity(entityId, entityType, name, action);
    },
    []
  );

  return useMemo(
    () => ({
      quickAccessItems: items,
      recordActivity,
      refreshQuickAccess: refresh,
    }),
    [items, recordActivity, refresh]
  );
}
