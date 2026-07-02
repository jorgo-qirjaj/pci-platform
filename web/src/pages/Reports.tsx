import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Icon } from '../components/ds';
import { api } from '../lib/api';
import type { Biomarker, Case } from '../lib/types';
import { shortDate, scoreColor } from '../lib/format';
import {
  triageBucket,
  reviewReason,
  confidenceColor,
  CLEAR_CONFIDENCE,
  type TriageBucket,
} from '../lib/triage';

const BIOMARKERS: (Biomarker | 'all')[] = ['all', 'p53', 'PDL1', 'HER2', 'MMR'];

type BucketMeta = {
  key: TriageBucket;
  title: string;
  icon: 'circle-alert' | 'sparkles' | 'shield-check';
  desc: string;
  dot: string;
  countBg: string;
  countFg: string;
  defaultOpen: boolean;
};

const BUCKETS: BucketMeta[] = [
  {
    key: 'review',
    title: 'Needs review',
    icon: 'circle-alert',
    desc: 'positive, uncertain, or quality-flagged',
    dot: 'var(--red-600)',
    countBg: 'var(--red-100)',
    countFg: 'var(--red-700)',
    defaultOpen: true,
  },
  {
    key: 'cleared',
    title: 'Cleared by AI',
    icon: 'sparkles',
    desc: 'negative pattern, high confidence',
    dot: 'var(--teal-600)',
    countBg: 'var(--teal-100)',
    countFg: 'var(--teal-700)',
    defaultOpen: true,
  },
  {
    key: 'signed',
    title: 'Signed off',
    icon: 'shield-check',
    desc: 'pathologist sign-off complete',
    dot: 'var(--slate-400)',
    countBg: 'var(--status-neutral-bg)',
    countFg: 'var(--status-neutral-fg)',
    defaultOpen: false,
  },
];

export function Reports() {
  const navigate = useNavigate();
  const [cases, setCases] = useState<Case[]>([]);
  const [query, setQuery] = useState('');
  const [bio, setBio] = useState<Biomarker | 'all'>('all');
  const [open, setOpen] = useState<Record<TriageBucket, boolean>>({
    review: true,
    cleared: true,
    signed: false,
  });

  useEffect(() => {
    // The worklist covers cases that have entered reporting: AI-scored or signed off.
    api.listCases({}).then((r) => setCases(r.cases.filter((c) => c.ai || c.status === 'complete')));
  }, []);

  const filtered = useMemo(
    () =>
      cases.filter((c) => {
        if (bio !== 'all' && c.biomarker !== bio) return false;
        const q = query.trim().toLowerCase();
        if (q && ![c.accession, c.site, c.specimen].some((f) => f.toLowerCase().includes(q))) return false;
        return true;
      }),
    [cases, bio, query],
  );

  const buckets = useMemo(() => {
    const b: Record<TriageBucket, Case[]> = { review: [], cleared: [], signed: [] };
    for (const c of filtered) b[triageBucket(c)].push(c);
    return b;
  }, [filtered]);

  const toggle = (k: TriageBucket) => setOpen((o) => ({ ...o, [k]: !o[k] }));

  // Export = print the whole worklist. Expand every bucket first so collapsed
  // rows aren't dropped, then print (the global print stylesheet shows only the
  // .report-print-root surface and hides the app chrome).
  const handleExport = () => {
    setOpen({ review: true, cleared: true, signed: true });
    setTimeout(() => window.print(), 150);
  };

  return (
    <div style={{ padding: '24px 28px 48px', overflowY: 'auto', height: '100%', boxSizing: 'border-box' }}>
      <div className="report-print-root" style={{ maxWidth: 1100 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', margin: 0 }}>Report worklist</h1>
        <p style={{ fontSize: 13.5, color: 'var(--text-tertiary)', margin: '6px 0 0', maxWidth: '62ch' }}>
          Triage by what needs your attention. The AI clears the clear negatives and surfaces only positive,
          uncertain, or quality-flagged cases for your review.
        </p>

        {/* Summary strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, margin: '20px 0 22px' }}>
          {BUCKETS.map((m) => (
            <SummaryCard key={m.key} meta={m} count={buckets[m.key].length} />
          ))}
        </div>

        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--surface-card)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-sm)',
              padding: '7px 11px',
              minWidth: 230,
              color: 'var(--text-tertiary)',
            }}
          >
            <Icon name="microscope" size={15} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search accession, site, specimen…"
              aria-label="Search reports"
              style={{
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontFamily: 'var(--font-sans)',
                fontSize: 13,
                color: 'var(--text-primary)',
                width: '100%',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {BIOMARKERS.map((b) => {
              const on = bio === b;
              return (
                <button
                  key={b}
                  onClick={() => setBio(b)}
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 12.5,
                    fontWeight: on ? 600 : 500,
                    color: on ? '#fff' : 'var(--text-secondary)',
                    background: on ? 'var(--navy-800)' : 'var(--surface-card)',
                    border: `1px solid ${on ? 'var(--navy-800)' : 'var(--border-default)'}`,
                    borderRadius: 'var(--radius-pill)',
                    padding: '6px 13px',
                    cursor: 'pointer',
                    transition: 'background var(--dur-fast), border-color var(--dur-fast)',
                  }}
                >
                  {b === 'all' ? 'All' : b === 'PDL1' ? 'PD-L1' : b}
                </button>
              );
            })}
          </div>
          <div style={{ flex: 1 }} />
          <Button variant="secondary" size="sm" iconLeft={<Icon name="printer" size={15} />} onClick={handleExport}>
            Export PDF
          </Button>
        </div>

        {/* Buckets */}
        {BUCKETS.map((m) => (
          <BucketSection
            key={m.key}
            meta={m}
            cases={buckets[m.key]}
            isOpen={open[m.key]}
            onToggle={() => toggle(m.key)}
            onOpenCase={(acc) => navigate(`/cases/${acc}/report`)}
          />
        ))}

        {filtered.length === 0 && (
          <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
            No reports match your filters. Clear the search or biomarker filter to see all cases.
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Summary card ---------- */
function SummaryCard({ meta, count }: { meta: BucketMeta; count: number }) {
  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: 'var(--surface-card)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-sm)',
        padding: '15px 17px',
      }}
    >
      <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: meta.dot }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: meta.dot }} />
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: 'var(--text-tertiary)',
          }}
        >
          {meta.title}
        </span>
      </div>
      <div
        style={{
          fontSize: 32,
          fontWeight: 600,
          letterSpacing: '-0.02em',
          marginTop: 6,
          fontVariantNumeric: 'tabular-nums',
          color: meta.key === 'review' ? 'var(--red-700)' : meta.key === 'cleared' ? 'var(--teal-700)' : 'var(--text-secondary)',
        }}
      >
        {count}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>{meta.desc}</div>
    </div>
  );
}

/* ---------- Bucket section ---------- */
function BucketSection({
  meta,
  cases,
  isOpen,
  onToggle,
  onOpenCase,
}: {
  meta: BucketMeta;
  cases: Case[];
  isOpen: boolean;
  onToggle: () => void;
  onOpenCase: (accession: string) => void;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 11,
          padding: '12px 16px',
          background: 'var(--surface-card)',
          border: '1px solid var(--border-default)',
          borderRadius: isOpen ? 'var(--radius-md) var(--radius-md) 0 0' : 'var(--radius-md)',
          cursor: 'pointer',
          fontFamily: 'var(--font-sans)',
          textAlign: 'left',
          transition: 'background var(--dur-fast)',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-hover)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--surface-card)')}
      >
        <span style={{ color: meta.dot, display: 'inline-flex' }}>
          <Icon name={meta.icon} size={17} />
        </span>
        <span style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--text-primary)' }}>{meta.title}</span>
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            fontVariantNumeric: 'tabular-nums',
            padding: '2px 9px',
            borderRadius: 'var(--radius-pill)',
            background: meta.countBg,
            color: meta.countFg,
          }}
        >
          {cases.length}
        </span>
        <span style={{ fontSize: 12.5, color: 'var(--text-tertiary)' }}>— {meta.desc}</span>
        <span
          style={{
            marginLeft: 'auto',
            color: 'var(--text-tertiary)',
            display: 'inline-flex',
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform var(--dur-base)',
          }}
        >
          <Icon name="chevron-down" size={17} />
        </span>
      </button>

      {isOpen && (
        <div
          style={{
            border: '1px solid var(--border-default)',
            borderTop: 'none',
            borderRadius: '0 0 var(--radius-md) var(--radius-md)',
            background: 'var(--surface-card)',
            overflow: 'hidden',
          }}
        >
          {cases.map((c, i) => (
            <ReportRow key={c.accession} c={c} bucket={meta.key} first={i === 0} onOpen={() => onOpenCase(c.accession)} />
          ))}
          {cases.length === 0 && (
            <div style={{ padding: '22px 16px', fontSize: 12.5, color: 'var(--text-tertiary)' }}>
              No cases in this bucket.
            </div>
          )}
          {meta.key === 'cleared' && cases.length > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 16px',
                background: 'var(--teal-50)',
                borderTop: '1px solid var(--border-subtle)',
                fontSize: 12,
                color: 'var(--teal-700)',
              }}
            >
              <Icon name="sparkles" size={14} />
              <span>
                Provisional clearing rule: <b>negative pattern + confidence ≥ {CLEAR_CONFIDENCE}%</b> — a UI
                placeholder until John&apos;s AI model defines the real threshold. Nothing is auto-signed.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- Row ---------- */
function ReportRow({
  c,
  bucket,
  first,
  onOpen,
}: {
  c: Case;
  bucket: TriageBucket;
  first: boolean;
  onOpen: () => void;
}) {
  const ai = c.ai;
  const aberrant = ai ? ai.patternTone !== 'wt' : false;
  const stripe =
    bucket === 'review'
      ? aberrant
        ? 'var(--red-600)'
        : 'var(--amber-600)'
      : bucket === 'cleared'
        ? 'var(--teal-500)'
        : 'var(--slate-300)';

  let chip: ReactNode;
  if (bucket === 'review') {
    const r = reviewReason(c);
    chip = <Chip tone={r.tone}>{r.label}</Chip>;
  } else if (bucket === 'cleared') {
    chip = <Chip tone="ai">AI-cleared</Chip>;
  } else {
    chip = <Chip tone="ok">✓ Signed off</Chip>;
  }

  return (
    <div
      onClick={onOpen}
      tabIndex={0}
      role="button"
      aria-label={`Open report for ${c.accession}, ${c.biomarker}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        }
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-hover)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      onFocus={(e) => (e.currentTarget.style.background = 'var(--surface-hover)')}
      onBlur={(e) => (e.currentTarget.style.background = 'transparent')}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '13px 16px 13px 13px',
        borderTop: first ? 'none' : '1px solid var(--border-subtle)',
        borderLeft: `3px solid ${stripe}`,
        cursor: 'pointer',
        background: 'transparent',
        transition: 'background var(--dur-fast)',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 12.5,
          fontWeight: 600,
          whiteSpace: 'nowrap',
          width: 132,
          flexShrink: 0,
        }}
      >
        {c.accession}
      </span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Chip tone="bio">{(c.biomarker === 'PDL1' ? 'PD-L1' : c.biomarker) + ' IHC'}</Chip>
          {chip}
        </div>
        <div
          style={{
            fontSize: 12,
            color: 'var(--text-tertiary)',
            marginTop: 3,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {c.specimen} · {c.site} · {shortDate(c.submitted)}
        </div>
      </div>

      {ai && (
        <div style={{ width: 82, flexShrink: 0 }} className="rpt-conf">
          <div
            style={{
              fontSize: 10,
              color: 'var(--text-tertiary)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              marginBottom: 4,
            }}
          >
            Confidence
          </div>
          <div style={{ height: 5, borderRadius: 3, background: 'var(--slate-200)', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 3, width: `${ai.confidence}%`, background: confidenceColor(ai.confidence) }} />
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 3, fontVariantNumeric: 'tabular-nums' }}>
            {Math.round(ai.confidence)}%
          </div>
        </div>
      )}

      <div style={{ textAlign: 'right', width: 100, flexShrink: 0 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em', color: scoreColor(ai?.patternTone) }}>
          {ai?.display ?? '—'}
        </div>
        <div style={{ fontSize: 10.5, color: 'var(--text-tertiary)', marginTop: 1 }}>{ai?.pattern ?? 'not scored'}</div>
      </div>

      <Button
        variant={bucket === 'review' ? 'primary' : 'secondary'}
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          onOpen();
        }}
      >
        {bucket === 'review' ? 'Review' : 'Open report'}
      </Button>
    </div>
  );
}

/* ---------- Inline chip (matches the approved prototype) ---------- */
function Chip({ tone, children }: { tone: 'bio' | 'pos' | 'warn' | 'ai' | 'ok'; children: ReactNode }) {
  const map: Record<string, { bg: string; fg: string }> = {
    bio: { bg: 'var(--navy-50)', fg: 'var(--navy-700)' },
    pos: { bg: 'var(--red-100)', fg: 'var(--red-700)' },
    warn: { bg: 'var(--amber-100)', fg: 'var(--amber-600)' },
    ai: { bg: 'var(--teal-100)', fg: 'var(--teal-700)' },
    ok: { bg: 'var(--green-100)', fg: 'var(--green-600)' },
  };
  const t = map[tone];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.02em',
        padding: '3px 8px',
        borderRadius: 'var(--radius-pill)',
        whiteSpace: 'nowrap',
        background: t.bg,
        color: t.fg,
      }}
    >
      {children}
    </span>
  );
}
