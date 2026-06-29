import { describe, it, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../index';
import { store } from '../store';
import { MODEL_VERSION } from '../ai';

/**
 * H2 / H3 / H5 — result-integrity contract for scoring.
 *
 * A produced score must be: anchored to a region (H5), QC-gated on real controls
 * (H2), within the biomarker's magnification cap (H3), deterministic + versioned,
 * and history-preserving. The gates are HARD (409 / blocked), per product decision.
 */

const PASSWORD = '123456789';
const EMAIL = 'jandersen@pcibio.com'; // owns all (Houston) seed cases
const auth = (t: string) => ({ Authorization: `Bearer ${t}` });

let token = '';

async function login(): Promise<string> {
  const res = await request(app).post('/api/auth/login').send({ email: EMAIL, password: PASSWORD });
  assert.equal(res.status, 200);
  return res.body.token as string;
}

const score = (acc: string, body: object = {}) =>
  request(app).post(`/api/cases/${acc}/score`).set(auth(token)).send(body);

before(async () => {
  token = await login();
});
beforeEach(() => {
  store.reset(); // fresh seed before each test (tokens are unaffected)
});

describe('scoring integrity (H2/H3/H5)', () => {
  it('H5: refuses to score a case with no region of interest', async () => {
    // PCI-2026-00136 — PDL1, slide ready, zero annotations.
    const res = await score('PCI-2026-00136');
    assert.equal(res.status, 409);
    assert.match(res.body.error, /region of interest/i);
  });

  it('H2: hard-gates when a required TriControl™ cell line is missing', async () => {
    // p53 requires OE+WT+NULL — knock out WT on a ready, annotated case.
    const c = store.get('PCI-2026-00142')!;
    store.update('PCI-2026-00142', { controls: { ...c.controls, WT: false } });
    const res = await score('PCI-2026-00142');
    assert.equal(res.status, 409);
    assert.match(res.body.error, /QC failed/i);
    assert.match(res.body.error, /WT/);
  });

  it('H3: hard-gates when magnification exceeds the biomarker cap', async () => {
    // PDL1 cap is 20×; push the (annotated, QC-passing) PDL1 case to 40×.
    const c = store.get('PCI-2026-00141')!;
    store.update('PCI-2026-00141', { slide: { ...c.slide, magnification: 40 } });
    const res = await score('PCI-2026-00141');
    assert.equal(res.status, 409);
    assert.match(res.body.error, /magnification/i);
  });

  it('produces a deterministic, versioned, region-anchored score', async () => {
    const first = await score('PCI-2026-00142');
    assert.equal(first.status, 200);
    const ai = first.body.case.ai;
    assert.equal(ai.modelVersion, MODEL_VERSION);
    assert.equal(ai.regionId, 'ROI-1'); // defaults to the first region
    assert.equal(ai.magnification, 40);
    assert.equal(ai.operator, 'John Andersen');

    // Re-running the same model on the same region reproduces the exact score.
    store.reset();
    const second = await score('PCI-2026-00142');
    assert.equal(second.body.case.ai.value, ai.value);
    assert.equal(second.body.case.ai.positive, ai.positive);
    assert.equal(second.body.case.ai.total, ai.total);
  });

  it('can target a specific region and retains run history', async () => {
    const r1 = await score('PCI-2026-00142', { regionId: 'ROI-1' });
    const r2 = await score('PCI-2026-00142', { regionId: 'ROI-2' });
    assert.equal(r2.status, 200);
    assert.equal(r2.body.case.ai.regionId, 'ROI-2');
    // Two runs recorded, not overwritten.
    assert.equal(r2.body.case.scoreHistory.length, 2);
    assert.equal(r2.body.case.scoreHistory[0].regionId, 'ROI-1');
  });

  it('rejects a regionId that does not exist on the case', async () => {
    const res = await score('PCI-2026-00142', { regionId: 'ROI-999' });
    assert.equal(res.status, 404);
  });

  it('locks a finalized case: score → finalize → re-score blocked', async () => {
    assert.equal((await score('PCI-2026-00142')).status, 200);
    const fin = await request(app).post('/api/cases/PCI-2026-00142/finalize').set(auth(token));
    assert.equal(fin.status, 200);
    const rescore = await score('PCI-2026-00142');
    assert.equal(rescore.status, 409); // finalized + immutable (C2)
  });
});
