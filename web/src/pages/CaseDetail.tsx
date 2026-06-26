import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, CaseStatusBadge, ControlChips, Icon, ScoreDisplay } from '../components/ds';
import { SlideViewer } from '../components/viewer/SlideViewer';
import { api } from '../lib/api';
import type { Case } from '../lib/types';
import { gigabytes, shortDateYear } from '../lib/format';

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: 'var(--text-tertiary)',
        marginBottom: 10,
      }}
    >
      {children}
    </div>
  );
}

function InfoRow({ k, v, mono = false }: { k: string; v: ReactNode; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 7, gap: 8 }}>
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

function Divider() {
  return <div style={{ height: 1, background: 'var(--border-subtle)', margin: '16px 0' }} />;
}

export function CaseDetail() {
  const { accession = '' } = useParams();
  const navigate = useNavigate();
  const [c, setC] = useState<Case | null>(null);
  const [mag, setMag] = useState(20);
  const [aiOn, setAiOn] = useState(true);
  const [activeTool, setActiveTool] = useState('move');
  const [scoring, setScoring] = useState(false);
  const [slideId, setSlideId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setC(null);
    api
      .getCase(accession)
      .then((r) => setC(r.case))
      .catch((err) => setError((err as Error).message));
  }, [accession]);

  // Resolve a real whole-slide image for this case from the tile server.
  // (Deterministic per-accession pick so a case always maps to the same slide.)
  useEffect(() => {
    let active = true;
    fetch('/slides/')
      .then((r) => r.json())
      .then((d: { slides?: string[] }) => {
        if (!active) return;
        const list = d.slides ?? [];
        if (!list.length) return setSlideId(null);
        const h = [...accession].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
        setSlideId(list[h % list.length]);
      })
      .catch(() => {
        if (active) setSlideId(null);
      });
    return () => {
      active = false;
    };
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
  const regions = c.annotations.map((a) => ({
    id: a.id,
    area: a.microns,
    rect: a.rect,
    type: a.type,
    points: a.points,
    text: a.text,
  }));

  // Persist a drawn annotation to the case, then refresh from the returned case.
  const handleAddRegion = async (region: {
    type: string;
    microns: number;
    rect?: { x: number; y: number; width: number; height: number };
    points?: { x: number; y: number }[];
    text?: string;
  }) => {
    try {
      const { case: updated } = await api.addAnnotation(c.accession, region);
      setC(updated);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleDeleteRegion = async (id: string) => {
    try {
      const { case: updated } = await api.deleteAnnotation(c.accession, id);
      setC(updated);
    } catch (err) {
      setError((err as Error).message);
    }
  };

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
          {/* 1) Case */}
          <SectionLabel>Case</SectionLabel>
          <InfoRow k="Accession" v={c.accession} mono />
          <InfoRow k="Biomarker" v={c.biomarker} mono />
          <InfoRow k="Site" v={c.site} />
          <InfoRow k="Received" v={shortDateYear(c.received)} />
          <InfoRow k="Pathologist" v={c.pathologist} />

          <Divider />

          {/* 2) Active slide */}
          <SectionLabel>Active slide</SectionLabel>
          <InfoRow k="File" v={c.slide.file} mono />
          <InfoRow k="Vendor" v={c.slide.vendor} />
          <InfoRow k="Objective" v={c.slide.objective} />
          <InfoRow k="Dimensions" v={c.slide.dimensions} mono />
          <InfoRow k="Size" v={gigabytes(c.slide.sizeBytes)} />

          <Divider />

          {/* 3) p53 TriControl */}
          <SectionLabel>p53 TriControl™</SectionLabel>
          <ControlChips controls={c.controls} />

          <Divider />

          {/* 4) Regions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--text-tertiary)',
              }}
            >
              Regions
            </span>
            <button
              onClick={() => setActiveTool('roi')}
              title="Draw a region of interest on the slide"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-link)',
                fontSize: 11,
                fontFamily: 'var(--font-sans)',
                padding: 0,
              }}
            >
              <Icon name="plus" size={13} />
              Add
            </button>
          </div>
          {c.annotations.length === 0 ? (
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>No regions — draw one or click Add</div>
          ) : (
            c.annotations.map((a) => (
              <div
                key={a.id}
                style={{
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '9px 10px',
                  marginBottom: 7,
                  cursor: 'pointer',
                  transition: 'border-color var(--dur-fast), background var(--dur-fast)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-strong)';
                  e.currentTarget.style.background = 'var(--surface-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span
                    style={{ width: 7, height: 7, borderRadius: 2, background: 'var(--ctrl-wt)', flexShrink: 0 }}
                  />
                  <span style={{ fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{a.id}</span>
                  <span
                    style={{
                      marginLeft: 'auto',
                      fontSize: 10,
                      color: 'var(--text-tertiary)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {a.type === 'point' ? 'pin' : `${a.microns} µm`}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteRegion(a.id);
                    }}
                    title="Delete region"
                    aria-label={`Delete ${a.id}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 22,
                      height: 22,
                      marginLeft: 2,
                      padding: 0,
                      border: 'none',
                      borderRadius: 'var(--radius-xs)',
                      background: 'transparent',
                      color: 'var(--text-tertiary)',
                      cursor: 'pointer',
                      transition: 'background var(--dur-fast), color var(--dur-fast)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--red-100)';
                      e.currentTarget.style.color = 'var(--red-600)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--text-tertiary)';
                    }}
                  >
                    <Icon name="trash-2" size={13} />
                  </button>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                  {a.text
                    ? a.text
                    : a.type === 'point'
                      ? 'Pin'
                      : a.type === 'line'
                        ? 'Line measurement'
                        : a.type === 'freehand'
                          ? 'Freehand'
                          : a.type === 'polygon'
                            ? 'Polygon'
                            : 'Region of interest'}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{c.pathologist}</div>
              </div>
            ))
          )}
        </div>

        {/* Viewer — real OpenSeadragon whole-slide viewer backed by the tile server */}
        <SlideViewer
          slideId={slideId}
          mag={mag}
          onMagChange={setMag}
          aiOn={aiOn}
          onToggleAI={() => setAiOn((v) => !v)}
          activeTool={activeTool}
          onToolChange={setActiveTool}
          biomarker={c.biomarker}
          regions={regions}
          isScored={scored && !scoring}
          counterLabel={c.slide.file}
          onAddRegion={handleAddRegion}
        />

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
