import { Router } from 'express';
import { authenticate, AuthedRequest, issueToken, requireAuth } from '../auth';

export const authRouter = Router();

authRouter.post('/login', (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  const user = authenticate(String(email), String(password));
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
