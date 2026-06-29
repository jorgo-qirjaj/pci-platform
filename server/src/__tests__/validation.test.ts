import { describe, it, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../index';
import { store } from '../store';

/**
 * Tickets 109 (M1 request validation, M8 JWT payload) and 110 (M2 admin reset lockdown).
 */

const EMAIL = 'jandersen@pcibio.com';
const PASSWORD = '123456789';
const auth = (t: string) => ({ Authorization: `Bearer ${t}` });

let token = '';
before(async () => {
  const r = await request(app).post('/api/auth/login').send({ email: EMAIL, password: PASSWORD });
  token = r.body.token;
});
beforeEach(() => store.reset());

describe('request validation (109 — M1)', () => {
  it('rejects malformed or incomplete login with 400', async () => {
    assert.equal((await request(app).post('/api/auth/login').send({ email: 'not-an-email', password: 'x' })).status, 400);
    assert.equal((await request(app).post('/api/auth/login').send({ email: EMAIL })).status, 400); // no password
  });

  it('still returns 401 (not 400) for well-formed but wrong credentials', async () => {
    assert.equal((await request(app).post('/api/auth/login').send({ email: EMAIL, password: 'wrong' })).status, 401);
  });

  it('rejects case creation with an invalid biomarker (400)', async () => {
    const r = await request(app).post('/api/cases').set(auth(token)).send({ biomarker: 'XYZ' });
    assert.equal(r.status, 400);
  });

  it('accepts a valid case creation (201)', async () => {
    const r = await request(app).post('/api/cases').set(auth(token)).send({ biomarker: 'p53', site: 'Lab A' });
    assert.equal(r.status, 201);
    assert.equal(r.body.case.biomarker, 'p53');
  });
});

describe('JWT payload validation (109 — M8)', () => {
  it('rejects a signed token that is missing required fields (401)', async () => {
    // Correctly signed with the test secret, but no labId — must not be trusted.
    const bad = jwt.sign({ email: EMAIL, name: 'x', role: 'y', initials: 'z' }, process.env.JWT_SECRET as string, {
      expiresIn: '1h',
    });
    assert.equal((await request(app).get('/api/cases').set(auth(bad))).status, 401);
  });
});

describe('admin reset lockdown (110 — M2)', () => {
  it('requires authentication', async () => {
    assert.equal((await request(app).post('/api/admin/reset')).status, 401);
  });

  it('is disabled in production', async () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      assert.equal((await request(app).post('/api/admin/reset').set(auth(token))).status, 403);
    } finally {
      process.env.NODE_ENV = prev;
    }
  });

  it('works in non-production', async () => {
    assert.equal((await request(app).post('/api/admin/reset').set(auth(token))).status, 200);
  });
});
