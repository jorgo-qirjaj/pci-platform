# PCI Pathology Platform

A digital-pathology case platform: a pathologist signs in, works a list of cases by accession
number (never patient names), opens a case into a real whole-slide viewer, runs **p53AI** to
score a drawn region against on-slide **TriControl™** OE/WT/NULL cell-line controls, and finalizes
a structured IHC biomarker report.

> PCI's smaller, IHC-focused answer to NEOGenomics / Tempus — cleaner, faster, and anchored to
> on-slide cell-line controls.

> ⚠️ **Investigational / research-use prototype — not for clinical diagnosis.**
> See [`docs/REMEDIATION.md`](docs/REMEDIATION.md) for the security & quality backlog that gates real-data use.

## Repository layout

| Path | What |
|---|---|
| `server/` | Express + TypeScript API — auth, cases, scoring, authenticated slide-upload proxy |
| `web/` | React + Vite single-page app (OpenSeadragon viewer) |
| `docs/` | [architecture](docs/architecture.md) · [tech stack](docs/tech-stack.md) · [plan](docs/plan.md) · [remediation backlog](docs/REMEDIATION.md) |
| `tickets/` | Work items, numbered by layer — see [`docs/plan.md`](docs/plan.md) |
| *(separate repo)* `pci-viewer` | FastAPI + OpenSlide tile server; serves WSI tiles from S3 |

## Quickstart

```bash
npm install        # installs both workspaces
npm run dev        # API on :4000 + web on :5173 (concurrently)
npm test           # node:test + supertest suite
npm run typecheck  # server + web
```

Then open **http://localhost:5173**. Demo login (pre-filled): `jandersen@pcibio.com` / `123456789`
(second lab, for tenant-isolation testing: `rkhan@northshore.example` / `123456789`).

## Configuration (environment)

| Var | Purpose |
|---|---|
| `JWT_SECRET` | Token signing secret — **required** in production (dev falls back with a warning) |
| `UPLOAD_API_KEY` | Shared secret gating slide uploads; set the **same** value on the API and the tile server |
| `TILE_API_TARGET` | Tile-server base URL (default: the Railway deployment) |
| `CORS_ORIGIN` · `PORT` · `PCI_STORE_FILE` | Origin allowlist · API port · store-file override (tests use a throwaway store) |

## What's inside

- **Screens** — Login · Dashboard/Cases · Case detail (info panel · OpenSeadragon viewer with ROI
  tools + minimap · AI scoring) · print-ready Report · Reports, TriControl™ QC, Team, Settings.
- **Scoring is trustworthy by contract** — deterministic + versioned + region-anchored, hard-gated
  on real QC controls and the per-biomarker magnification cap. (p53AI is a deterministic mock — no
  real inference, no PHI.) See [`docs/architecture.md`](docs/architecture.md).
- **Security** — JWT auth, bcrypt passwords, lab-level tenant isolation, an authenticated upload
  proxy, rate limiting, and security headers. Backlog tracked in [`docs/REMEDIATION.md`](docs/REMEDIATION.md).

The full API surface, data flow, auth/tenancy model, and scoring contract are documented in
[`docs/architecture.md`](docs/architecture.md).
