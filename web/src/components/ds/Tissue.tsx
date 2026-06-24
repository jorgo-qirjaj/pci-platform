import type { CSSProperties } from 'react';

/* Whole-slide imaging tissue mock — layered radial gradients evoke an IHC-stained
   section (DAB brown nuclei on hematoxylin counterstain). Pure CSS, no real PHI. */

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
    const sz = (rnd() * 9 + 3).toFixed(1);
    s += `radial-gradient(circle ${sz}px at ${x}% ${y}%, ${color}, transparent 70%),`;
  }
  return s;
}

export interface TissueProps {
  showROI?: boolean;
  showAI?: boolean;
  scanning?: boolean;
  label?: string;
  style?: CSSProperties;
}

export function Tissue({ showROI = true, showAI = false, scanning = false, label = 'ROI-1 · 325µm', style = {} }: TissueProps) {
  const tissueBg =
    stipple('rgba(94,42,60,0.55)', 60, 7) +
    stipple('rgba(60,40,120,0.30)', 70, 23) +
    stipple('rgba(150,90,70,0.30)', 50, 51) +
    'radial-gradient(circle at 50% 45%, #e9d5c2 0%, #d8b89a 45%, #b07e5c 85%)';
  const aiBg = stipple('rgba(46,204,154,0.85)', 26, 99);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background: 'var(--viewer-canvas)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
    >
      <div
        style={{
          width: '74%',
          height: '82%',
          borderRadius: 6,
          background: tissueBg,
          backgroundBlendMode: 'multiply',
          position: 'relative',
          boxShadow: '0 0 0 1px rgba(0,0,0,0.3), 0 8px 40px rgba(0,0,0,0.4)',
        }}
      >
        {showROI && (
          <div
            style={{
              position: 'absolute',
              top: '24%',
              left: '30%',
              width: '36%',
              height: '38%',
              border: '2px solid var(--viewer-accent)',
              borderRadius: 3,
              boxShadow: '0 0 0 1px rgba(0,0,0,0.3)',
            }}
          >
            <span
              style={{
                position: 'absolute',
                top: -19,
                left: 0,
                fontSize: 10,
                color: 'var(--viewer-accent)',
                fontFamily: 'var(--font-mono)',
                whiteSpace: 'nowrap',
                textShadow: '0 1px 2px rgba(0,0,0,0.6)',
              }}
            >
              {label}
            </span>
            {showAI && (
              <div style={{ position: 'absolute', inset: 0, background: aiBg, mixBlendMode: 'screen', opacity: 0.7, borderRadius: 2 }} />
            )}
          </div>
        )}

        {/* AI analysis sweep while scoring */}
        {scanning && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              height: 2,
              background: 'linear-gradient(90deg, transparent, var(--viewer-accent), transparent)',
              boxShadow: '0 0 12px var(--viewer-accent)',
              animation: 'pci-scan 1.4s var(--ease-emphasis) infinite',
            }}
          />
        )}
      </div>

      {/* minimap */}
      <div
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          width: 78,
          height: 60,
          background: 'var(--viewer-panel)',
          border: '1px solid var(--blue-600)',
          borderRadius: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ width: '46%', height: '46%', background: 'rgba(37,99,235,0.3)', border: '1px solid var(--blue-500)' }} />
      </div>

      {/* scale bar */}
      <div style={{ position: 'absolute', bottom: 10, left: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 60, height: 3, background: '#fff', boxShadow: '0 0 0 1px rgba(0,0,0,0.4)' }} />
        <span style={{ fontSize: 10, color: '#fff', fontFamily: 'var(--font-mono)', textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}>100 µm</span>
      </div>
    </div>
  );
}
