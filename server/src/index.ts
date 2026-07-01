import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import axios from 'axios';
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

// Security headers. The CSP is tuned for this app: it uses inline styles (design-system
// components) and loads the OpenSeadragon control icons from a CDN, and we drop
// upgrade-insecure-requests so the app also works when reached directly over HTTP (behind
// CloudFront everything is already HTTPS, so it's a no-op there).
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:', 'https://cdnjs.cloudflare.com'],
        connectSrc: ["'self'"],
        upgradeInsecureRequests: null,
      },
    },
  }),
);
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

// In production the API also serves the built web app and proxies slide/tile reads to the
// tile server (in dev, Vite's proxy does both). Enable with SERVE_WEB=1.
if (process.env.SERVE_WEB === '1') {
  const TILE = (process.env.TILE_API_TARGET || 'https://pci-viewer-production.up.railway.app').replace(/\/$/, '');
  // Stream read-only slide/tile requests through to the tile server.
  app.use(['/slides', '/tiles'], async (req, res) => {
    try {
      const upstream = await axios.get(`${TILE}${req.originalUrl}`, { responseType: 'stream', validateStatus: () => true });
      res.status(upstream.status);
      if (upstream.headers['content-type']) res.type(String(upstream.headers['content-type']));
      if (upstream.headers['cache-control']) res.set('cache-control', String(upstream.headers['cache-control']));
      upstream.data.pipe(res);
    } catch {
      res.status(502).json({ error: 'Tile server unreachable' });
    }
  });

  // Serve the static web build, falling back to index.html for client-side routes.
  const webDist = path.join(__dirname, '..', '..', 'web', 'dist');
  app.use(express.static(webDist));
  app.get('*', (_req, res) => res.sendFile(path.join(webDist, 'index.html')));
}

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
