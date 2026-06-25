import { useEffect, useRef, useState } from 'react';
import OpenSeadragon from 'openseadragon';
import {
  Hand,
  SquareDashed,
  Hexagon,
  PenTool,
  Ruler,
  MessageSquare,
  Sparkles,
  Maximize,
  Navigation,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { MagBar } from '../ds';
import type { Biomarker } from '../../lib/types';

// Tiles are served by the FastAPI/OpenSlide tile server. In dev, Vite proxies
// /slides and /tiles to it (see vite.config.ts), so relative URLs avoid CORS.
const API_BASE = '';

const SCALE_MAP: Record<number, string> = { 1: '2 mm', 5: '500 µm', 10: '250 µm', 20: '100 µm', 40: '50 µm' };

const ROI_POSITIONS = [
  { top: '21%', left: '25%', width: '35%', height: '35%' },
  { top: '58%', left: '60%', width: '21%', height: '21%' },
  { top: '40%', left: '10%', width: '20%', height: '25%' },
  { top: '10%', left: '55%', width: '18%', height: '20%' },
];
const ROI_BORDER_COLORS = ['var(--viewer-accent)', 'rgba(58,107,240,0.85)', 'var(--viewer-accent)', 'rgba(58,107,240,0.85)'];
const ROI_LABEL_COLORS = ['var(--viewer-accent)', 'var(--blue-300)', 'var(--viewer-accent)', 'var(--blue-300)'];

function stipple(color: string, n: number, seed: number): string {
  let s = '';
  let r = seed;
  const rnd = () => {
    r = (r * 9301 + 49297) % 233280;
    return r / 233280;
  };
  for (let i = 0; i < n; i++) {
    const x = (rnd() * 100).toFixed(1);
    const y = (rnd() * 100).toFixed(1);
    const sz = (rnd() * 8 + 2.5).toFixed(1);
    s += `radial-gradient(circle ${sz}px at ${x}% ${y}%, ${color}, transparent 72%),`;
  }
  return s;
}

function aiBg(seed: number): string {
  return (
    stipple('rgba(46,230,192,0.85)', 22, seed) +
    stipple('rgba(46,230,192,0.5)', 14, seed + 200) +
    'radial-gradient(circle at 42% 40%, rgba(46,230,192,0.28), transparent 62%)'
  );
}

const TOOL_DEFS = [
  { id: 'move', icon: Hand, label: 'Pan' },
  { id: 'roi', icon: SquareDashed, label: 'Rectangle ROI' },
  { id: 'poly', icon: Hexagon, label: 'Polygon region' },
  { id: 'free', icon: PenTool, label: 'Freehand' },
  { id: 'ruler', icon: Ruler, label: 'Micrometer' },
  { id: 'pin', icon: MessageSquare, label: 'Comment' },
  { id: 'ai', icon: Sparkles, label: 'AI region' },
];

interface SlideInfo {
  dimensions: [number, number];
  level_count: number;
  objective_power?: number | string | null;
  vendor?: string;
}

export interface SlideRegion {
  id: string;
  area: string | number;
}

export interface SlideViewerProps {
  slideId: string | null;
  mag: number;
  onMagChange: (m: number) => void;
  aiOn: boolean;
  onToggleAI: () => void;
  activeTool: string;
  onToolChange: (tool: string) => void;
  onPrevSlide?: () => void;
  onNextSlide?: () => void;
  counterLabel?: string;
  biomarker?: Biomarker;
  regions?: SlideRegion[];
  isScored?: boolean;
}

export function SlideViewer({
  slideId,
  mag,
  onMagChange,
  aiOn,
  onToggleAI,
  activeTool,
  onToolChange,
  onPrevSlide,
  onNextSlide,
  counterLabel,
  biomarker = 'p53',
  regions = [],
  isScored = false,
}: SlideViewerProps) {
  const viewerRef = useRef<HTMLDivElement | null>(null);
  const osdRef = useRef<OpenSeadragon.Viewer | null>(null);
  const [slideInfo, setSlideInfo] = useState<SlideInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch slide metadata (dimensions, level count) for the tile source.
  useEffect(() => {
    if (!slideId) return;
    let current = true;
    setSlideInfo(null);
    setError(null);
    fetch(`${API_BASE}/slides/${encodeURIComponent(slideId)}/info`)
      .then((r) => {
        if (!r.ok) throw new Error(`Slide info ${r.status}`);
        return r.json();
      })
      .then((d: SlideInfo) => {
        if (current) setSlideInfo(d);
      })
      .catch((e: Error) => {
        if (current) setError(e.message);
      });
    return () => {
      current = false;
    };
  }, [slideId]);

  // (Re)build the OpenSeadragon viewer when slide metadata is ready.
  useEffect(() => {
    if (!slideInfo || !viewerRef.current || !slideId) return;
    if (osdRef.current) {
      osdRef.current.destroy();
      osdRef.current = null;
    }

    const levelCount = slideInfo.level_count;
    const [fullWidth, fullHeight] = slideInfo.dimensions;

    // Custom tile source (width/height + getTileUrl) — cast across the interop boundary
    // (as any: OSD's tileSource union doesn't model custom getTileUrl sources for open()).
    const tileSource = {
      width: fullWidth,
      height: fullHeight,
      tileSize: 256,
      minLevel: 0,
      maxLevel: levelCount - 1,
      getTileUrl: (level: number, x: number, y: number) => {
        const flippedLevel = levelCount - 1 - level;
        return `${API_BASE}/tiles/${encodeURIComponent(slideId)}/${flippedLevel}/${x}/${y}.jpeg`;
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    osdRef.current = OpenSeadragon({
      element: viewerRef.current,
      prefixUrl: 'https://cdnjs.cloudflare.com/ajax/libs/openseadragon/4.1.0/images/',
      showNavigator: true,
      navigatorPosition: 'TOP_RIGHT',
      navigatorSizeRatio: 0.14,
      navigatorBackground: 'var(--viewer-panel)',
      navigatorBorderColor: 'var(--blue-600)',
      navigatorDisplayRegionColor: 'var(--blue-500)',
      animationTime: 0.5,
      blendTime: 0.1,
      constrainDuringPan: true,
      maxZoomPixelRatio: 2,
      minZoomImageRatio: 0.8,
      visibilityRatio: 0.5,
      zoomPerClick: 2,
      showZoomControl: false,
      showHomeControl: false,
      showFullPageControl: false,
      showRotationControl: false,
    });

    // Register an 'open' handler BEFORE opening. Because open() is asynchronous, this
    // fires after the image opens and forces tiles to load on first paint — without it
    // a single-level slide can stay blank until the user zooms/pans.
    osdRef.current.addHandler('open', () => {
      const v = osdRef.current;
      if (!v) return;
      v.viewport.goHome(true);
      v.forceRedraw();
    });

    osdRef.current.open(tileSource);

    return () => {
      if (osdRef.current) {
        osdRef.current.destroy();
        osdRef.current = null;
      }
    };
  }, [slideInfo, slideId]);

  const zoomTo = (targetMag: number) => {
    if (!osdRef.current || !slideInfo) return;
    const objectivePower = parseFloat(String(slideInfo.objective_power ?? 20)) || 20;
    osdRef.current.viewport.zoomTo(targetMag / objectivePower);
    onMagChange(targetMag);
  };

  const fitToView = () => {
    if (osdRef.current) osdRef.current.viewport.goHome();
    onMagChange(1);
  };

  const dims = slideInfo
    ? `${slideInfo.dimensions[0].toLocaleString()} × ${slideInfo.dimensions[1].toLocaleString()}`
    : '—';

  return (
    <section style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: 'var(--viewer-canvas)' }}>
      <MagBar biomarker={biomarker} value={mag} onChange={zoomTo}>
        <button
          onClick={onToggleAI}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 11,
            fontFamily: 'var(--font-sans)',
            padding: '3px 9px',
            borderRadius: 'var(--radius-xs)',
            cursor: 'pointer',
            border: '1px solid var(--viewer-accent)',
            background: aiOn ? 'rgba(46,230,192,0.16)' : 'transparent',
            color: 'var(--viewer-accent)',
          }}
        >
          <Sparkles size={12} />
          AI overlay
        </button>
        <button
          onClick={fitToView}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 11,
            fontFamily: 'var(--font-sans)',
            padding: '3px 9px',
            borderRadius: 'var(--radius-xs)',
            cursor: 'pointer',
            border: '1px solid var(--viewer-line)',
            background: 'transparent',
            color: 'var(--viewer-muted)',
          }}
        >
          <Maximize size={12} />
          Fit
        </button>
      </MagBar>

      {/* Canvas */}
      <div style={{ flex: 1, position: 'relative', minHeight: 0, overflow: 'hidden' }}>
        {/* Floating tool rail */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: 14,
            transform: 'translateY(-50%)',
            zIndex: 6,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            background: 'rgba(16,21,35,0.82)',
            backdropFilter: 'blur(6px)',
            border: '1px solid var(--viewer-line)',
            borderRadius: 'var(--radius-md)',
            padding: 5,
          }}
        >
          {TOOL_DEFS.map(({ id, icon: ToolIcon, label }) => {
            const on = id === activeTool;
            return (
              <button
                key={id}
                onClick={() => onToolChange(id)}
                title={label}
                style={{
                  width: 34,
                  height: 34,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 6,
                  cursor: 'pointer',
                  background: on ? 'rgba(46,230,192,0.16)' : 'transparent',
                  color: on ? 'var(--viewer-accent)' : 'var(--viewer-muted)',
                  border: on ? '1px solid rgba(46,230,192,0.5)' : '1px solid transparent',
                }}
              >
                <ToolIcon size={16} />
              </button>
            );
          })}
        </div>

        {/* Magnification readout */}
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: 64,
            zIndex: 5,
            display: 'flex',
            alignItems: 'baseline',
            gap: 3,
            background: 'rgba(16,21,35,0.72)',
            border: '1px solid var(--viewer-line)',
            borderRadius: 'var(--radius-sm)',
            padding: '4px 9px',
          }}
        >
          <span style={{ fontSize: 16, fontWeight: 600, fontFamily: 'var(--font-mono)', color: '#fff' }}>{mag}</span>
          <span style={{ fontSize: 10, color: 'var(--viewer-muted)' }}>×</span>
        </div>

        {/* Empty state */}
        {!slideId && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                border: '2px dashed var(--viewer-line)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--viewer-muted)',
              }}
            >
              <Navigation size={28} strokeWidth={1.5} />
            </div>
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--viewer-text)' }}>Loading slide…</div>
          </div>
        )}

        {error && (
          <div
            style={{
              position: 'absolute',
              top: 12,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 10,
              background: '#b00020',
              color: '#fff',
              padding: '6px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 12,
            }}
          >
            {error}
          </div>
        )}

        <div ref={viewerRef} style={{ position: 'absolute', inset: 0 }} />

        {/* ROI overlays */}
        {slideId &&
          regions.map((r, i) => {
            const pos = ROI_POSITIONS[i % ROI_POSITIONS.length];
            const showAIOverlay = i === 0 && aiOn && isScored;
            return (
              <div
                key={r.id}
                style={{
                  position: 'absolute',
                  ...pos,
                  border: `2px solid ${ROI_BORDER_COLORS[i % ROI_BORDER_COLORS.length]}`,
                  borderRadius: 3,
                  boxShadow: '0 0 0 1px rgba(0,0,0,0.3)',
                  zIndex: 4,
                  pointerEvents: 'none',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    top: -19,
                    left: 0,
                    fontSize: 10,
                    fontFamily: 'var(--font-mono)',
                    color: ROI_LABEL_COLORS[i % ROI_LABEL_COLORS.length],
                    whiteSpace: 'nowrap',
                    textShadow: '0 1px 2px rgba(0,0,0,0.7)',
                  }}
                >
                  {r.id} · {r.area} µm
                </span>
                {showAIOverlay && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: aiBg(42),
                      mixBlendMode: 'screen',
                      opacity: 0.78,
                      borderRadius: 2,
                    }}
                  />
                )}
              </div>
            );
          })}

        {/* Scale bar */}
        <div
          style={{
            position: 'absolute',
            bottom: 14,
            left: 14,
            zIndex: 5,
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            pointerEvents: 'none',
          }}
        >
          <div style={{ width: 64, height: 3, background: '#fff', boxShadow: '0 0 0 1px rgba(0,0,0,0.45)' }} />
          <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.7)' }}>
            {SCALE_MAP[mag] || '100 µm'}
          </span>
        </div>
      </div>

      {/* Canvas footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 18,
          padding: '7px 14px',
          background: 'var(--viewer-panel)',
          borderTop: '1px solid var(--viewer-line)',
          fontSize: 10,
          color: 'var(--viewer-muted)',
          fontFamily: 'var(--font-mono)',
          flexWrap: 'wrap',
          flexShrink: 0,
        }}
      >
        <span style={{ color: 'var(--viewer-text)' }}>{slideId || '—'}</span>
        <span>{dims} px</span>
        {slideInfo && <span>{slideInfo.vendor || 'aperio'}</span>}
        {slideInfo && <span>{slideInfo.level_count} levels</span>}
        <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={onPrevSlide}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
              fontFamily: 'var(--font-sans)',
              color: 'var(--viewer-text)',
              background: 'var(--viewer-line)',
              border: 'none',
              borderRadius: 'var(--radius-xs)',
              padding: '4px 9px',
              cursor: 'pointer',
            }}
          >
            <ChevronLeft size={13} />
            Prev
          </button>
          <span style={{ color: 'var(--viewer-text)' }}>{counterLabel || '— / —'}</span>
          <button
            onClick={onNextSlide}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
              fontFamily: 'var(--font-sans)',
              color: 'var(--viewer-text)',
              background: 'var(--viewer-line)',
              border: 'none',
              borderRadius: 'var(--radius-xs)',
              padding: '4px 9px',
              cursor: 'pointer',
            }}
          >
            Next
            <ChevronRight size={13} />
          </button>
        </span>
      </div>
    </section>
  );
}
