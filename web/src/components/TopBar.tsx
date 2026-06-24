import { useState, type CSSProperties, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, Icon, SearchField } from './ds';
import { useAuth } from '../lib/auth';

export function TopBar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

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
          }}
          title="Notifications"
        >
          <Icon name="bell" size={18} />
        </span>
        <div style={{ position: 'relative' }}>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <Avatar name={user?.name || ''} />
            <div style={{ lineHeight: 1.2 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{user?.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{user?.role}</div>
            </div>
            <Icon name="chevron-down" size={14} style={{ color: 'var(--text-tertiary)' }} />
          </div>
          {menuOpen && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setMenuOpen(false)} />
              <div
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
                  onClick={() => {
                    setMenuOpen(false);
                    navigate('/settings');
                  }}
                  style={menuItemStyle}
                >
                  <Icon name="settings" size={15} /> Settings
                </button>
                <button onClick={() => signOut()} style={{ ...menuItemStyle, color: 'var(--red-600)' }}>
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
