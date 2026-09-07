import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import type { ThemeToggleProps } from './types';
import { getThemeToggleClassName } from './utils';
import './style.scss';

export function ThemeToggle({ showLabel = false, className }: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme } = useTheme();

  const isDark = resolvedTheme === 'dark';
  const rootClassName = getThemeToggleClassName(resolvedTheme, className);

  return (
    <button
      type="button"
      className={rootClassName}
      onClick={toggleTheme}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <span className="theme-toggle__icon-wrapper">
        {isDark ? <Moon size={16} /> : <Sun size={16} />}
      </span>
      {showLabel && (
        <span className="theme-toggle__label">{isDark ? 'Dark Mode' : 'Light Mode'}</span>
      )}
    </button>
  );
}

export type { ThemeToggleProps } from './types';
