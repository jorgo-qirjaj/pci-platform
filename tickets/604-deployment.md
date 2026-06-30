# 604 — Deploy a hosted demo (AWS)

**Status:** Repo prep done · deploy pending (user) · **Band:** Quality/Ops · **Effort:** M

**Decision.** Centralize on AWS: a single **Lightsail** VM runs the API + web (one origin), with the
tile server staying on **Railway** for Phase 1; **CloudFront** provides free HTTPS. (See `docs/deploy-aws.md`.)

**Prepped (in repo):**
- `SERVE_WEB=1` makes Express serve the production web build + proxy `/slides`+`/tiles` — single service,
  one URL. Verified locally (SPA served, same-origin API, tiles proxied, client-route fallback).
- `deploy/aws-setup.sh`, `deploy/pci-platform.service`, `server/.env.example`, and the step-by-step
  `deploy/README.md` (Lightsail + CloudFront cache behaviors + Railway tile-server key).

**Remaining (needs the user's AWS account):** create the Lightsail instance, run the setup script, set
secrets, create the CloudFront distribution, and set `UPLOAD_API_KEY` on the Railway tile server.

**Phase 2 (later):** move the tile server onto the box (OpenSlide + S3 IAM) for full centralization.

**Files.** `server/src/index.ts`, `deploy/*`, `server/.env.example`, `docs/deploy-aws.md`
