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
  mpp_x?: number | string | null;
  vendor?: string;
}

export interface RegionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type DrawType = 'rect' | 'line' | 'freehand' | 'polygon' | 'point';

export interface SlideRegion {
  id: string;
  area: string | number;
  rect?: RegionRect;
  type?: DrawType;
  points?: { x: number; y: number }[];
  text?: string;
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
  /** Called when the user finishes drawing an annotation (coords in viewport space). */
  onAddRegion?: (region: {
    type: DrawType;
    microns: number;
    rect?: RegionRect;
    points?: { x: number; y: number }[];
    text?: string;
  }) => void;
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
  onAddRegion,
}: SlideViewerProps) {
  const viewerRef = useRef<HTMLDivElement | null>(null);
  const osdRef = useRef<OpenSeadragon.Viewer | null>(null);
  const [slideInfo, setSlideInfo] = useState<SlideInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ROI drawing state. Refs let the (once-created) MouseTracker read current values.
  const activeToolRef = useRef(activeTool);
  const onAddRegionRef = useRef(onAddRegion);
  const drawStartRef = useRef<{ x: number; y: number } | null>(null);
  const pathRef = useRef<{ x: number; y: number }[] | null>(null);
  const polyPtsRef = useRef<{ x: number; y: number }[] | null>(null);
  const [draftRect, setDraftRect] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  const [draftPath, setDraftPath] = useState<{ x: number; y: number }[] | null>(null);
  useEffect(() => {
    activeToolRef.current = activeTool;
  }, [activeTool]);
  useEffect(() => {
    onAddRegionRef.current = onAddRegion;
  }, [onAddRegion]);

  // Fetch slide metadata (dimensions, level count) for the tile source.
  useEffect(() => {
    if (!slideId) return;
    let current = true;
    setSlideInfo(null);
    setError(null);
    fetch(`${API_BASE}/slides/${encodeURIComponent(slideId)}/info`)
      .then(async (r) => {
        if (!r.ok) {
          let detail = '';
          try {
            detail = (await r.json())?.detail || '';
          } catch {
            /* non-JSON error body */
          }
          if (r.status === 404) throw new Error('Slide not found on the tile server.');
          if (r.status === 415) {
            // Keep the full technical reason in the console; show a short line in the UI.
            if (detail) console.warn('[slide] unsupported format:', detail);
            throw new Error("This file isn't a viewable whole-slide image. It needs to be a pyramidal slide (SVS, NDPI, MRXS, SCN, or tiled TIFF).");
          }
          throw new Error(detail || `Could not load slide (${r.status}).`);
        }
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

    // Annotation drawing. A MouseTracker captures press/drag/release: rect (roi/ai) draws a
    // box, freehand collects a path, ruler draws a measured line. Pan is disabled for any
    // drawing tool (below). Polygon/pin are click-based — handled in a later pass.
    const viewer = osdRef.current;
    const mppx = parseFloat(String(slideInfo.mpp_x ?? '')) || 0;
    const DRAG_TOOLS = new Set(['roi', 'ai', 'free', 'ruler']);
    const toVp = (x: number, y: number) => viewer.viewport.pointFromPixel(new OpenSeadragon.Point(x, y));
    const toImg = (x: number, y: number) => viewer.viewport.viewportToImageCoordinates(toVp(x, y));
    const segUm = (a: { x: number; y: number }, b: { x: number; y: number }) => {
      const ia = toImg(a.x, a.y);
      const ib = toImg(b.x, b.y);
      const d = Math.hypot(ib.x - ia.x, ib.y - ia.y);
      return mppx > 0 ? d * mppx : d;
    };
    const closePolygon = (raw: { x: number; y: number }[]) => {
      const pts = raw.slice();
      while (
        pts.length >= 2 &&
        Math.hypot(pts[pts.length - 1].x - pts[pts.length - 2].x, pts[pts.length - 1].y - pts[pts.length - 2].y) < 6
      )
        pts.pop();
      polyPtsRef.current = null;
      setDraftPath(null);
      if (pts.length < 3) return;
      const vpPts = pts.map((p) => {
        const vp = toVp(p.x, p.y);
        return { x: vp.x, y: vp.y };
      });
      let len = 0;
      for (let i = 1; i < pts.length; i++) len += segUm(pts[i - 1], pts[i]);
      len += segUm(pts[pts.length - 1], pts[0]);
      onAddRegionRef.current?.({ type: 'polygon', microns: Math.max(1, Math.round(len)), points: vpPts });
    };
    const tracker = new OpenSeadragon.MouseTracker({
      element: viewer.element,
      pressHandler: (e: any) => {
        const tool = activeToolRef.current;
        if (!DRAG_TOOLS.has(tool)) return;
        drawStartRef.current = { x: e.position.x, y: e.position.y };
        if (tool === 'free' || tool === 'ruler') {
          pathRef.current = [{ x: e.position.x, y: e.position.y }];
          setDraftPath([{ x: e.position.x, y: e.position.y }]);
        } else {
          setDraftRect({ left: e.position.x, top: e.position.y, width: 0, height: 0 });
        }
      },
      dragHandler: (e: any) => {
        const tool = activeToolRef.current;
        const s = drawStartRef.current;
        if (!s || !DRAG_TOOLS.has(tool)) return;
        if (tool === 'free') {
          pathRef.current?.push({ x: e.position.x, y: e.position.y });
          setDraftPath(pathRef.current ? [...pathRef.current] : null);
        } else if (tool === 'ruler') {
          const p = [
            { x: s.x, y: s.y },
            { x: e.position.x, y: e.position.y },
          ];
          pathRef.current = p;
          setDraftPath(p);
        } else {
          setDraftRect({
            left: Math.min(s.x, e.position.x),
            top: Math.min(s.y, e.position.y),
            width: Math.abs(e.position.x - s.x),
            height: Math.abs(e.position.y - s.y),
          });
        }
      },
      releaseHandler: (e: any) => {
        const tool = activeToolRef.current;
        const s = drawStartRef.current;
        const path = pathRef.current;
        drawStartRef.current = null;
        pathRef.current = null;
        setDraftRect(null);
        setDraftPath(null);
        if (!s || !DRAG_TOOLS.has(tool)) return;
        if (tool === 'free' || tool === 'ruler') {
          const pts =
            tool === 'ruler'
              ? [
                  { x: s.x, y: s.y },
                  { x: e.position.x, y: e.position.y },
                ]
              : path && path.length > 1
                ? path
                : null;
          if (!pts || pts.length < 2) return;
          let len = 0;
          for (let i = 1; i < pts.length; i++) len += segUm(pts[i - 1], pts[i]);
          if (len < 1) return;
          const vpPts = pts.map((p) => {
            const vp = toVp(p.x, p.y);
            return { x: vp.x, y: vp.y };
          });
          onAddRegionRef.current?.({ type: tool === 'ruler' ? 'line' : 'freehand', microns: Math.round(len), points: vpPts });
        } else {
          const left = Math.min(s.x, e.position.x);
          const top = Math.min(s.y, e.position.y);
          const w = Math.abs(e.position.x - s.x);
          const h = Math.abs(e.position.y - s.y);
          if (w < 6 || h < 6) return; // ignore stray clicks
          const p1 = toVp(left, top);
          const p2 = toVp(left + w, top + h);
          const rect = { x: p1.x, y: p1.y, width: p2.x - p1.x, height: p2.y - p1.y };
          const imgRect = viewer.viewport.viewportToImageRectangle(new OpenSeadragon.Rect(rect.x, rect.y, rect.width, rect.height));
          const sidePx = Math.sqrt(Math.max(1, imgRect.width * imgRect.height));
          const microns = Math.max(1, Math.round(mppx > 0 ? sidePx * mppx : sidePx));
          onAddRegionRef.current?.({ type: 'rect', microns, rect });
        }
      },
      clickHandler: (e: any) => {
        const tool = activeToolRef.current;
        if (tool === 'poly') {
          const p = { x: e.position.x, y: e.position.y };
          const arr = polyPtsRef.current || [];
          const first = arr[0];
          if (first && arr.length >= 3 && Math.hypot(p.x - first.x, p.y - first.y) < 12) {
            closePolygon(arr); // click near the first vertex closes the polygon
            return;
          }
          const last = arr[arr.length - 1];
          if (!last || Math.hypot(p.x - last.x, p.y - last.y) > 5) arr.push(p);
          polyPtsRef.current = arr;
          setDraftPath([...arr]);
        } else if (tool === 'pin') {
          const vp = toVp(e.position.x, e.position.y);
          const note = window.prompt('Add a note for this point:') || '';
          if (note.trim()) onAddRegionRef.current?.({ type: 'point', microns: 1, points: [{ x: vp.x, y: vp.y }], text: note.trim() });
        }
      },
      dblClickHandler: () => {
        if (activeToolRef.current === 'poly' && polyPtsRef.current) closePolygon(polyPtsRef.current);
      },
    });
    osdRef.current.setMouseNavEnabled(activeToolRef.current === 'move');

    return () => {
      tracker.destroy();
      if (osdRef.current) {
        osdRef.current.destroy();
        osdRef.current = null;
      }
    };
  }, [slideInfo, slideId]);

  // Toggle pan vs. draw when the active tool changes (and after a viewer rebuild).
  useEffect(() => {
    osdRef.current?.setMouseNavEnabled(activeTool === 'move');
    if (activeTool !== 'poly') {
      polyPtsRef.current = null;
      setDraftPath(null);
    }
  }, [activeTool, slideInfo, slideId]);

  // Anchored overlays for drawn regions, synced to the slide by OpenSeadragon.
  useEffect(() => {
    const v = osdRef.current;
    if (!v) return;
    v.clearOverlays();
    const labelCss =
      'position:absolute;top:-18px;left:0;font-size:10px;font-family:var(--font-mono);color:var(--viewer-accent);white-space:nowrap;text-shadow:0 1px 2px rgba(0,0,0,0.7)';
    regions.forEach((r) => {
      if (r.rect) {
        const el = document.createElement('div');
        el.style.cssText =
          'border:2px solid var(--viewer-accent);border-radius:3px;box-shadow:0 0 0 1px rgba(0,0,0,0.35);pointer-events:none';
        const label = document.createElement('span');
        label.textContent = `${r.id} · ${r.area} µm`;
        label.style.cssText = labelCss;
        el.appendChild(label);
        v.addOverlay({ element: el, location: new OpenSeadragon.Rect(r.rect.x, r.rect.y, r.rect.width, r.rect.height) });
      } else if (r.type === 'point' && r.points && r.points.length >= 1) {
        // Pin / comment → a dot marker (+ note) anchored at the point.
        const el = document.createElement('div');
        el.style.cssText = 'pointer-events:none;display:flex;align-items:center;gap:4px;white-space:nowrap';
        const dot = document.createElement('span');
        dot.style.cssText =
          'width:12px;height:12px;border-radius:50%;background:var(--viewer-accent);box-shadow:0 0 0 2px rgba(0,0,0,0.45);flex-shrink:0';
        el.appendChild(dot);
        const t = document.createElement('span');
        t.textContent = r.text || r.id;
        t.style.cssText =
          'font-size:10px;font-family:var(--font-sans);color:#fff;background:rgba(16,21,35,0.82);padding:1px 5px;border-radius:3px;text-shadow:0 1px 2px rgba(0,0,0,0.7)';
        el.appendChild(t);
        v.addOverlay({ element: el, location: new OpenSeadragon.Point(r.points[0].x, r.points[0].y), placement: OpenSeadragon.Placement.CENTER });
      } else if (r.points && r.points.length >= 2) {
        // Line / freehand / polygon → an SVG anchored to the points' bounding box.
        const xs = r.points.map((p) => p.x);
        const ys = r.points.map((p) => p.y);
        const minX = Math.min(...xs);
        const minY = Math.min(...ys);
        const bw = Math.max(Math.max(...xs) - minX, 1e-6);
        const bh = Math.max(Math.max(...ys) - minY, 1e-6);
        const norm = r.points
          .map((p) => `${(((p.x - minX) / bw) * 100).toFixed(2)},${(((p.y - minY) / bh) * 100).toFixed(2)}`)
          .join(' ');
        const closed = r.type === 'polygon';
        const shape = closed ? 'polygon' : 'polyline';
        const el = document.createElement('div');
        el.style.cssText = 'pointer-events:none';
        el.innerHTML =
          `<svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style="overflow:visible">` +
          `<${shape} points="${norm}" fill="${closed ? 'rgba(46,230,192,0.12)' : 'none'}" stroke="var(--viewer-accent)" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
        const label = document.createElement('span');
        label.textContent = `${r.id} · ${r.area} µm`;
        label.style.cssText = labelCss;
        el.appendChild(label);
        v.addOverlay({ element: el, location: new OpenSeadragon.Rect(minX, minY, bw, bh) });
      }
    });
  }, [regions, slideInfo, slideId]);

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

        {/* Live ROI rectangle while drawing */}
        {draftRect && (
          <div
            style={{
              position: 'absolute',
              left: draftRect.left,
              top: draftRect.top,
              width: draftRect.width,
              height: draftRect.height,
              border: '2px dashed var(--viewer-accent)',
              background: 'rgba(46,230,192,0.12)',
              borderRadius: 3,
              zIndex: 5,
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Live freehand / line preview while drawing */}
        {draftPath && draftPath.length >= 1 && (
          <svg style={{ position: 'absolute', inset: 0, zIndex: 5, pointerEvents: 'none', overflow: 'visible' }}>
            <polyline
              points={draftPath.map((p) => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke="var(--viewer-accent)"
              strokeWidth={2}
              strokeDasharray="4 3"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </svg>
        )}

        {/* Decorative overlays for legacy/seed regions (no real geometry) */}
        {slideId &&
          regions.filter((r) => !r.rect && !r.points).map((r, i) => {
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
