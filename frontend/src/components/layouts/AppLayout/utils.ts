/**
 * Generates navigation classes for AppLayout sidebar and content containers.
 */
export function getAppLayoutClassNames({
  isSidebarOpen = true,
  isStudyMode = false,
}: {
  isSidebarOpen?: boolean;
  isStudyMode?: boolean;
}): { layoutClass: string; sidebarClass: string } {
  const layoutClass = [
    'app-layout',
    isStudyMode && 'app-layout--study-mode',
  ]
    .filter(Boolean)
    .join(' ');

  const sidebarClass = [
    'app-sidebar',
    isSidebarOpen ? 'app-sidebar--open' : 'app-sidebar--collapsed',
  ]
    .filter(Boolean)
    .join(' ');

  return { layoutClass, sidebarClass };
}
