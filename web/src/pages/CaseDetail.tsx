import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, CaseStatusBadge, ControlChips, Icon, MagBar, ScoreDisplay, Tissue } from '../components/ds';
import { api } from '../lib/api';
import type { Case } from '../lib/types';
import { gigabytes, shortDateYear } from '../lib/format';

function InfoRow({ k, v, mono = true }: { k: string; v: ReactNode; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6, gap: 8 }}>
      <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{k}</span>
      <span
        style={{
          fontSize: 12,
          color: 'var(--text-primary)',
          fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)',
          textAlign: 'right',
        }}
      >
        {v}
      </span>
    </div>
  );
}

function InfoSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--text-tertiary)',
          marginBottom: 8,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

export function CaseDetail() {
  const { accession = '' } = useParams();
  const navigate = useNavigate();
  const [c, setC] = useState<Case | null>(null);
  const [mag, setMag] = useState(20);
  const [aiOn, setAiOn] = useState(true);
  const [scoring, setScoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setC(null);
    api
      .getCase(accession)
      .then((r) => setC(r.case))
      .catch((err) => setError((err as Error).message));
  }, [accession]);

  // Honor the per-biomarker magnification cap.
  useEffect(() => {
    if (c?.biomarker === 'PDL1' && mag > 20) setMag(20);
  }, [c, mag]);

  const runAI = async () => {
    if (!c) return;
    setScoring(true);
    setError(null);
    try {
      // Brief synthetic latency so the analysis sweep is visible.
      await new Promise((r) => setTimeout(r, 1400));
      const { case: updated } = await api.scoreCase(c.accession);
      setC(updated);
      setAiOn(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setScoring(false);
    }
  };

  const finalize = async () => {
    if (!c) return;
    try {
      await api.finalizeCase(c.accession);
    } catch {
      /* finalize is best-effort from this screen */
    }
    navigate(`/cases/${c.accession}/report`);
  };

  if (error) {
    return <div style={{ padding: 40, color: 'var(--red-600)' }}>{error}</div>;
  }
  if (!c) {
    return (
      <div style={{ padding: 40, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span className="pci-spinner" /> Loading case…
      </div>
    );
  }

  const scored = c.ai !== null;
  const roiLabel = c.annotations[0] ? `${c.annotations[0].id} · ${c.annotations[0].microns}µm` : 'ROI-1';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Case header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 20px',
          borderBottom: '1px solid var(--border-default)',
          background: 'var(--surface-card)',
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => navigate('/cases')}
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
          Cases
        </button>
        <span style={{ width: 1, height: 18, background: 'var(--border-default)' }} />
        <span style={{ fontSize: 15, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{c.accession}</span>
        <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>· {c.biomarker} IHC</span>
        <CaseStatusBadge status={c.status} />
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <Button
            variant="secondary"
            size="sm"
            iconLeft={<Icon name="download" size={14} />}
            onClick={() => navigate(`/cases/${c.accession}/report`)}
          >
            Export PDF
          </Button>
          <Button variant="primary" size="sm" onClick={finalize} disabled={!scored}>
            Finalize report
          </Button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Info panel */}
        <div
          style={{
            width: 232,
            flexShrink: 0,
            borderRight: '1px solid var(--border-default)',
            padding: 16,
            overflowY: 'auto',
            background: 'var(--surface-card)',
          }}
        >
          <InfoSection title="Case">
            <InfoRow k="Accession" v={c.accession} />
            <InfoRow k="Biomarker" v={c.biomarker} />
            <InfoRow k="Site" v={c.site} mono={false} />
            <InfoRow k="Submitted" v={shortDateYear(c.submitted)} />
            <InfoRow k="Pathologist" v={c.pathologist} mono={false} />
          </InfoSection>
          <InfoSection title="Slide">
            <InfoRow k="File" v={c.slide.file} />
            <InfoRow k="Vendor" v={c.slide.vendor} mono={false} />
            <InfoRow k="Objective" v={c.slide.objective} />
            <InfoRow k="Dimensions" v={c.slide.dimensions} />
            <InfoRow k="Size" v={gigabytes(c.slide.sizeBytes)} />
          </InfoSection>
          <InfoSection title="p53 TriControl™">
            <ControlChips controls={c.controls} />
          </InfoSection>
          <InfoSection title="Annotations">
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6 }}>
              {c.annotations.length} region{c.annotations.length === 1 ? '' : 's'} saved
            </div>
            {c.annotations.map((a) => (
              <div key={a.id} style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                {a.id} · {a.microns}µm
              </div>
            ))}
          </InfoSection>
        </div>

        {/* Viewer */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--viewer-canvas)', minWidth: 0 }}>
          <MagBar biomarker={c.biomarker} value={mag} onChange={setMag}>
            <button
              onClick={() => setAiOn(!aiOn)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                fontSize: 11,
                padding: '3px 9px',
                borderRadius: 'var(--radius-xs)',
                cursor: 'pointer',
                border: '1px solid var(--viewer-accent)',
                background: aiOn ? 'rgba(46,230,192,0.15)' : 'transparent',
                color: 'var(--viewer-accent)',
                fontFamily: 'var(--font-sans)',
              }}
            >
              <Icon name="sparkles" size={12} />
              AI overlay
            </button>
            <button
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                fontSize: 11,
                padding: '3px 9px',
                borderRadius: 'var(--radius-xs)',
                cursor: 'pointer',
                border: '1px solid var(--viewer-muted)',
                background: 'transparent',
                color: 'var(--viewer-muted)',
                fontFamily: 'var(--font-sans)',
              }}
            >
              <Icon name="pen-line" size={12} />
              Annotate
            </button>
          </MagBar>
          <div style={{ flex: 1, minHeight: 0 }}>
            <Tissue
              showROI
              showAI={aiOn && scored}
              scanning={scoring}
              label={`${roiLabel}${aiOn && scored ? ' · AI scored' : ''}`}
            />
          </div>
          <div
            style={{
              display: 'flex',
              gap: 20,
              padding: '6px 14px',
              background: 'var(--viewer-panel)',
              borderTop: '1px solid var(--viewer-line)',
              fontSize: 10,
              color: 'var(--viewer-muted)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            <span>{c.slide.file}</span>
            <span>{c.slide.dimensions} px</span>
            <span>{c.slide.vendor.toLowerCase()}</span>
            <span>{c.slide.levels} levels</span>
          </div>
        </div>

        {/* AI panel */}
        <div
          style={{
            width: 288,
            flexShrink: 0,
            borderLeft: '1px solid var(--border-default)',
            padding: 18,
            overflowY: 'auto',
            background: 'var(--surface-card)',
          }}
        >
          {scoring ? (
            <div style={{ textAlign: 'center', padding: '32px 8px' }}>
              <span className="pci-spinner" style={{ width: 28, height: 28, borderWidth: 3, margin: '0 auto 14px' }} />
              <div style={{ fontSize: 14, fontWeight: 600 }}>Running p53AI…</div>
              <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: '6px 0 0' }}>
                Scoring the region against OE / WT / NULL controls.
              </p>
            </div>
          ) : scored && c.ai ? (
            <>
              <ScoreDisplay
                biomarker={c.biomarker}
                score={c.ai.value ?? 0}
                display={c.ai.display}
                pattern={c.ai.pattern}
                patternTone={c.ai.patternTone}
                metric={c.ai.metric}
                positive={c.ai.positive}
                total={c.ai.total}
                confidence={c.ai.confidence}
              />
              <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Button variant="primary" full size="sm" onClick={() => navigate(`/cases/${c.accession}/report`)}>
                  Save to report
                </Button>
                <Button variant="secondary" full size="sm" iconLeft={<Icon name="rotate-cw" size={14} />} onClick={runAI}>
                  Re-run p53AI
                </Button>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '32px 8px' }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: 'var(--purple-100)',
                  color: 'var(--purple-600)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12,
                }}
              >
                <Icon name="sparkles" size={20} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>No AI score yet</div>
              <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: '6px 0 16px' }}>
                {c.slide.status === 'ready'
                  ? 'Select a region of interest, then run p53AI to score this slide.'
                  : 'Slide is still ingesting from S3. Scoring unlocks once upload completes.'}
              </p>
              <Button
                variant="ai"
                full
                size="sm"
                iconLeft={<Icon name="sparkles" size={14} />}
                onClick={runAI}
                disabled={c.slide.status !== 'ready'}
              >
                Run p53AI
              </Button>
              {error && <div style={{ fontSize: 11, color: 'var(--red-600)', marginTop: 10 }}>{error}</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
