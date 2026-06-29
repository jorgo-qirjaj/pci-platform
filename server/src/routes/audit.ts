import { Router } from 'express';
import { AuthedRequest, requireAuth } from '../auth';
import { store } from '../store';

export const auditRouter = Router();

// Audit trail for the caller's lab (newest first). Optional ?accession= and ?limit=.
auditRouter.get('/', requireAuth, (req: AuthedRequest, res) => {
  const accession = typeof req.query.accession === 'string' ? req.query.accession : undefined;
  const limitRaw = Number(req.query.limit);
  const entries = store.listAudit(req.user!.labId, {
    accession,
    limit: Number.isFinite(limitRaw) ? limitRaw : undefined,
  });
  res.json({ entries });
});
