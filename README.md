# PCI Pathology Platform

A full-stack implementation of the **PCI Pathology Platform** from the PCI Design System
handoff. A pathologist signs in, works a list of cases by accession number (never patient
names), opens a case into the whole-slide viewer, runs **p53AI** to score a region against
on-slide TriControl™ cell-line controls, and finalizes a structured IHC biomarker report.

> PCI's smaller, IHC-focused answer to NEOGenomics / Tempus — cleaner, faster, and anchored
> to on-slide cell-line controls.

## Stack

| Layer    | Tech                                                              |
| -------- | ---------------------------------------------------------------- |
| Frontend | React 18 + TypeScript + Vite, React Router, `lucide-react` icons |
| Backend  | Node + Express + TypeScript (JWT auth), in-memory store w/ JSON persistence |
| Design   | PCI Design System tokens (`web/src/styles/tokens`) + a ported React component library (`web/src/components/ds`) |

This is a workspace monorepo: `server/` (API) and `web/` (frontend).

## Getting started

```bash
npm install      # installs both workspaces
npm run dev      # runs API (:4000) and web (:5173) together
```

Then open **http://localhost:5173**.

Demo credentials (pre-filled on the login screen):

```
email:    jandersen@pcibio.com
password: 123456789
```

Other useful scripts:

```bash
npm run typecheck   # typecheck server + web
npm run build       # build both for production
npm run dev:server  # API only
npm run dev:web     # frontend only
```

## Screens

1. **Login** — split navy brand panel + sign-in form (real JWT auth).
2. **Dashboard / Cases** — KPI stats, status tabs, searchable case table, "New case" modal.
3. **Case detail** — info panel · dark slide viewer (MagBar, ROI, AI overlay, minimap) ·
   AI scoring panel. **Run p53AI** calls the backend live; PDL1 cases cap magnification at 20×.
4. **Report** — print-ready IHC biomarker report with letterhead, representative fields,
   AI score, TriControl™ QC, generated interpretation, disclaimer, and signature.

Plus functional **Reports**, **TriControl™ QC**, **Team**, and **Settings** pages so the
whole navigation is live.

## API

All routes are under `/api`. Everything except `/api/health` and `/api/auth/login`
requires a `Bearer` token.

| Method | Path                          | Purpose                                  |
| ------ | ----------------------------- | ---------------------------------------- |
| POST   | `/auth/login`                 | Exchange credentials for a JWT           |
| GET    | `/auth/me`                    | Current user                             |
| GET    | `/stats`                      | Dashboard KPIs                           |
| GET    | `/cases?status=&q=`           | List / filter cases                      |
| POST   | `/cases`                      | Create a case (assigns next accession)   |
| GET    | `/cases/:accession`           | Case detail                              |
| POST   | `/cases/:accession/score`     | Run (or re-run) p53AI                     |
| POST   | `/cases/:accession/finalize`  | Mark the case complete                   |
| GET    | `/cases/:accession/report`    | Structured report payload                |
| POST   | `/admin/reset`                | Restore seed data (demo convenience)     |

Case data is seeded from the design system mock and persisted to `server/data/store.json`.
The **p53AI** scoring is a deterministic synthetic model (`server/src/ai.ts`) — it produces
calibrated scores per biomarker but performs no real inference and touches no PHI.

## Provenance

Ported pixel-for-pixel from the PCI Design System handoff (`ui_kits/platform`). The design
medium was HTML/CSS/JS prototypes; this repo recreates them as production React while reusing
the exact design tokens. The real whole-slide viewer (React + OpenSeadragon, see
[github.com/PCI-Bio/pci-viewer](https://github.com/PCI-Bio/pci-viewer)) is mocked here
cosmetically via pure CSS (`web/src/components/ds/Tissue.tsx`).
