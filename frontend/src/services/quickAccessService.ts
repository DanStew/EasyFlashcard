// ==========================================
// EasyFlashcard - QuickAccess & Frecency Service
// ==========================================

export type ActivityAction = 'view' | 'study';
export type ActivityEntityType = 'set' | 'folder';

export interface ActivityEvent {
  id: string;
  entityId: string;
  entityType: ActivityEntityType;
  name: string;
  action: ActivityAction;
  timestamp: number;
}

export interface QuickAccessItem {
  id: string;
  type: ActivityEntityType;
  name: string;
  score: number;
  lastAccessedAt: number;
}

const STORAGE_KEY = 'easyflashcard_activity_log';
const MAX_EVENTS_STORED = 200;
const QUICK_ACCESS_CHANGE_EVENT = 'easyflashcard_quick_access_change';

// Action weight configuration
const ACTION_WEIGHTS: Record<ActivityAction, number> = {
  study: 10,
  view: 3,
};

/**
 * Service to manage activity tracking and compute Frecency-ranked Quick Access items.
 */
class QuickAccessService {
  /**
   * Load stored activity events from localStorage safely.
   */
  public getStoredEvents(): ActivityEvent[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err: unknown) {
      console.warn('Failed to parse activity log from localStorage', err);
      return [];
    }
  }

  /**
   * Save activity events to localStorage.
   */
  private saveEvents(events: ActivityEvent[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
      window.dispatchEvent(new CustomEvent(QUICK_ACCESS_CHANGE_EVENT));
    } catch (err: unknown) {
      console.warn('Failed to save activity log to localStorage', err);
    }
  }

  /**
   * Record a user action (viewing or studying a set/folder).
   */
  public recordActivity(
    entityId: string,
    entityType: ActivityEntityType,
    name: string,
    action: ActivityAction = 'view'
  ): void {
    if (!entityId || !name) return;

    const newEvent: ActivityEvent = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      entityId,
      entityType,
      name: name.trim(),
      action,
      timestamp: Date.now(),
    };

    const currentEvents = this.getStoredEvents();
    // Prepend new event and keep within bounds
    const updatedEvents = [newEvent, ...currentEvents].slice(0, MAX_EVENTS_STORED);
    this.saveEvents(updatedEvents);
  }

  /**
   * Calculate frecency score for a single event using time-bucket decay multipliers.
   */
  private calculateEventScore(event: ActivityEvent, now: number): number {
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    const ageInDays = (now - event.timestamp) / ONE_DAY_MS;
    const baseWeight = ACTION_WEIGHTS[event.action] ?? 1;

    let recencyMultiplier = 1;
    if (ageInDays <= 1) {
      recencyMultiplier = 100; // Within last 24 hours
    } else if (ageInDays <= 7) {
      recencyMultiplier = 70; // Within last 7 days
    } else if (ageInDays <= 30) {
      recencyMultiplier = 30; // Within last 30 days
    } else if (ageInDays <= 90) {
      recencyMultiplier = 10; // Within last 90 days
    } else {
      recencyMultiplier = 1; // Older than 90 days
    }

    return baseWeight * recencyMultiplier;
  }

  /**
   * Compute top Frecency-ranked quick access items.
   *
   * @param limit Maximum number of items to return (default 8)
   * @param fallbackItems Optional fallback items (e.g. from loaded folderTree or sets)
   */
  public getTopQuickAccessItems(
    limit: number = 8,
    fallbackItems?: Array<{ id: string; type: ActivityEntityType; name: string }>
  ): QuickAccessItem[] {
    const events = this.getStoredEvents();
    const now = Date.now();

    // Aggregate scores per entityId
    const itemMap = new Map<string, QuickAccessItem>();

    for (const event of events) {
      const score = this.calculateEventScore(event, now);
      const existing = itemMap.get(event.entityId);

      if (existing) {
        existing.score += score;
        if (event.timestamp > existing.lastAccessedAt) {
          existing.lastAccessedAt = event.timestamp;
          existing.name = event.name; // Keep name fresh
        }
      } else {
        itemMap.set(event.entityId, {
          id: event.entityId,
          type: event.entityType,
          name: event.name,
          score,
          lastAccessedAt: event.timestamp,
        });
      }
    }

    const rankedItems = Array.from(itemMap.values()).sort(
      (a, b) => b.score - a.score || b.lastAccessedAt - a.lastAccessedAt
    );

    // If we have enough items, return top N
    if (rankedItems.length >= limit || !fallbackItems || fallbackItems.length === 0) {
      return rankedItems.slice(0, limit);
    }

    // Otherwise, supplement with fallback items that aren't already present
    const existingIds = new Set(rankedItems.map((item) => item.id));
    const supplemental: QuickAccessItem[] = [];

    for (const fb of fallbackItems) {
      if (!existingIds.has(fb.id)) {
        supplemental.push({
          id: fb.id,
          type: fb.type,
          name: fb.name,
          score: 0,
          lastAccessedAt: 0,
        });
        existingIds.add(fb.id);
        if (rankedItems.length + supplemental.length >= limit) break;
      }
    }

    return [...rankedItems, ...supplemental].slice(0, limit);
  }

  /**
   * Subscribe to changes in quick access activity.
   */
  public subscribe(callback: () => void): () => void {
    const handler = () => callback();
    window.addEventListener(QUICK_ACCESS_CHANGE_EVENT, handler);
    window.addEventListener('storage', handler);

    return () => {
      window.removeEventListener(QUICK_ACCESS_CHANGE_EVENT, handler);
      window.removeEventListener('storage', handler);
    };
  }
}

export const quickAccessService = new QuickAccessService();
