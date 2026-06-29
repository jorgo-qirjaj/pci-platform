import { describe, it, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../index';
import { store } from '../store';

const PW = '123456789';
const EMAIL = 'jandersen@pcibio.com';
const CASE = 'PCI-2026-00142'; // Houston seed case, annotations ROI-1 + ROI-2
const auth = (t: string) => ({ Authorization: `Bearer ${t}` });

let token = '';
before(async () => {
  token = (await request(app).post('/api/auth/login').send({ email: EMAIL, password: PW })).body.token;
});
beforeEach(() => store.reset());

describe('annotations (regions)', () => {
  it('adds a region and returns it on the case', async () => {
    const r = await request(app)
      .post(`/api/cases/${CASE}/annotations`)
      .set(auth(token))
      .send({ microns: 250, type: 'rect', rect: { x: 0, y: 0, width: 0.1, height: 0.1 } });
    assert.equal(r.status, 201);
    const anns: Array<{ microns: number; type?: string }> = r.body.case.annotations;
    assert.ok(anns.some((a) => a.microns === 250 && a.type === 'rect'), 'new region present');
  });

  it('rejects a non-positive microns value (400)', async () => {
    const r = await request(app).post(`/api/cases/${CASE}/annotations`).set(auth(token)).send({ microns: 0 });
    assert.equal(r.status, 400);
  });

  it('deletes an existing region (200) and 404s a missing one', async () => {
    const del = await request(app).delete(`/api/cases/${CASE}/annotations/ROI-1`).set(auth(token));
    assert.equal(del.status, 200);
    const anns: Array<{ id: string }> = del.body.case.annotations;
    assert.ok(!anns.some((a) => a.id === 'ROI-1'), 'ROI-1 removed');

    const missing = await request(app).delete(`/api/cases/${CASE}/annotations/ROI-999`).set(auth(token));
    assert.equal(missing.status, 404);
  });
});
