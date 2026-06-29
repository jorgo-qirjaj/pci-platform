# 402 — Authenticated, validated slide upload

**Status:** Done · **Maps to:** H12 · **Band:** Slide pipeline

**What.** Uploads go through the JWT-gated API proxy `POST /api/slides/upload`, which forwards with a
shared `X-Upload-Key`; the tile server fails closed without it. Files are validated as real WSIs
(OpenSlide-openable) before storage; size-capped.

**Files.** `server/src/routes/slides.ts`, `pci-viewer/backend/routes/slides.py`, `web/src/components/UploadZone.tsx`
