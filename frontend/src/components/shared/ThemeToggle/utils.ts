/**
 * Computes ThemeToggle class name.
 */
export function getThemeToggleClassName(theme: string, className = ''): string {
  return ['theme-toggle', `theme-toggle--${theme}`, className].filter(Boolean).join(' ');
}
