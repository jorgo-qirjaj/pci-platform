import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ControlChips, Icon } from '../components/ds';
import { api } from '../lib/api';
import type { Case } from '../lib/types';

export function ControlsQC() {
  const navigate = useNavigate();
  const [cases, setCases] = useState<Case[]>([]);

  useEffect(() => {
    api.listCases({}).then((r) => setCases(r.cases));
  }, []);

  const verified = (c: Case) => c.controls.OE && c.controls.WT && c.controls.NULL;

  return (
    <div style={{ padding: '24px 28px', overflowY: 'auto', height: '100%', boxSizing: 'border-box' }}>
      <h1 style={{ fontSize: 24, fontWeight: 600 }}>TriControl™ QC</h1>
      <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 4, marginBottom: 20, maxWidth: 620 }}>
        Every PCI slide carries OE, WT, and NULL p53 cell-line controls. p53AI scores are only valid when all three
        controls are present and pass QC — this is the platform’s calibration anchor.
      </p>

      <div
        style={{
          background: 'var(--surface-card)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-sm)',
          overflow: 'hidden',
        }}
      >
        {cases.map((c, i) => {
          const ok = verified(c);
          return (
            <div
              key={c.accession}
              onClick={() => navigate(`/cases/${c.accession}`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '14px 18px',
                borderTop: i === 0 ? 'none' : '1px solid var(--border-subtle)',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <span
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  background: ok ? 'var(--teal-100)' : 'var(--amber-100)',
                  color: ok ? 'var(--teal-600)' : 'var(--amber-600)',
                }}
              >
                <Icon name={ok ? 'shield-check' : 'shield-alert'} size={17} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 13 }}>{c.accession}</div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
                  {c.biomarker} · {c.site}
                </div>
              </div>
              <ControlChips controls={c.controls} />
              <span style={{ fontSize: 12, fontWeight: 600, width: 96, textAlign: 'right', color: ok ? 'var(--teal-700)' : 'var(--amber-600)' }}>
                {ok ? 'Verified' : 'Pending'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
