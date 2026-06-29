# Architecture

## Components

```
        browser (React/Vite SPA, :5173)
           │  /api/*            │  /slides/*, /tiles/*
           ▼                    ▼
   Express API (:4000)    FastAPI tile server  ──►  S3 (WSI files)
   - JWT auth             (OpenSlide)
   - cases / scoring      - tile rendering
   - upload proxy ───────►- /slides/upload (key-gated)
   - JSON store (file)
```

- **web/** — single-page app. Talks to the API over `/api/*` and to the tile server over
  `/slides/*` and `/tiles/*` (proxied by Vite in dev; `TILE_API_TARGET` selects the backend).
- **server/** — Express + TypeScript. Owns auth, the case domain, scoring, and an
  **authenticated upload proxy** that forwards slide uploads to the tile server with a shared key.
- **tile server (pci-viewer)** — FastAPI + OpenSlide in a separate repo. Resolves a slide from
  local disk → S3 cache → S3, renders 256px JPEG tiles, and serves slide metadata. Deployed on Railway.

## Data flow

- **Read a case:** browser → `GET /api/cases/:accession` → Express checks the JWT and lab
  ownership → returns the case from the in-memory store.
- **View a slide:** browser → `GET /slides/:id/info` then `/tiles/:id/:level/:x/:y.jpeg` → tile
  server (OpenSlide) → S3. Unsupported/missing slides return 415/404 with a clear reason.
- **Upload a slide:** browser → `POST /api/slides/upload` (JWT) → Express attaches `X-Upload-Key`
  → tile server validates it's a real WSI → S3.

## Auth & tenancy

- **JWT** bearer tokens, 12 h TTL, signed with `JWT_SECRET` (required in prod). Passwords are bcrypt-hashed.
- **Lab tenancy (C4):** every user and case carries a `labId`. `GET /api/cases` is scoped to the
  caller's lab; every `/cases/:accession*` route resolves via `findOwned()`, which returns 404 for
  both missing **and** cross-tenant cases (no enumeration oracle). Cases also carry an opaque UUID.
- **Upload auth (H12):** the tile server's `/slides/upload` requires `X-Upload-Key` and fails closed
  if unset; the browser only reaches it through the JWT-gated API proxy, so the key stays server-side.

## Scoring contract (result integrity)

p53AI is a **deterministic mock** (no real CV model), but a produced score is trustworthy *by contract*:

- **Deterministic + versioned (H5):** the numeric result is a pure function of
  `(accession, regionId, modelVersion)` — re-runs reproduce. Each score stamps `modelVersion`,
  `regionId`, `magnification`, and `operator`; prior runs are retained in `scoreHistory`.
- **Region-anchored (H5):** scoring requires a drawn region and anchors the result to it.
- **QC hard gate (H2):** on-slide controls (OE/WT/NULL) are an intake input; scoring is blocked
  (409) unless the biomarker's required controls are present (p53 → OE+WT+NULL, others → OE+WT).
- **Magnification gate (H3):** capture magnification is enforced per biomarker (PDL1 ≤20×, others 40×);
  over-cap is blocked (409).

## Persistence

- In-memory store with best-effort JSON persistence (`server/data/store.json`), overridable via
  `PCI_STORE_FILE`. A migration backfills fields added over time (`labId`, opaque `id`, slide `magnification`).
- **Known limitation (H8):** non-atomic full-file writes — a real database is the next data-layer step.

## Testing & CI

- `server/src/__tests__/*.test.ts` run on Node's built-in `node:test` + Supertest (via tsx) — no
  vitest/vite toolchain, so the dependency tree stays clean. Files run serially (shared temp store).
- `.github/workflows/ci.yml` gates every push/PR on typecheck + tests.
