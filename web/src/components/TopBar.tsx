import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, Icon, SearchField } from './ds';
import { useAuth } from '../lib/auth';

export function TopBar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close the account menu on Escape and return focus to its trigger.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const submitSearch = (e: FormEvent) => {
    e.preventDefault();
    navigate(q.trim() ? `/cases?q=${encodeURIComponent(q.trim())}` : '/cases');
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        height: 'var(--layout-topbar)',
        padding: '0 20px',
        background: 'var(--surface-card)',
        borderBottom: '1px solid var(--border-default)',
        flexShrink: 0,
      }}
    >
      <img src="/assets/logo-lockup.svg" height={30} alt="PCI" style={{ cursor: 'pointer' }} onClick={() => navigate('/')} />
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: 'var(--blue-700)',
          background: 'var(--blue-100)',
          padding: '2px 8px',
          borderRadius: 'var(--radius-pill)',
        }}
      >
        Platform
      </span>
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
        <form onSubmit={submitSearch}>
          <SearchField placeholder="Search cases, accession #…" width={240} value={q} onChange={(e) => setQ(e.target.value)} />
        </form>
        <span
          style={{
            width: 34,
            height: 34,
            borderRadius: 'var(--radius-sm)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            transition: 'background var(--dur-fast), color var(--dur-fast)',
          }}
          title="Notifications"
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--surface-hover)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
        >
          <Icon name="bell" size={18} />
        </span>
        <div style={{ position: 'relative' }}>
          <button
            ref={triggerRef}
            type="button"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="Account menu"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              padding: '4px 8px',
              border: 'none',
              fontFamily: 'inherit',
              borderRadius: 'var(--radius-sm)',
              background: menuOpen ? 'var(--surface-hover)' : 'transparent',
              transition: 'background var(--dur-fast)',
            }}
            onClick={() => setMenuOpen((v) => !v)}
            onMouseEnter={(e) => {
              if (!menuOpen) e.currentTarget.style.background = 'var(--surface-hover)';
            }}
            onMouseLeave={(e) => {
              if (!menuOpen) e.currentTarget.style.background = 'transparent';
            }}
          >
            <Avatar name={user?.name || ''} />
            <div style={{ lineHeight: 1.2, textAlign: 'left' }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{user?.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{user?.role}</div>
            </div>
            <Icon name="chevron-down" size={14} style={{ color: 'var(--text-tertiary)' }} />
          </button>
          {menuOpen && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setMenuOpen(false)} />
              <div
                role="menu"
                aria-label="Account options"
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 8px)',
                  zIndex: 11,
                  minWidth: 200,
                  background: 'var(--surface-card)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-lg)',
                  padding: 6,
                }}
              >
                <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border-subtle)', marginBottom: 4 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{user?.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{user?.email}</div>
                </div>
                <button
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    navigate('/settings');
                  }}
                  style={menuItemStyle}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--surface-hover)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'none';
                  }}
                >
                  <Icon name="settings" size={15} /> Settings
                </button>
                <button
                  role="menuitem"
                  onClick={() => signOut()}
                  style={{ ...menuItemStyle, color: 'var(--red-600)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--red-100)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'none';
                  }}
                >
                  <Icon name="log-out" size={15} /> Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const menuItemStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 9,
  width: '100%',
  padding: '8px 10px',
  background: 'none',
  border: 'none',
  borderRadius: 'var(--radius-sm)',
  cursor: 'pointer',
  fontSize: 13,
  fontFamily: 'var(--font-sans)',
  color: 'var(--text-primary)',
  textAlign: 'left',
};
