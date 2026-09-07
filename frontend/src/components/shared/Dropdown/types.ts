import type { ReactNode } from 'react';

export interface DropdownItem {
  id: string;
  label: string;
  icon?: ReactNode;
  variant?: 'default' | 'danger';
  disabled?: boolean;
  isComingSoon?: boolean;
  onClick: () => void;
}

export interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
  className?: string;
}
