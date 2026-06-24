import jwt from 'jsonwebtoken';
import { NextFunction, Request, Response } from 'express';
import { PublicUser, User } from './types';
import { USERS } from './seed';

const JWT_SECRET = process.env.JWT_SECRET || 'pci-dev-secret-change-me';
const TOKEN_TTL = '12h';

export function toPublic(u: User): PublicUser {
  return { email: u.email, name: u.name, role: u.role, initials: u.initials };
}

export function authenticate(email: string, password: string): User | null {
  const u = USERS.find((x) => x.email.toLowerCase() === email.toLowerCase());
  if (!u || u.password !== password) return null;
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
    const payload = jwt.verify(token, JWT_SECRET) as PublicUser & { iat: number; exp: number };
    req.user = { email: payload.email, name: payload.name, role: payload.role, initials: payload.initials };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
