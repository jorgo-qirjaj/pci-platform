import { Avatar, Badge } from '../components/ds';

const MEMBERS = [
  { name: 'John Andersen', role: 'Pathologist', email: 'jandersen@pcibio.com', tone: 'navy' as const, status: 'active' as const },
  { name: 'Maria Cho', role: 'Lab Director', email: 'mcho@pcibio.com', tone: 'blue' as const, status: 'active' as const },
  { name: 'Devon Ellis', role: 'Histotechnologist', email: 'dellis@pcibio.com', tone: 'teal' as const, status: 'active' as const },
  { name: 'Priya Nair', role: 'AI Validation Scientist', email: 'pnair@pcibio.com', tone: 'navy' as const, status: 'review' as const },
];

export function Team() {
  return (
    <div style={{ padding: '24px 28px', overflowY: 'auto', height: '100%', boxSizing: 'border-box' }}>
      <h1 style={{ fontSize: 24, fontWeight: 600 }}>Team</h1>
      <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 4, marginBottom: 20 }}>
        Members with access to this PCI lab workspace.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
        {MEMBERS.map((m) => (
          <div
            key={m.email}
            style={{
              background: 'var(--surface-card)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-sm)',
              padding: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <Avatar name={m.name} size="lg" tone={m.tone} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{m.name}</span>
                <Badge tone={m.status === 'active' ? 'done' : 'review'}>{m.status === 'active' ? 'Active' : 'Invited'}</Badge>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{m.role}</div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{m.email}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
