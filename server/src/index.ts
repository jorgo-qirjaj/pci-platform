import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth';
import { casesRouter } from './routes/cases';
import { statsRouter } from './routes/stats';
import { requireAuth } from './auth';
import { store } from './store';

const app = express();
const PORT = Number(process.env.PORT) || 4000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'pci-platform-api' }));

app.use('/api/auth', authRouter);
app.use('/api/cases', casesRouter);
app.use('/api/stats', statsRouter);

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
