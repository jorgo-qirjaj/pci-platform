import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

/** "Slide viewer" nav entry: jump straight into the most recent ready slide. */
export function Viewer() {
  const navigate = useNavigate();
  useEffect(() => {
    api
      .listCases({})
      .then((r) => {
        const ready = r.cases.find((c) => c.slide.status === 'ready') ?? r.cases[0];
        navigate(ready ? `/cases/${ready.accession}` : '/cases', { replace: true });
      })
      .catch(() => navigate('/cases', { replace: true }));
  }, [navigate]);

  return (
    <div style={{ padding: 40, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 10 }}>
      <span className="pci-spinner" /> Opening slide viewer…
    </div>
  );
}
