import { Fragment, type CSSProperties, type ReactNode } from 'react';
import { Icon } from './Icon';

/* ============================================================
   SidebarNav — navy product navigation rail.
   ============================================================ */

export interface NavItem {
  id: string;
  label: string;
  icon?: string;
  count?: number;
  section?: string;
}

export interface SidebarNavProps {
  items?: NavItem[];
  active?: string;
  onSelect?: (id: string) => void;
  footer?: ReactNode;
  style?: CSSProperties;
}

export function SidebarNav({ items = [], active, onSelect, footer = null, style = {} }: SidebarNavProps) {
  let lastSection: string | null = null;
  return (
    <nav
      style={{
        width: 'var(--layout-sidebar)',
        background: 'var(--navy-800)',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        padding: '14px 0',
        flexShrink: 0,
        height: '100%',
        boxSizing: 'border-box',
        ...style,
      }}
    >
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {items.map((it) => {
          const showSection = it.section && it.section !== lastSection;
          lastSection = it.section || lastSection;
          const on = it.id === active;
          return (
            <Fragment key={it.id}>
              {showSection && (
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.35)',
                    padding: '14px 18px 6px',
                  }}
                >
                  {it.section}
                </div>
              )}
              <button
                onClick={() => onSelect && onSelect(it.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 11,
                  width: 'calc(100% - 16px)',
                  margin: '1px 8px',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  cursor: 'pointer',
                  background: on ? 'rgba(27,79,216,0.45)' : 'transparent',
                  color: on ? '#fff' : 'rgba(255,255,255,0.62)',
                  fontSize: 13,
                  fontWeight: on ? 600 : 500,
                  fontFamily: 'var(--font-sans)',
                  textAlign: 'left',
                  transition: 'background var(--dur-fast)',
                }}
                onMouseEnter={(e) => {
                  if (!on) e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                }}
                onMouseLeave={(e) => {
                  if (!on) e.currentTarget.style.background = 'transparent';
                }}
              >
                {it.icon && <Icon name={it.icon} size={17} style={{ flexShrink: 0 }} />}
                <span style={{ flex: 1 }}>{it.label}</span>
                {it.count != null && (
                  <span
                    style={{
                      fontSize: 10,
                      fontFamily: 'var(--font-mono)',
                      background: on ? 'var(--blue-600)' : 'rgba(255,255,255,0.12)',
                      color: '#fff',
                      padding: '1px 6px',
                      borderRadius: 'var(--radius-pill)',
                    }}
                  >
                    {it.count}
                  </span>
                )}
              </button>
            </Fragment>
          );
        })}
      </div>
      {footer && (
        <div style={{ padding: '14px 18px 4px', borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: 8 }}>{footer}</div>
      )}
    </nav>
  );
}

/* ============================================================
   Tabs — underline tab bar.
   ============================================================ */

type Tab = string | { value: string; label: string; count?: number };

export interface TabsProps {
  tabs?: Tab[];
  value?: string;
  onChange?: (value: string) => void;
  style?: CSSProperties;
}

export function Tabs({ tabs = [], value, onChange, style = {} }: TabsProps) {
  return (
    <div role="tablist" style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border-default)', ...style }}>
      {tabs.map((t) => {
        const val = typeof t === 'string' ? t : t.value;
        const lab = typeof t === 'string' ? t : t.label;
        const count = typeof t === 'object' ? t.count : undefined;
        const active = val === value;
        return (
          <button
            key={val}
            role="tab"
            aria-selected={active}
            onClick={() => onChange && onChange(val)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '10px 14px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: active ? 600 : 500,
              fontFamily: 'var(--font-sans)',
              color: active ? 'var(--action)' : 'var(--text-tertiary)',
              borderBottom: `2px solid ${active ? 'var(--action)' : 'transparent'}`,
              marginBottom: -1,
              transition: 'color var(--dur-fast)',
            }}
          >
            {lab}
            {count != null && (
              <span
                style={{
                  fontSize: 11,
                  fontFamily: 'var(--font-mono)',
                  color: active ? 'var(--action)' : 'var(--text-tertiary)',
                  background: active ? 'var(--action-soft)' : 'var(--surface-sunken)',
                  padding: '1px 6px',
                  borderRadius: 'var(--radius-pill)',
                }}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
