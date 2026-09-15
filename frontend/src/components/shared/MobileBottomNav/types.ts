export interface MobileBottomNavProps {
  onOpenQuickCreate: () => void;
  onOpenStudyModal?: () => void;
  onToggleSidebar?: () => void;
}

export type MobileNavTabId = 'library' | 'studio' | 'create';
