import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../index';
import { store } from '../store';
import { PRIMARY_LAB_ID, SECONDARY_LAB_ID } from '../seed';

/**
 * C4 — tenant-scoped authorization (IDOR regression guard).
 *
 * Two pathologists in two different labs. The whole point: a user must never be
 * able to read or mutate a case belonging to another lab, and a missing case and
 * a cross-tenant case must be indistinguishable (both 404 — no enumeration oracle).
 *
 * Runs on Node's built-in test runner (no vitest/vite toolchain) via tsx.
 */

const PASSWORD = '123456789';
const A_EMAIL = 'jandersen@pcibio.com'; // Houston
const B_EMAIL = 'rkhan@northshore.example'; // Northshore
const A_CASE = 'PCI-2026-00142'; // a seed case owned by Houston

async function login(email: string): Promise<string> {
  const res = await request(app).post('/api/auth/login').send({ email, password: PASSWORD });
  assert.equal(res.status, 200);
  return res.body.token as string;
}

const auth = (t: string) => ({ Authorization: `Bearer ${t}` });

let tokenA = '';
let tokenB = '';

before(async () => {
  store.reset(); // deterministic seed state (all cases in the primary lab)
  tokenA = await login(A_EMAIL);
  tokenB = await login(B_EMAIL);
});

describe('C4 tenant isolation', () => {
  it('scopes the case list to the caller’s lab', async () => {
    const a = await request(app).get('/api/cases').set(auth(tokenA));
    assert.equal(a.status, 200);
    assert.ok(a.body.cases.length > 0);
    assert.ok(a.body.cases.every((c: { labId: string }) => c.labId === PRIMARY_LAB_ID));

    const b = await request(app).get('/api/cases').set(auth(tokenB));
    assert.equal(b.status, 200);
    assert.equal(b.body.cases.length, 0); // Northshore owns no seed cases
  });

  it('returns 404 (not 403) when reading another lab’s case', async () => {
    assert.equal((await request(app).get(`/api/cases/${A_CASE}`).set(auth(tokenA))).status, 200);
    // Indistinguishable from a non-existent case — no enumeration oracle.
    assert.equal((await request(app).get(`/api/cases/${A_CASE}`).set(auth(tokenB))).status, 404);
  });

  it('blocks every cross-tenant mutation path', async () => {
    assert.equal((await request(app).post(`/api/cases/${A_CASE}/score`).set(auth(tokenB))).status, 404);
    assert.equal(
      (await request(app).post(`/api/cases/${A_CASE}/annotations`).set(auth(tokenB)).send({ microns: 100 })).status,
      404,
    );
    assert.equal((await request(app).get(`/api/cases/${A_CASE}/report`).set(auth(tokenB))).status, 404);
  });

  it('carries an opaque UUID alongside the human accession', async () => {
    const res = await request(app).get(`/api/cases/${A_CASE}`).set(auth(tokenA));
    assert.match(res.body.case.id, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    assert.equal(res.body.case.labId, PRIMARY_LAB_ID);
  });

  it('a case created by lab B is invisible to lab A', async () => {
    const created = await request(app)
      .post('/api/cases')
      .set(auth(tokenB))
      .send({ biomarker: 'p53', site: 'Northshore Path' });
    assert.equal(created.status, 201);
    assert.equal(created.body.case.labId, SECONDARY_LAB_ID);
    const acc = created.body.case.accession;

    assert.equal((await request(app).get(`/api/cases/${acc}`).set(auth(tokenB))).status, 200); // owner can read
    assert.equal((await request(app).get(`/api/cases/${acc}`).set(auth(tokenA))).status, 404); // other lab cannot

    const aList = await request(app).get('/api/cases').set(auth(tokenA));
    assert.equal(aList.body.cases.some((c: { accession: string }) => c.accession === acc), false);
  });

  it('rejects unauthenticated access', async () => {
    assert.equal((await request(app).get('/api/cases')).status, 401);
    assert.equal((await request(app).get(`/api/cases/${A_CASE}`)).status, 401);
  });
});
