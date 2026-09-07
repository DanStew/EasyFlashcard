import type { ReactNode } from 'react';

export interface BreadcrumbItem {
  id: string;
  label: string;
  href?: string;
  icon?: ReactNode;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  onNavigate?: (href: string) => void;
  className?: string;
}
