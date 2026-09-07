/**
 * Generates navigation classes for AppLayout sidebar and content containers.
 */
export function getAppLayoutClassNames({
  isSidebarOpen = true,
}: {
  isSidebarOpen?: boolean;
}): { layoutClass: string; sidebarClass: string } {
  const layoutClass = 'app-layout';
  const sidebarClass = [
    'app-sidebar',
    isSidebarOpen ? 'app-sidebar--open' : 'app-sidebar--collapsed',
  ]
    .filter(Boolean)
    .join(' ');

  return { layoutClass, sidebarClass };
}
