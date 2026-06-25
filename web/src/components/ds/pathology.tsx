import type { CSSProperties, ReactNode } from 'react';
import type { Biomarker, CaseStatus, ControlSet, ExpressionTone } from '../../lib/types';

/* ============================================================
   CaseStatusBadge — maps a case lifecycle status to a labelled pill.
   ============================================================ */

const STATUS_MAP: Record<string, { tone: keyof typeof TONES; label: string }> = {
  uploading: { tone: 'review', label: 'Uploading' },
  active: { tone: 'active', label: 'Active' },
  review: { tone: 'review', label: 'In review' },
  'ai-ready': { tone: 'ai', label: 'AI ready' },
  'ai-scored': { tone: 'ai', label: 'AI scored' },
  complete: { tone: 'done', label: 'Complete' },
  critical: { tone: 'critical', label: 'Critical' },
};

const TONES = {
  active: { bg: 'var(--status-active-bg)', fg: 'var(--status-active-fg)' },
  review: { bg: 'var(--status-review-bg)', fg: 'var(--status-review-fg)' },
  done: { bg: 'var(--status-done-bg)', fg: 'var(--status-done-fg)' },
  ai: { bg: 'var(--status-ai-bg)', fg: 'var(--status-ai-fg)' },
  critical: { bg: 'var(--status-critical-bg)', fg: 'var(--status-critical-fg)' },
  neutral: { bg: 'var(--status-neutral-bg)', fg: 'var(--status-neutral-fg)' },
} as const;

export interface CaseStatusBadgeProps {
  status?: CaseStatus;
  dot?: boolean;
  style?: CSSProperties;
}

export function CaseStatusBadge({ status = 'active', dot = true, style = {} }: CaseStatusBadgeProps) {
  const m = STATUS_MAP[status] || { tone: 'neutral' as const, label: status };
  const t = TONES[m.tone];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '3px 9px',
        borderRadius: 'var(--radius-pill)',
        fontSize: 11,
        fontWeight: 600,
        fontFamily: 'var(--font-sans)',
        lineHeight: 1.4,
        whiteSpace: 'nowrap',
        background: t.bg,
        color: t.fg,
        ...style,
      }}
    >
      {dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />}
      {m.label}
    </span>
  );
}

/* ============================================================
   ControlChips — p53 TriControl™ cell-line verification (OE / WT / NULL).
   PCI's QC differentiator.
   ============================================================ */

export interface ControlChipsProps {
  controls?: ControlSet;
  style?: CSSProperties;
}

export function ControlChips({ controls = { OE: true, WT: true, NULL: true }, style = {} }: ControlChipsProps) {
  const meta: Record<keyof ControlSet, { color: string; bg: string }> = {
    OE: { color: 'var(--ctrl-oe)', bg: 'var(--ctrl-oe-bg)' },
    WT: { color: 'var(--ctrl-wt)', bg: 'var(--ctrl-wt-bg)' },
    NULL: { color: 'var(--ctrl-null)', bg: 'var(--ctrl-null-bg)' },
  };
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', ...style }}>
      {(Object.keys(meta) as (keyof ControlSet)[]).map((k) => {
        const present = controls[k];
        const m = meta[k];
        return (
          <span
            key={k}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '4px 9px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 11,
              fontWeight: 600,
              fontFamily: 'var(--font-sans)',
              background: present ? m.bg : 'var(--surface-sunken)',
              color: present ? m.color : 'var(--text-disabled)',
              border: `1px solid ${present ? 'transparent' : 'var(--border-subtle)'}`,
            }}
          >
            <span style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.03em' }}>{k}</span>
            {present ? (
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            ) : (
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            )}
          </span>
        );
      })}
    </div>
  );
}

/* ============================================================
   ScoreDisplay — the AI score readout (the heart of the platform).
   ============================================================ */

export interface ScoreDisplayProps {
  biomarker?: Biomarker;
  score?: number;
  display?: string;
  metric?: string;
  pattern?: string;
  patternTone?: ExpressionTone;
  positive?: number;
  total?: number;
  confidence?: number;
  threshold?: number;
  style?: CSSProperties;
}

export function ScoreDisplay({
  biomarker = 'p53',
  score = 87.4,
  display,
  metric = 'Positive nuclei (TPS)',
  pattern = 'Overexpression',
  patternTone = 'oe',
  positive = 1842,
  total = 2108,
  confidence = 94.2,
  threshold = 1,
  style = {},
}: ScoreDisplayProps) {
  const patternColors = {
    oe: { bg: 'var(--ctrl-oe-bg)', fg: 'var(--ctrl-oe)' },
    wt: { bg: 'var(--ctrl-wt-bg)', fg: 'var(--ctrl-wt)' },
    null: { bg: 'var(--ctrl-null-bg)', fg: 'var(--ctrl-null)' },
  };
  const pc = patternColors[patternTone] || patternColors.oe;
  const headline = display ?? `${score}%`;
  const barPct = Math.min(100, score);

  const Row = ({ k, v }: { k: string; v: ReactNode }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '5px 0' }}>
      <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{k}</span>
      <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontWeight: 500 }}>{v}</span>
    </div>
  );

  return (
    <div style={{ fontFamily: 'var(--font-sans)', ...style }}>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-ai)' }}>
        p53AI · {biomarker}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '8px 0 2px' }}>
        <span style={{ fontSize: 40, fontWeight: 600, color: 'var(--action)', lineHeight: 1, letterSpacing: '-0.01em' }}>{headline}</span>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 10 }}>{metric}</div>

      <div style={{ height: 6, background: 'var(--surface-sunken)', borderRadius: 'var(--radius-pill)', overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${barPct}%`,
            background: 'linear-gradient(90deg, var(--action), var(--teal-400))',
            borderRadius: 'var(--radius-pill)',
          }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--text-tertiary)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
        <span>0</span>
        <span>≥{threshold}% positive</span>
        <span>100</span>
      </div>

      <div style={{ marginTop: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 6 }}>
          Expression
        </div>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '4px 10px',
            borderRadius: 'var(--radius-pill)',
            fontSize: 11,
            fontWeight: 600,
            background: pc.bg,
            color: pc.fg,
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
          {pattern}
        </span>
      </div>

      <div style={{ marginTop: 14, borderTop: '1px solid var(--border-subtle)', paddingTop: 6 }}>
        <Row k="Positive nuclei" v={positive.toLocaleString()} />
        <Row k="Total nuclei" v={total.toLocaleString()} />
        <Row k="AI confidence" v={`${confidence}%`} />
      </div>

      <div
        style={{
          marginTop: 12,
          fontSize: 9,
          lineHeight: 1.45,
          color: 'var(--text-tertiary)',
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: 8,
        }}
      >
        Investigational (RUO) — p53AI is decision support, not a substitute for pathologist
        interpretation. Scores are relative to on-slide TriControl™ references.
      </div>
    </div>
  );
}

/* ============================================================
   MagBar — dark whole-slide-imaging magnification toolbar.
   Enforces a per-biomarker max (PDL1 caps at 20x).
   ============================================================ */

export interface MagBarProps {
  biomarker?: Biomarker;
  value?: number;
  onChange?: (value: number) => void;
  maxByBiomarker?: Partial<Record<Biomarker, number>>;
  style?: CSSProperties;
  children?: ReactNode;
}

export function MagBar({ biomarker = 'p53', value = 20, onChange, maxByBiomarker, style = {}, children }: MagBarProps) {
  const caps: Record<Biomarker, number> = { p53: 40, PDL1: 20, HER2: 40, MMR: 40, ...maxByBiomarker };
  const cap = caps[biomarker] ?? 40;
  const stops = [1, 5, 10, 20, 40].filter((m) => m <= cap);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 12px',
        background: 'var(--viewer-panel)',
        borderBottom: '1px solid var(--viewer-line)',
        ...style,
      }}
    >
      <span style={{ fontSize: 11, color: 'var(--viewer-muted)', marginRight: 2 }}>Mag</span>
      {stops.map((m) => {
        const on = m === value;
        return (
          <button
            key={m}
            onClick={() => onChange && onChange(m)}
            style={{
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              padding: '3px 9px',
              cursor: 'pointer',
              borderRadius: 'var(--radius-xs)',
              border: '1px solid var(--blue-600)',
              background: on ? 'var(--blue-600)' : 'var(--viewer-line)',
              color: on ? '#fff' : 'var(--viewer-text)',
            }}
          >
            {m}x
          </button>
        );
      })}
      {cap < 40 && (
        <span style={{ fontSize: 10, color: 'var(--viewer-muted)', marginLeft: 2 }} title="Clinical limit">
          · {biomarker} max {cap}x
        </span>
      )}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
        {children}
        <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--viewer-accent)' }}>~{value}x</span>
      </div>
    </div>
  );
}
