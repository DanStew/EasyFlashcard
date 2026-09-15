// ==========================================
// EasyFlashcard - MobileBottomNav Component
// ==========================================

import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Plus,
  Sparkles,
} from 'lucide-react';
import { useHaptics } from '@/hooks/useHaptics';
import type { MobileBottomNavProps } from './types';
import { getActiveMobileTab } from './utils';
import './style.scss';

export function MobileBottomNav({
  onOpenQuickCreate,
}: MobileBottomNavProps) {
  const location = useLocation();
  const { hapticTick } = useHaptics();
  const activeTab = getActiveMobileTab(location.pathname);

  const handleNavClick = () => {
    hapticTick();
  };

  const handleFabClick = () => {
    hapticTick();
    onOpenQuickCreate();
  };

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Navigation Dock">
      {/* 1. Library Tab */}
      <Link
        to="/"
        className={`mobile-bottom-nav__item ${
          activeTab === 'library' && !location.pathname.startsWith('/studio')
            ? 'mobile-bottom-nav__item--active'
            : ''
        }`}
        onClick={handleNavClick}
        aria-label="Flashcard Library"
      >
        <div className="mobile-bottom-nav__icon-wrap">
          <Home size={22} />
        </div>
        <span className="mobile-bottom-nav__label">Library</span>
      </Link>

      {/* 2. Center Quick Action FAB (+) */}
      <div className="mobile-bottom-nav__fab-wrapper">
        <button
          type="button"
          className="mobile-bottom-nav__fab"
          onClick={handleFabClick}
          aria-label="Create New Item"
          title="Create New Item"
        >
          <Plus size={24} strokeWidth={2.5} />
        </button>
      </div>

      {/* 3. AI Studio Tab */}
      <Link
        to="/studio"
        className={`mobile-bottom-nav__item ${
          activeTab === 'studio' ? 'mobile-bottom-nav__item--active' : ''
        }`}
        onClick={handleNavClick}
        aria-label="AI Studio"
      >
        <div className="mobile-bottom-nav__icon-wrap">
          <Sparkles size={22} />
        </div>
        <span className="mobile-bottom-nav__label">AI Studio</span>
      </Link>
    </nav>
  );
}

export type { MobileBottomNavProps } from './types';
