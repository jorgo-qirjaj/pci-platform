import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { authRouter } from './routes/auth';
import { casesRouter } from './routes/cases';
import { statsRouter } from './routes/stats';
import { slidesRouter } from './routes/slides';
import { requireAuth } from './auth';
import { store } from './store';

const app = express();
const PORT = Number(process.env.PORT) || 4000;

// Restrict cross-origin access to known frontends (comma-separated CORS_ORIGIN, defaults to the dev web origin).
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',').map((o) => o.trim());

app.use(helmet());
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'pci-platform-api' }));

app.use('/api/auth', authRouter);
app.use('/api/cases', casesRouter);
app.use('/api/stats', statsRouter);
app.use('/api/slides', slidesRouter);

// Demo convenience: reset the case store back to seed data.
app.post('/api/admin/reset', requireAuth, (_req, res) => {
  store.reset();
  res.json({ ok: true });
});

// 404 for unknown API routes.
app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

app.listen(PORT, () => {
  console.log(`[pci-api] listening on http://localhost:${PORT}`);
});
