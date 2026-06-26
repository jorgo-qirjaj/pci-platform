import { Router, type Request, type Response, type NextFunction } from 'express';
import multer from 'multer';
import FormData from 'form-data';
import axios from 'axios';
import fs from 'fs';
import os from 'os';
import { requireAuth } from '../auth';

export const slidesRouter = Router();

// The whole-slide tile server (FastAPI/OpenSlide). Same target the Vite dev proxy
// uses for read traffic; overridable for local testing.
const TILE_API = (process.env.TILE_API_TARGET || 'https://pci-viewer-production.up.railway.app').replace(/\/$/, '');
// Shared secret that authorizes writes on the tile server. MUST match UPLOAD_API_KEY
// there. Kept server-side only — the browser never sees it.
const UPLOAD_API_KEY = process.env.UPLOAD_API_KEY || '';
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024 * 1024; // 2 GB

const upload = multer({ dest: os.tmpdir(), limits: { fileSize: MAX_UPLOAD_BYTES } });

/**
 * Authenticated upload proxy (closes audit finding H12).
 *
 * The browser is authenticated to THIS API by JWT (requireAuth). We then forward
 * the file to the tile server adding the shared X-Upload-Key header, so the tile
 * server's /slides/upload is never reachable without going through an authenticated
 * platform user — and the secret itself stays on the server.
 */
slidesRouter.post('/upload', requireAuth, upload.single('file'), async (req: Request, res: Response) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ error: 'No file provided (form field must be named "file").' });
  }
  if (!UPLOAD_API_KEY) {
    fs.unlink(file.path, () => {});
    return res
      .status(503)
      .json({ error: 'Uploads are disabled: UPLOAD_API_KEY is not configured on the API server.' });
  }
  try {
    const form = new FormData();
    form.append('file', fs.createReadStream(file.path), file.originalname);
    const resp = await axios.post(`${TILE_API}/slides/upload`, form, {
      headers: { ...form.getHeaders(), 'X-Upload-Key': UPLOAD_API_KEY },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      validateStatus: () => true, // forward the tile server's status/detail verbatim
    });
    return res.status(resp.status).json(resp.data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'upload proxy failed';
    return res.status(502).json({ error: `Tile server upload failed: ${msg}` });
  } finally {
    fs.unlink(file.path, () => {});
  }
});

// Multer/upload error handler — turn a too-large file into a clean 413.
slidesRouter.use((err: { code?: string; message?: string }, _req: Request, res: Response, next: NextFunction) => {
  if (!err) return next();
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File too large (max 2 GB).' });
  }
  return res.status(400).json({ error: err.message || 'Upload error' });
});
