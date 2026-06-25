import { Icon } from './ds';

export type StatTone = 'action' | 'review' | 'ai' | 'done';

export interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  tone: StatTone;
  onClick?: () => void;
}

const TONE_FG: Record<StatTone, string> = {
  action: 'var(--action)',
  review: 'var(--amber-600)',
  ai: 'var(--purple-600)',
  done: 'var(--teal-600)',
};
const TONE_BG: Record<StatTone, string> = {
  action: 'var(--blue-100)',
  review: 'var(--amber-100)',
  ai: 'var(--purple-100)',
  done: 'var(--teal-100)',
};

export function StatCard({ label, value, icon, tone, onClick }: StatCardProps) {
  return (
    <div
      onClick={onClick}
      style={{
        flex: 1,
        background: 'var(--surface-card)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-md)',
        padding: 16,
        boxShadow: 'var(--shadow-sm)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'box-shadow var(--dur-base), border-color var(--dur-base), transform var(--dur-base)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
        e.currentTarget.style.borderColor = 'var(--border-strong)';
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
        e.currentTarget.style.borderColor = 'var(--border-default)';
        e.currentTarget.style.transform = 'none';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: 'var(--text-tertiary)',
          }}
        >
          {label}
        </span>
        <span
          style={{
            width: 28,
            height: 28,
            borderRadius: 'var(--radius-sm)',
            background: TONE_BG[tone],
            color: TONE_FG[tone],
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name={icon} size={15} />
        </span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 600, marginTop: 8, letterSpacing: '-0.01em' }}>{value}</div>
    </div>
  );
}
