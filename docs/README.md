# PCI Pathology Platform

A digital-pathology case platform: manage IHC cases, view whole-slide images (WSI),
run **p53AI** scoring against on-slide **TriControl™** OE/WT/NULL cell-line controls,
and generate biomarker reports.

> ⚠️ **Investigational / research-use prototype — not for clinical diagnosis.**
> See [`REMEDIATION.md`](REMEDIATION.md) for the security & quality backlog that gates any real-data use.

## Repository layout

| Path | What |
|---|---|
| `server/` | Express + TypeScript API — auth, cases, scoring, authenticated slide-upload proxy |
| `web/` | React + Vite single-page app |
| `docs/` | Architecture, tech stack, plan, and the remediation backlog |
| `tickets/` | Work items, numbered by layer — see [`plan.md`](plan.md) |
| *(separate repo)* `pci-viewer` | FastAPI + OpenSlide tile server; serves WSI tiles from S3 |

## Quickstart

```bash
npm install
npm run dev        # API on :4000 + web on :5173 (concurrently)
npm test           # node:test + supertest suite
npm run typecheck  # server + web
```

Demo login: `jandersen@pcibio.com` / `123456789`
(A second lab's user, for tenant-isolation testing: `rkhan@northshore.example` / `123456789`.)

## Configuration (environment)

| Var | Purpose |
|---|---|
| `JWT_SECRET` | Token signing secret — **required** in production (dev falls back with a warning) |
| `UPLOAD_API_KEY` | Shared secret gating slide uploads; set the **same** value on the API and the tile server |
| `TILE_API_TARGET` | Tile-server base URL (default: the Railway deployment) |
| `CORS_ORIGIN` | Allowed web origin(s), comma-separated |
| `PORT` | API port (default 4000) |
| `PCI_STORE_FILE` | Override the JSON store path (used by tests for a throwaway store) |

## Docs

- [`architecture.md`](architecture.md) — components, data flow, auth & tenancy, scoring contract
- [`tech-stack.md`](tech-stack.md) — the stack and why
- [`plan.md`](plan.md) — milestones, status, and the ticket scheme
- [`REMEDIATION.md`](REMEDIATION.md) — prioritized security & quality findings
