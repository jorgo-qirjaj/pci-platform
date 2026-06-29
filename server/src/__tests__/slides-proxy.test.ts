import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../index';

const PW = '123456789';
const EMAIL = 'jandersen@pcibio.com';

/**
 * The authenticated upload proxy (closes H12). We can't reach a real tile server in tests,
 * but we can prove the two gates that matter: it requires a JWT, and it fails closed when
 * no UPLOAD_API_KEY is configured (the test env deliberately sets none).
 */
describe('slide upload proxy (/api/slides/upload)', () => {
  it('requires authentication (401 without a token)', async () => {
    const r = await request(app).post('/api/slides/upload').attach('file', Buffer.from('x'), 'slide.svs');
    assert.equal(r.status, 401);
  });

  it('fails closed (503) when UPLOAD_API_KEY is not configured', async () => {
    const token = (await request(app).post('/api/auth/login').send({ email: EMAIL, password: PW })).body.token;
    const r = await request(app)
      .post('/api/slides/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('x'), 'slide.svs');
    assert.equal(r.status, 503);
  });
});
