import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button, CaseStatusBadge, Icon, SearchField, Tabs } from '../components/ds';
import { StatCard, type StatTone } from '../components/StatCard';
import { NewCaseModal } from '../components/NewCaseModal';
import { api } from '../lib/api';
import type { Case, Stats } from '../lib/types';
import { scoreColor, shortDate, weekdayDate } from '../lib/format';
import { useAuth } from '../lib/auth';

type TabKey = 'all' | 'review' | 'ai' | 'done';

export function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [cases, setCases] = useState<Case[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [tab, setTab] = useState<TabKey>('all');
  const [q, setQ] = useState(searchParams.get('q') ?? '');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = () => {
    Promise.all([api.listCases({}), api.stats()])
      .then(([c, s]) => {
        setCases(c.cases);
        setStats(s);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  // Keep local search in sync when the top-bar search changes the URL.
  useEffect(() => {
    setQ(searchParams.get('q') ?? '');
  }, [searchParams]);

  const matchesTab = (c: Case, t: TabKey) => {
    if (t === 'review') return c.status === 'review';
    if (t === 'ai') return c.status === 'ai-ready' || c.status === 'ai-scored';
    if (t === 'done') return c.status === 'complete';
    return true;
  };

  const matchesQuery = (c: Case) => {
    const needle = q.trim().toLowerCase();
    if (!needle) return true;
    return (
      c.accession.toLowerCase().includes(needle) ||
      c.biomarker.toLowerCase().includes(needle) ||
      c.site.toLowerCase().includes(needle)
    );
  };

  const queried = useMemo(() => cases.filter(matchesQuery), [cases, q]);
  const filtered = useMemo(() => queried.filter((c) => matchesTab(c, tab)), [queried, tab]);

  const counts = useMemo(
    () => ({
      all: queried.length,
      review: queried.filter((c) => c.status === 'review').length,
      ai: queried.filter((c) => c.status === 'ai-ready' || c.status === 'ai-scored').length,
      done: queried.filter((c) => c.status === 'complete').length,
    }),
    [queried],
  );

  const th: CSSProperties = {
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: 'var(--text-tertiary)',
    padding: '8px 10px',
    textAlign: 'left',
    borderBottom: '1px solid var(--border-default)',
    whiteSpace: 'nowrap',
  };
  const td: CSSProperties = {
    padding: '11px 10px',
    fontSize: 13,
    borderBottom: '1px solid var(--border-subtle)',
    color: 'var(--text-secondary)',
    verticalAlign: 'middle',
  };

  const tiles: { label: string; value: string | number; icon: string; tone: StatTone; tab: TabKey }[] = stats
    ? [
        { label: 'Active cases', value: stats.activeCases, icon: 'folder-open', tone: 'action', tab: 'all' },
        { label: 'Pending review', value: stats.pendingReview, icon: 'clock', tone: 'review', tab: 'review' },
        { label: 'AI scored', value: stats.aiScored, icon: 'sparkles', tone: 'ai', tab: 'ai' },
        { label: 'Avg turnaround', value: `${stats.avgTurnaroundHours}h`, icon: 'gauge', tone: 'done', tab: 'all' },
      ]
    : [];

  return (
    <div style={{ padding: '24px 28px', overflowY: 'auto', height: '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 600 }}>Dashboard</h1>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 4 }}>
            {weekdayDate(new Date().toISOString())} · {user?.name}
          </p>
        </div>
        <Button variant="primary" iconLeft={<Icon name="plus" size={15} />} onClick={() => setShowModal(true)}>
          New case
        </Button>
      </div>

      <div style={{ display: 'flex', gap: 14, marginBottom: 24 }}>
        {tiles.map((s) => (
          <StatCard key={s.label} label={s.label} value={s.value} icon={s.icon} tone={s.tone} onClick={() => setTab(s.tab)} />
        ))}
        {!stats &&
          [0, 1, 2, 3].map((i) => (
            <div key={i} className="pci-skeleton" style={{ flex: 1, height: 92, borderRadius: 'var(--radius-md)' }} />
          ))}
      </div>

      <div
        style={{
          background: 'var(--surface-card)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-sm)',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 0' }}>
          <Tabs
            value={tab}
            onChange={(v) => setTab(v as TabKey)}
            tabs={[
              { value: 'all', label: 'All cases', count: counts.all },
              { value: 'review', label: 'Pending review', count: counts.review },
              { value: 'ai', label: 'AI scored', count: counts.ai },
              { value: 'done', label: 'Complete', count: counts.done },
            ]}
          />
          <div style={{ paddingBottom: 10 }}>
            <SearchField
              placeholder="Search accession #…"
              width={220}
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setSearchParams(e.target.value ? { q: e.target.value } : {}, { replace: true });
              }}
            />
          </div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={th}>Accession #</th>
              <th style={th}>Biomarker</th>
              <th style={th}>Site</th>
              <th style={th}>Submitted</th>
              <th style={th}>Status</th>
              <th style={th}>Slide</th>
              <th style={{ ...th, textAlign: 'right' }}>AI score</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr
                key={c.accession}
                onClick={() => navigate(`/cases/${c.accession}`)}
                tabIndex={0}
                aria-label={`View case ${c.accession}, ${c.biomarker}, status ${c.status}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(`/cases/${c.accession}`);
                  }
                }}
                style={{ cursor: 'pointer' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                onFocus={(e) => (e.currentTarget.style.background = 'var(--surface-hover)')}
                onBlur={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <td style={{ ...td, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--action)', fontWeight: 600 }}>
                  {c.accession}
                </td>
                <td style={td}>{c.biomarker}</td>
                <td style={{ ...td, color: 'var(--text-tertiary)' }}>{c.site}</td>
                <td style={{ ...td, fontFamily: 'var(--font-mono)', fontSize: 12 }}>{shortDate(c.submitted)}</td>
                <td style={td}>
                  <CaseStatusBadge status={c.status} />
                </td>
                <td style={td}>
                  {c.slide.status === 'ready' ? (
                    <span style={{ color: 'var(--teal-600)', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
                      Ready
                    </span>
                  ) : (
                    <span style={{ color: 'var(--amber-600)', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Icon name="upload" size={12} />
                      Uploading
                    </span>
                  )}
                </td>
                <td
                  style={{
                    ...td,
                    textAlign: 'right',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 13,
                    fontWeight: 500,
                    color: scoreColor(c.ai?.patternTone),
                  }}
                >
                  {c.ai?.display ?? '—'}
                </td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={7} style={{ ...td, textAlign: 'center', padding: '40px 0', color: 'var(--text-tertiary)' }}>
                  No cases match this view.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <NewCaseModal
          onClose={() => setShowModal(false)}
          onCreated={(c) => {
            setShowModal(false);
            navigate(`/cases/${c.accession}`);
          }}
        />
      )}
    </div>
  );
}
