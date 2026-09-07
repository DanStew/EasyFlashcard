import type { ReactNode } from 'react';
import type { BreadcrumbItem } from '@/components/shared/Breadcrumbs';

export interface AppLayoutProps {
  children?: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  searchValue?: string;
  onSearchChange?: (val: string) => void;
}
