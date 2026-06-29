import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate, AuthedRequest, issueToken, requireAuth } from '../auth';
import { LoginSchema, parseBody } from '../validation';

export const authRouter = Router();

// Throttle credential-stuffing / brute force against the login endpoint.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again later.' },
});

authRouter.post('/login', loginLimiter, (req, res) => {
  const body = parseBody(LoginSchema, req.body, res);
  if (!body) return;
  const user = authenticate(body.email, body.password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  const token = issueToken(user);
  return res.json({
    token,
    user: { email: user.email, name: user.name, role: user.role, initials: user.initials },
  });
});

authRouter.get('/me', requireAuth, (req: AuthedRequest, res) => {
  res.json({ user: req.user });
});
