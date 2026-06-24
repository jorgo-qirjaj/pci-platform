import { useState } from 'react';
import { Button, Icon, Input, Select } from './ds';
import { api } from '../lib/api';
import type { Case } from '../lib/types';

const SITES = ['HCA Houston · Clear Lake', 'Baylor St. Luke’s', 'MD Anderson', 'Memorial Hermann'];

export function NewCaseModal({ onClose, onCreated }: { onClose: () => void; onCreated: (c: Case) => void }) {
  const [biomarker, setBiomarker] = useState('p53');
  const [site, setSite] = useState(SITES[0]);
  const [specimen, setSpecimen] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async () => {
    setBusy(true);
    setError(null);
    try {
      const { case: c } = await api.createCase({ biomarker, site, specimen: specimen || undefined });
      onCreated(c);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        background: 'rgba(11,46,95,0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="pci-anim-pop"
        style={{
          width: '100%',
          maxWidth: 440,
          background: 'var(--surface-card)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-xl)',
          padding: 24,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <h2 style={{ fontSize: 19, fontWeight: 600 }}>New case</h2>
          <span style={{ cursor: 'pointer', color: 'var(--text-tertiary)' }} onClick={onClose}>
            <Icon name="x" size={18} />
          </span>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 20 }}>
          A new accession number is assigned automatically. The slide begins ingesting from AWS S3.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Select
            label="Biomarker"
            value={biomarker}
            onChange={(e) => setBiomarker(e.target.value)}
            options={['p53', 'PDL1', 'HER2', 'MMR']}
          />
          <Select label="Ordering site" value={site} onChange={(e) => setSite(e.target.value)} options={SITES} />
          <Input label="Specimen" value={specimen} onChange={(e) => setSpecimen(e.target.value)} placeholder="e.g. Prostate, needle core biopsy" />
          {error && <div style={{ fontSize: 12, color: 'var(--red-600)' }}>{error}</div>}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24 }}>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={create} disabled={busy} iconLeft={<Icon name="plus" size={15} />}>
            {busy ? 'Creating…' : 'Create case'}
          </Button>
        </div>
      </div>
    </div>
  );
}
