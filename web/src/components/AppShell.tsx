import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { SidebarNav } from './ds';
import { TopBar } from './TopBar';
import { NAV, NAV_PATH, navIdForPath } from '../lib/nav';
import { api } from '../lib/api';

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const [caseCount, setCaseCount] = useState<number | undefined>(undefined);
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return JSON.parse(localStorage.getItem('pci.nav.collapsed') ?? 'false');
    } catch {
      return false;
    }
  });

  // Persist sidebar collapse preference.
  useEffect(() => {
    localStorage.setItem('pci.nav.collapsed', JSON.stringify(collapsed));
  }, [collapsed]);

  // Live badge on the Cases nav item.
  useEffect(() => {
    api
      .stats()
      .then((s) => setCaseCount(s.activeCases))
      .catch(() => setCaseCount(undefined));
  }, [location.pathname]);

  const active = navIdForPath(location.pathname);
  const items = NAV.map((it) => (it.id === 'cases' ? { ...it, count: caseCount } : it));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <TopBar />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <SidebarNav
          active={active}
          onSelect={(id) => navigate(NAV_PATH[id] ?? '/')}
          items={items}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((v) => !v)}
          footer={
            <div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 4 }}>AWS S3 · pci-slides</div>
              <div style={{ fontSize: 10, color: 'var(--teal-400)', display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
                Connected
              </div>
            </div>
          }
        />
        <div style={{ flex: 1, overflow: 'hidden', background: 'var(--surface-page)' }}>
          <div key={location.pathname} className="pci-anim-fade" style={{ height: '100%' }}>
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
