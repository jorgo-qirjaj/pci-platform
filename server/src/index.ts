import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { authRouter } from './routes/auth';
import { casesRouter } from './routes/cases';
import { statsRouter } from './routes/stats';
import { slidesRouter } from './routes/slides';
import { auditRouter } from './routes/audit';
import { requireAuth } from './auth';
import { store } from './store';

export const app = express();
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
app.use('/api/audit', auditRouter);

// Demo convenience: reset the case store back to seed data. Disabled in production —
// it wipes all data, so it must never be reachable on a real deployment (M2).
app.post('/api/admin/reset', requireAuth, (_req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'The reset endpoint is disabled in production.' });
  }
  store.reset();
  res.json({ ok: true });
});

// 404 for unknown API routes.
app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

// Start the HTTP listener only when run as the server. Under test the app is
// imported into Supertest, which drives it without binding a port.
if (process.env.NODE_ENV !== 'test') {
  const server = app.listen(PORT, () => {
    console.log(`[pci-api] listening on http://localhost:${PORT}`);
  });

  // Graceful shutdown (M11-a): stop accepting connections, let in-flight requests finish,
  // flush the store, then exit. Force-exit if draining stalls.
  const shutdown = (signal: string) => {
    console.log(`[pci-api] ${signal} received — draining in-flight requests…`);
    server.close(() => {
      store.flush();
      console.log('[pci-api] drained and flushed; exiting.');
      process.exit(0);
    });
    setTimeout(() => {
      console.error('[pci-api] drain timed out; forcing exit.');
      process.exit(1);
    }, 10_000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}
