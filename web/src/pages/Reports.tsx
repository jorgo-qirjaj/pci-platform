import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Button, Icon } from '../components/ds';
import { api } from '../lib/api';
import type { Case } from '../lib/types';
import { scoreColor, shortDateYear } from '../lib/format';

export function Reports() {
  const navigate = useNavigate();
  const [cases, setCases] = useState<Case[]>([]);

  useEffect(() => {
    api.listCases({}).then((r) => setCases(r.cases.filter((c) => c.ai)));
  }, []);

  return (
    <div style={{ padding: '24px 28px', overflowY: 'auto', height: '100%', boxSizing: 'border-box' }}>
      <h1 style={{ fontSize: 24, fontWeight: 600 }}>Reports</h1>
      <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 4, marginBottom: 20 }}>
        IHC biomarker reports for AI-scored cases.
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
        {cases.map((c, i) => (
          <div
            key={c.accession}
            onClick={() => navigate(`/cases/${c.accession}/report`)}
            tabIndex={0}
            aria-label={`Open report for ${c.accession}, ${c.biomarker}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigate(`/cases/${c.accession}/report`);
              }
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            onFocus={(e) => (e.currentTarget.style.background = 'var(--surface-hover)')}
            onBlur={(e) => (e.currentTarget.style.background = 'transparent')}
            onMouseDown={(e) => (e.currentTarget.style.background = 'var(--blue-50)')}
            onMouseUp={(e) => (e.currentTarget.style.background = 'var(--surface-hover)')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: '14px 18px',
              borderTop: i === 0 ? 'none' : '1px solid var(--border-subtle)',
              cursor: 'pointer',
              background: 'transparent',
              transition: 'background var(--dur-fast)',
            }}
          >
            <span
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-sm)',
                background: 'var(--blue-50)',
                color: 'var(--action)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon name="file-text" size={18} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 13 }}>{c.accession}</span>
                <Badge tone={c.status === 'complete' ? 'done' : 'ai'}>{c.biomarker} IHC</Badge>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
                {c.site} · Reported {shortDateYear(c.submitted)}
              </div>
            </div>
            <div style={{ textAlign: 'right', marginRight: 8 }}>
              <div style={{ fontSize: 16, fontWeight: 600, fontFamily: 'var(--font-mono)', color: scoreColor(c.ai?.patternTone) }}>
                {c.ai?.display}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{c.ai?.pattern}</div>
            </div>
            <Button variant="secondary" size="sm" onClick={() => navigate(`/cases/${c.accession}/report`)}>
              Open report
            </Button>
          </div>
        ))}
        {cases.length === 0 && (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
            No reports yet. Score a case to generate one.
          </div>
        )}
      </div>
    </div>
  );
}
