# 401 — Tile server + OpenSeadragon viewer

**Status:** Done · **Band:** Slide pipeline

**What.** Real WSI viewing: FastAPI/OpenSlide tile server (local → S3-cache → S3) + OpenSeadragon
in the app. Slide-open errors are unmasked (missing → 404, unopenable → 415 with a clear reason).

**Files.** `pci-viewer/backend/` (separate repo), `web/src/components/viewer/SlideViewer.tsx`
