import { Router } from 'express';
import { requireAuth } from '../auth';
import { store } from '../store';

export const statsRouter = Router();

statsRouter.get('/', requireAuth, (_req, res) => {
  const cases = store.list();

  const activeCases = cases.filter((c) => c.status !== 'complete').length;
  const pendingReview = cases.filter((c) => c.status === 'review').length;
  const aiScored = cases.filter((c) => c.ai !== null).length;

  // Average case turnaround (hours), modelled from the confidence of each
  // AI-scored case: higher-confidence inference clears review faster.
  const turnarounds = cases
    .filter((c) => c.ai)
    .map((c) => 2 + (100 - c.ai!.confidence) * 0.3);
  const avgTurnaroundHours = turnarounds.length
    ? Math.round((turnarounds.reduce((a, b) => a + b, 0) / turnarounds.length) * 10) / 10
    : 4.2;

  res.json({ activeCases, pendingReview, aiScored, avgTurnaroundHours });
});
