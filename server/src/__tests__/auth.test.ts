import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../index';

const PW = '123456789';
const EMAIL = 'jandersen@pcibio.com';

describe('auth endpoints', () => {
  it('GET /api/auth/me returns the user with a valid token, 401 without', async () => {
    const login = await request(app).post('/api/auth/login').send({ email: EMAIL, password: PW });
    assert.equal(login.status, 200);

    assert.equal((await request(app).get('/api/auth/me')).status, 401);

    const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${login.body.token}`);
    assert.equal(me.status, 200);
    assert.equal(me.body.user.email, EMAIL);
    assert.equal(me.body.user.labId, 'LAB-PCI-HOUSTON');
  });

  it('rate-limits repeated login attempts (429 after the cap)', async () => {
    // The limiter allows ~10 attempts/window per IP. Burst wrong-password attempts
    // and confirm a 429 appears (earlier ones are 401 for bad credentials).
    let saw429 = false;
    for (let i = 0; i < 14; i++) {
      const r = await request(app).post('/api/auth/login').send({ email: EMAIL, password: 'wrong-password' });
      if (r.status === 429) {
        saw429 = true;
        break;
      }
      assert.equal(r.status, 401);
    }
    assert.ok(saw429, 'login is rate-limited (429) after too many attempts');
  });
});
