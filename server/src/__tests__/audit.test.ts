import { describe, it, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../index';
import { store } from '../store';

/**
 * Ticket 105 (H11-a) — append-only audit trail. Records who did what to which case, when —
 * operator identity + de-identified accession only, never patient PHI; lab-scoped on read.
 */

const PW = '123456789';
const A = 'jandersen@pcibio.com'; // Houston
const B = 'rkhan@northshore.example'; // Northshore
const auth = (t: string) => ({ Authorization: `Bearer ${t}` });

let tA = '';
let tB = '';
async function login(email: string) {
  return (await request(app).post('/api/auth/login').send({ email, password: PW })).body.token as string;
}
before(async () => {
  tA = await login(A);
  tB = await login(B);
});
beforeEach(() => store.reset());

describe('audit log (105 — H11-a)', () => {
  it('records a score action with actor + accession and no patient fields', async () => {
    await request(app).post('/api/cases/PCI-2026-00142/score').set(auth(tA));
    const r = await request(app).get('/api/audit').set(auth(tA));
    assert.equal(r.status, 200);
    const entry = r.body.entries.find(
      (e: { action: string; accession: string }) => e.action === 'score' && e.accession === 'PCI-2026-00142',
    );
    assert.ok(entry, 'a score entry is recorded');
    assert.equal(entry.actor, A);
    // PHI-free: only the expected operator/case fields exist.
    assert.deepEqual(Object.keys(entry).sort(), ['accession', 'action', 'actor', 'at', 'detail', 'id', 'labId']);
  });

  it('logs case views', async () => {
    await request(app).get('/api/cases/PCI-2026-00142').set(auth(tA));
    const r = await request(app).get('/api/audit').set(auth(tA));
    assert.ok(r.body.entries.some((e: { action: string; accession: string }) => e.action === 'view' && e.accession === 'PCI-2026-00142'));
  });

  it('is lab-scoped — one lab cannot see another lab’s trail', async () => {
    await request(app).get('/api/cases/PCI-2026-00142').set(auth(tA)); // Houston activity
    const rB = await request(app).get('/api/audit').set(auth(tB)); // Northshore reader
    assert.equal(rB.status, 200);
    assert.equal(rB.body.entries.length, 0);
  });

  it('can scope to a single case', async () => {
    await request(app).get('/api/cases/PCI-2026-00142').set(auth(tA));
    await request(app).get('/api/cases/PCI-2026-00141').set(auth(tA));
    const r = await request(app).get('/api/audit?accession=PCI-2026-00141').set(auth(tA));
    assert.ok(r.body.entries.length > 0);
    assert.ok(r.body.entries.every((e: { accession: string }) => e.accession === 'PCI-2026-00141'));
  });

  it('requires authentication', async () => {
    assert.equal((await request(app).get('/api/audit')).status, 401);
  });
});
