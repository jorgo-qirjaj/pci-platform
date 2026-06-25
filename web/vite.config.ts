import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Whole-slide tile server (FastAPI + OpenSlide). Defaults to the deployed
// Railway backend; override with TILE_API_TARGET=http://localhost:8000 to use
// a local tile server. Proxying server-side means the browser sees same-origin
// requests, so there's no CORS to configure.
const TILE_API = process.env.TILE_API_TARGET || 'https://pci-viewer-production.up.railway.app';

// Frontend dev server proxies /api to the Express backend on :4000,
// and /slides + /tiles to the whole-slide tile server.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/slides': {
        target: TILE_API,
        changeOrigin: true,
        secure: true,
      },
      '/tiles': {
        target: TILE_API,
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
