import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Icon, Input } from '../components/ds';
import { useAuth } from '../lib/auth';

export function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('jandersen@pcibio.com');
  const [password, setPassword] = useState('123456789');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await signIn(email, password);
      navigate('/');
    } catch (err) {
      setError((err as Error).message || 'Sign in failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100%', fontFamily: 'var(--font-sans)' }}>
      {/* Brand panel */}
      <div
        style={{
          flex: '1 1 50%',
          background: 'linear-gradient(160deg, #0b2e5f 0%, #061a38 100%)',
          color: '#fff',
          padding: '48px 56px',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <img src="/assets/logo-lockup-dark.svg" height={40} alt="PCI" style={{ position: 'relative', zIndex: 1 }} />
        <div style={{ marginTop: 'auto', position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 34, fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.15, maxWidth: 420 }}>
            Precision pathology, anchored to controls.
          </div>
          <p style={{ marginTop: 16, fontSize: 15, color: 'var(--navy-300)', maxWidth: 400, lineHeight: 1.6 }}>
            Manage cases, view whole-slide images, and score p53 IHC with p53AI — every result calibrated against OE, WT,
            and NULL cell-line controls.
          </p>
          <div style={{ marginTop: 28, display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: 'var(--navy-300)' }}>
            <Icon name="shield-check" size={15} />
            Built with HIPAA-aligned security principles
          </div>
        </div>
        {/* faint cellular motif */}
        <div style={{ position: 'absolute', right: -120, bottom: -120, width: 420, height: 420, borderRadius: '50%', border: '2px solid rgba(46,204,154,0.12)' }} />
        <div style={{ position: 'absolute', right: -40, bottom: -40, width: 240, height: 240, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.06)' }} />
      </div>

      {/* Form panel */}
      <div style={{ flex: '1 1 50%', background: 'var(--surface-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <form style={{ width: '100%', maxWidth: 340 }} onSubmit={submit}>
          <h1 style={{ fontSize: 24, fontWeight: 600 }}>Sign in</h1>
          <p style={{ fontSize: 14, color: 'var(--text-tertiary)', marginTop: 6, marginBottom: 28 }}>Access the PCI pathology platform.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            {error && (
              <div style={{ fontSize: 12, color: 'var(--red-600)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon name="circle-alert" size={14} />
                {error}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <a href="#" style={{ fontSize: 12 }} onClick={(e) => e.preventDefault()}>
                Forgot password?
              </a>
            </div>
            <Button type="submit" variant="primary" full size="lg" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'}
            </Button>
          </div>
          <div
            style={{
              marginTop: 24,
              paddingTop: 20,
              borderTop: '1px solid var(--border-subtle)',
              fontSize: 12,
              color: 'var(--text-tertiary)',
              textAlign: 'center',
            }}
          >
            Protected by AWS Cognito · SSO available for labs
          </div>
        </form>
      </div>
    </div>
  );
}
