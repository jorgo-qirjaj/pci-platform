# 604 — Deployment

**Status:** Open · **Band:** Quality/Ops · **Effort:** M

**Context.** The tile server runs on Railway; the API + web aren't hosted. The new tile-server code
(415 errors, upload validation, H12 auth) needs a Railway redeploy, and `UPLOAD_API_KEY` must be set
on both the API and the tile server for uploads to work.

**Acceptance.**
- [ ] API + web deployed; `JWT_SECRET`, `CORS_ORIGIN` set in prod
- [ ] `UPLOAD_API_KEY` set identically on API + tile server; tile server redeployed
- [ ] Smoke test the full upload → view → score → report path in prod

**Files.** deploy config (Railway/host)
