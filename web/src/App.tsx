import type { ReactNode } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './lib/auth';
import { AppShell } from './components/AppShell';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { CaseDetail } from './pages/CaseDetail';
import { Report } from './pages/Report';
import { Reports } from './pages/Reports';
import { ControlsQC } from './pages/ControlsQC';
import { Team } from './pages/Team';
import { Settings } from './pages/Settings';
import { Viewer } from './pages/Viewer';

function FullScreenLoader() {
  return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'var(--text-tertiary)' }}>
      <span className="pci-spinner" /> Loading…
    </div>
  );
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <FullScreenLoader />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return <>{children}</>;
}

export function App() {
  const { user, loading } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={loading ? <FullScreenLoader /> : user ? <Navigate to="/" replace /> : <Login />} />
      <Route
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/cases" element={<Dashboard />} />
        <Route path="/cases/:accession" element={<CaseDetail />} />
        <Route path="/cases/:accession/report" element={<Report />} />
        <Route path="/viewer" element={<Viewer />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/controls" element={<ControlsQC />} />
        <Route path="/team" element={<Team />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
