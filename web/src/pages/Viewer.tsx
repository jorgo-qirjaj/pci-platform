import { useCallback, useEffect, useState } from 'react';
import { Button, Icon } from '../components/ds';
import { SlideViewer } from '../components/viewer/SlideViewer';
import { UploadZone } from '../components/UploadZone';

/**
 * Slide Viewer — a standalone destination (not a per-case view): a slide
 * library on the left, the OpenSeadragon viewer in the middle, and slide upload.
 */
export function Viewer() {
  const [slides, setSlides] = useState<string[]>([]);
  const [slideId, setSlideId] = useState<string | null>(null);
  const [mag, setMag] = useState(20);
  const [aiOn, setAiOn] = useState(false);
  const [activeTool, setActiveTool] = useState('move');
  const [showUpload, setShowUpload] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadSlides = useCallback(() => {
    fetch('/slides/')
      .then((r) => r.json())
      .then((d: { slides?: string[] }) => {
        const list = d.slides ?? [];
        setSlides(list);
        setSlideId((prev) => (prev && list.includes(prev) ? prev : list[0] ?? null));
      })
      .catch(() => setSlides([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(loadSlides, [loadSlides]);

  const idx = slideId ? slides.indexOf(slideId) : -1;
  const prevSlide = () => {
    if (!slides.length) return;
    setSlideId(slides[idx <= 0 ? slides.length - 1 : idx - 1]);
  };
  const nextSlide = () => {
    if (!slides.length) return;
    setSlideId(slides[(idx + 1) % slides.length]);
  };
  const counterLabel = slides.length ? `${Math.max(1, idx + 1)} / ${slides.length}` : '— / —';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
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
        <span style={{ fontSize: 15, fontWeight: 600 }}>Slide viewer</span>
        <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
          · {slides.length} slide{slides.length === 1 ? '' : 's'} in library
        </span>
        <div style={{ marginLeft: 'auto' }}>
          <Button variant="primary" size="sm" iconLeft={<Icon name="upload" size={14} />} onClick={() => setShowUpload(true)}>
            Upload slide
          </Button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Library */}
        <div
          style={{
            width: 232,
            flexShrink: 0,
            borderRight: '1px solid var(--border-default)',
            overflowY: 'auto',
            background: 'var(--surface-card)',
            padding: 12,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--text-tertiary)',
              margin: '4px 6px 10px',
            }}
          >
            Slide library
          </div>
          {slides.map((s) => {
            const on = s === slideId;
            return (
              <button
                key={s}
                onClick={() => setSlideId(s)}
                title={s}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  width: '100%',
                  textAlign: 'left',
                  padding: '9px 10px',
                  marginBottom: 4,
                  border: `1px solid ${on ? 'var(--border-strong)' : 'transparent'}`,
                  background: on ? 'var(--surface-hover)' : 'transparent',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  transition: 'background var(--dur-fast), border-color var(--dur-fast)',
                }}
                onMouseEnter={(e) => {
                  if (!on) e.currentTarget.style.background = 'var(--surface-hover)';
                }}
                onMouseLeave={(e) => {
                  if (!on) e.currentTarget.style.background = 'transparent';
                }}
              >
                <Icon name="microscope" size={15} style={{ color: on ? 'var(--action)' : 'var(--text-tertiary)', flexShrink: 0 }} />
                <span
                  style={{
                    fontSize: 12,
                    fontFamily: 'var(--font-mono)',
                    color: on ? 'var(--action)' : 'var(--text-secondary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {s}
                </span>
              </button>
            );
          })}
          {!loading && slides.length === 0 && (
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', padding: '8px 6px' }}>No slides yet — upload one.</div>
          )}
        </div>

        {/* Viewer */}
        <SlideViewer
          slideId={slideId}
          mag={mag}
          onMagChange={setMag}
          aiOn={aiOn}
          onToggleAI={() => setAiOn((v) => !v)}
          activeTool={activeTool}
          onToolChange={setActiveTool}
          onPrevSlide={prevSlide}
          onNextSlide={nextSlide}
          counterLabel={counterLabel}
          regions={[]}
          isScored={false}
        />
      </div>

      {/* Upload modal */}
      {showUpload && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            background: 'rgba(11,46,95,0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={() => setShowUpload(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="pci-anim-pop"
            style={{ width: '100%', maxWidth: 440, background: 'var(--surface-card)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-xl)', padding: 24 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <h2 style={{ fontSize: 19, fontWeight: 600 }}>Upload a slide</h2>
              <span style={{ cursor: 'pointer', color: 'var(--text-tertiary)' }} onClick={() => setShowUpload(false)}>
                <Icon name="x" size={18} />
              </span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 18 }}>
              The slide is stored in AWS S3 and appears in the library once ingested.
            </p>
            <UploadZone onUploaded={() => loadSlides()} />
          </div>
        </div>
      )}
    </div>
  );
}
