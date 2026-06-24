import type { NavItem } from '../components/ds';

// Product navigation. `section` starts a new labelled group in the sidebar.
export const NAV: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard', section: 'Main' },
  { id: 'cases', label: 'Cases', icon: 'folder-open' },
  { id: 'viewer', label: 'Slide viewer', icon: 'microscope' },
  { id: 'reports', label: 'Reports', icon: 'file-text' },
  { id: 'controls', label: 'TriControl™ QC', icon: 'shield-check', section: 'Lab' },
  { id: 'team', label: 'Team', icon: 'users', section: 'Admin' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
];

export const NAV_PATH: Record<string, string> = {
  dashboard: '/',
  cases: '/cases',
  viewer: '/viewer',
  reports: '/reports',
  controls: '/controls',
  team: '/team',
  settings: '/settings',
};

export function navIdForPath(pathname: string): string {
  if (pathname === '/') return 'dashboard';
  if (pathname.startsWith('/cases')) return 'cases';
  if (pathname.startsWith('/reports')) return 'reports';
  if (pathname.startsWith('/viewer')) return 'viewer';
  if (pathname.startsWith('/controls')) return 'controls';
  if (pathname.startsWith('/team')) return 'team';
  if (pathname.startsWith('/settings')) return 'settings';
  return 'dashboard';
}
