import type { MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import type { BreadcrumbsProps } from './types';
import { getBreadcrumbsClassName } from './utils';
import './style.scss';

export function Breadcrumbs({ items, onNavigate, className }: BreadcrumbsProps) {
  const navigate = useNavigate();
  const rootClassName = getBreadcrumbsClassName(className);

  const handleClick = (e: MouseEvent<HTMLAnchorElement>, href?: string) => {
    if (!href) return;
    e.preventDefault();
    if (onNavigate) {
      onNavigate(href);
    } else {
      navigate(href);
    }
  };

  return (
    <nav className={rootClassName} aria-label="Breadcrumb">
      <ol className="breadcrumbs__list">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={item.id} className="breadcrumbs__item">
              {isLast ? (
                <span className="breadcrumbs__current" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <a
                  href={item.href || '#'}
                  className="breadcrumbs__link"
                  onClick={(e) => handleClick(e, item.href)}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </a>
              )}

              {!isLast && (
                <span className="breadcrumbs__separator" aria-hidden="true">
                  <ChevronRight size={14} />
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export type { BreadcrumbItem, BreadcrumbsProps } from './types';
