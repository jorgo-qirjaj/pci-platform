import { useState, type ReactNode } from 'react';
import { Avatar, Button, Icon } from '../components/ds';
import { useAuth } from '../lib/auth';
import { getToken } from '../lib/api';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div
      style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-sm)',
        padding: 20,
        marginBottom: 16,
        maxWidth: 640,
      }}
    >
      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 14 }}>{title}</div>
      {children}
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
      <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>{label}</span>
      <span style={{ fontSize: 13, fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)', color: 'var(--text-primary)' }}>{value}</span>
    </div>
  );
}

export function Settings() {
  const { user, signOut } = useAuth();
  const [resetting, setResetting] = useState(false);

  const resetDemo = async () => {
    setResetting(true);
    try {
      await fetch('/api/admin/reset', {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken() ?? ''}` },
      });
    } finally {
      window.location.href = '/';
    }
  };

  return (
    <div style={{ padding: '24px 28px', overflowY: 'auto', height: '100%', boxSizing: 'border-box' }}>
      <h1 style={{ fontSize: 24, fontWeight: 600 }}>Settings</h1>
      <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 4, marginBottom: 20 }}>
        Workspace, storage, and account preferences.
      </p>

      <Section title="Profile">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
          <Avatar name={user?.name || ''} size="lg" />
          <div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{user?.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{user?.role}</div>
          </div>
        </div>
        <Field label="Email" value={user?.email || ''} mono />
        <Field label="Role" value={user?.role || ''} />
        <Field label="Authentication" value="AWS Cognito · SSO" />
      </Section>

      <Section title="Slide storage">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--teal-500)' }} />
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--teal-700)' }}>Connected</span>
        </div>
        <Field label="Bucket" value="s3://pci-slides" mono />
        <Field label="Region" value="us-east-1" mono />
        <Field label="Encryption" value="SSE-KMS (at rest)" />
      </Section>

      <Section title="Demo data">
        <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 14 }}>
          Restore the case list, AI scores, and statuses back to their seeded state.
        </p>
        <Button variant="secondary" iconLeft={<Icon name="rotate-ccw" size={15} />} onClick={resetDemo} disabled={resetting}>
          {resetting ? 'Resetting…' : 'Reset demo data'}
        </Button>
      </Section>

      <Section title="Account">
        <Button variant="danger" iconLeft={<Icon name="log-out" size={15} />} onClick={signOut}>
          Sign out
        </Button>
      </Section>
    </div>
  );
}
