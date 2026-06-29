import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { NextFunction, Request, Response } from 'express';
import { PublicUser, User } from './types';
import { USERS } from './seed';
import { TokenPayloadSchema } from './validation';

const isProd = process.env.NODE_ENV === 'production';
// In production a real secret is mandatory; refuse to start without one.
const JWT_SECRET = process.env.JWT_SECRET || (isProd ? '' : 'pci-dev-secret-change-me');
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required in production — refusing to start.');
}
if (!process.env.JWT_SECRET) {
  console.warn('[auth] JWT_SECRET not set — using an insecure development secret. Set JWT_SECRET before deploying.');
}
const TOKEN_TTL = '12h';

// A valid bcrypt hash used only to equalize response time when the email is unknown,
// mitigating user-enumeration via timing. It is not a usable credential.
const TIMING_EQUALIZER_HASH = '$2b$10$p/CUH1z.emFvzNEz2Y9EDu7deqtrGnnT2HunQh8xEQ9k0LSZoJ5S6';

export function toPublic(u: User): PublicUser {
  return { email: u.email, name: u.name, role: u.role, initials: u.initials, labId: u.labId };
}

export function authenticate(email: string, password: string): User | null {
  const u = USERS.find((x) => x.email.toLowerCase() === email.toLowerCase());
  // Always run one bcrypt comparison so response time does not reveal whether the email exists.
  const ok = bcrypt.compareSync(password, u ? u.passwordHash : TIMING_EQUALIZER_HASH);
  if (!u || !ok) return null;
  return u;
}

export function issueToken(u: User): string {
  return jwt.sign(toPublic(u), JWT_SECRET, { expiresIn: TOKEN_TTL });
}

export interface AuthedRequest extends Request {
  user?: PublicUser;
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Missing bearer token' });
  }
  try {
    // Verify the signature, THEN validate the payload shape (M8) — never trust a blind cast.
    const decoded = jwt.verify(token, JWT_SECRET);
    const parsed = TokenPayloadSchema.safeParse(decoded);
    if (!parsed.success) {
      return res.status(401).json({ error: 'Invalid token payload' });
    }
    const { email, name, role, initials, labId } = parsed.data;
    req.user = { email, name, role, initials, labId };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
