import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, ControlChips, Icon, Tissue } from '../components/ds';
import { api } from '../lib/api';
import type { ReportPayload } from '../lib/types';
import { shortDateYear } from '../lib/format';

export function Report() {
  const { accession = '' } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<ReportPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<null | 'print' | 'pdf'>(null);

  const runExport = (kind: 'print' | 'pdf') => {
    setExporting(kind);
    // Brief visible feedback before the (blocking) print dialog opens.
    setTimeout(() => {
      window.print();
      setExporting(null);
    }, 450);
  };

  useEffect(() => {
    api
      .getReport(accession)
      .then((r) => setData(r.report))
      .catch((err) => setError((err as Error).message));
  }, [accession]);

  if (error) return <div style={{ padding: 40, color: 'var(--red-600)' }}>{error}</div>;
  if (!data) {
    return (
      <div style={{ padding: 40, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span className="pci-spinner" /> Loading report…
      </div>
    );
  }

  const { case: c, ai, metric, interpretation, disclaimer, lab } = data;
  const patternColor = ai.patternTone === 'wt' ? 'var(--ctrl-wt)' : 'var(--ctrl-oe)';
  const meta: [string, string][] = [
    ['Accession #', c.accession],
    ['Biomarker', `${c.biomarker} (IHC)`],
    ['Specimen', c.specimen],
    ['Block', c.block],
    ['Received', shortDateYear(c.received)],
    ['Reported', shortDateYear(c.submitted)],
    ['Ordering site', c.site],
    ['Pathologist', c.pathologist],
  ];

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: 'var(--surface-sunken)' }}>
      {/* Report toolbar */}
      <div
        className="no-print"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 20px',
          background: 'var(--surface-card)',
          borderBottom: '1px solid var(--border-default)',
        }}
      >
        <button
          onClick={() => navigate(`/cases/${c.accession}`)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-link)',
            fontSize: 13,
            fontFamily: 'var(--font-sans)',
            padding: 0,
          }}
        >
          <Icon name="arrow-left" size={15} />
          Back to case
        </button>
        <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Report preview · {c.accession}</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <Button
            variant="secondary"
            size="sm"
            iconLeft={<Icon name="printer" size={14} />}
            onClick={() => runExport('print')}
            disabled={exporting !== null}
          >
            {exporting === 'print' ? 'Preparing…' : 'Print'}
          </Button>
          <Button
            variant="primary"
            size="sm"
            iconLeft={<Icon name="download" size={14} />}
            onClick={() => runExport('pdf')}
            disabled={exporting !== null}
          >
            {exporting === 'pdf' ? 'Generating…' : 'Download PDF'}
          </Button>
        </div>
      </div>

      {/* The page */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '28px 0 48px' }}>
        <div
          className="report-print-root"
          style={{
            width: 720,
            background: '#fff',
            boxShadow: 'var(--shadow-lg)',
            borderRadius: 4,
            padding: '40px 44px',
            fontFamily: 'var(--font-sans)',
          }}
        >
          {/* Letterhead */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              borderBottom: '2px solid var(--navy-800)',
              paddingBottom: 16,
            }}
          >
            <img src="/assets/logo-lockup.svg" height={38} alt="PCI" />
            <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>IHC Biomarker Report</div>
              {lab.address}
              <br />
              {lab.accreditation}
            </div>
          </div>

          {/* Meta grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 32px', margin: '20px 0 24px' }}>
            {meta.map(([k, v]) => (
              <div
                key={k}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid var(--border-subtle)',
                  padding: '5px 0',
                  fontSize: 12,
                }}
              >
                <span style={{ color: 'var(--text-tertiary)' }}>{k}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-primary)', textAlign: 'right' }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Images */}
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--text-tertiary)',
              marginBottom: 8,
            }}
          >
            Representative fields
          </div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
            <div style={{ flex: 1 }}>
              <div style={{ height: 150, borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border-default)' }}>
                <Tissue showROI={false} />
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>H&E · 20x</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ height: 150, borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border-default)' }}>
                <Tissue showROI showAI label="AI scored region" />
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>
                {c.biomarker} IHC + p53AI overlay · 20x
              </div>
            </div>
          </div>

          {/* Result */}
          <div
            style={{
              display: 'flex',
              gap: 20,
              background: 'var(--slate-50)',
              border: '1px solid var(--border-default)',
              borderRadius: 8,
              padding: 18,
              marginBottom: 20,
            }}
          >
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>p53AI score</div>
              <div style={{ fontSize: 34, fontWeight: 600, color: 'var(--action)', lineHeight: 1.1 }}>{ai.display}</div>
              <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{metric.toLowerCase()}</div>
            </div>
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px', fontSize: 12, alignContent: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-tertiary)' }}>Pattern</span>
                <span style={{ fontWeight: 600, color: patternColor }}>{ai.pattern}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-tertiary)' }}>Positive</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{ai.positive.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-tertiary)' }}>Confidence</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--teal-700)' }}>{ai.confidence}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-tertiary)' }}>Total</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{ai.total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Controls QC */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>TriControl™ QC verified:</span>
            <ControlChips controls={c.controls} />
          </div>

          {/* Interpretation */}
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--text-tertiary)',
              marginBottom: 6,
            }}
          >
            Interpretation
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: 16 }}>{interpretation}</p>

          {/* Disclaimer */}
          <div
            style={{
              fontSize: 10,
              color: 'var(--text-tertiary)',
              lineHeight: 1.5,
              borderTop: '1px solid var(--border-subtle)',
              paddingTop: 12,
              marginBottom: 20,
            }}
          >
            {disclaimer}
          </div>

          {/* Signature */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--navy-800)', fontStyle: 'italic' }}>
                {c.pathologist.replace(/,.*$/, '')}
              </div>
              <div
                style={{
                  borderTop: '1px solid var(--border-strong)',
                  marginTop: 4,
                  paddingTop: 4,
                  fontSize: 11,
                  color: 'var(--text-tertiary)',
                }}
              >
                {c.pathologist} · Pathologist · {shortDateYear(c.submitted)}
              </div>
            </div>
            <img src="/assets/logo-mark.svg" width={34} height={34} style={{ opacity: 0.4 }} alt="" />
          </div>
        </div>
      </div>
    </div>
  );
}
