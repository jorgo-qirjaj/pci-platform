# Tech stack

## API — `server/`
- **Node + TypeScript** (strict), CommonJS, run with **tsx** in dev.
- **Express 4** — routing/middleware.
- **jsonwebtoken** — JWT bearer auth; **bcryptjs** — password hashing.
- **helmet** — security headers; **express-rate-limit** — login throttling; **cors** — strict origin allowlist.
- **multer** (2.x) + **form-data** + **axios** — the authenticated slide-upload proxy.
- **zod** — request/JWT-payload validation.
- **SQLite** via **Drizzle ORM** + **better-sqlite3** — durable, transactional store (ticket 302).

## Web — `web/`
- **React 18 + TypeScript**, **Vite** (dev server + build).
- **react-router-dom** — routing.
- **OpenSeadragon** — whole-slide image viewer (tiles + native navigator).
- **lucide-react** — icons (curated registry).
- Inline-style components ported from the design system; CSS-variable tokens.

## Tile server — `pci-viewer/` (separate repo)
- **Python + FastAPI**, served by **uvicorn**.
- **OpenSlide** (`openslide-bin`) — WSI decoding/tiling; **Pillow** — JPEG encode.
- **boto3** — S3 access; persistent local cache of downloaded slides.
- Deployed on **Railway**.

## Quality & tooling
- **node:test + supertest** — API tests (deliberately no vitest/vite/esbuild → 0 audit findings).
- **tsc** — typechecking (`tsconfig.build.json` keeps tests out of the prod build).
- **GitHub Actions** — CI gate (typecheck + tests).
- **npm workspaces** — `server` + `web` monorepo.

## Notable conventions
- A score is provenance-stamped and deterministic (see architecture.md).
- The store path is env-overridable so tests never touch real data.
- Uploads are validated as real WSIs before they reach storage.
