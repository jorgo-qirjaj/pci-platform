# 604 — Deploy a hosted demo (AWS Lightsail, from scratch)

**Status:** Repo prep done · deploy pending (user) · **Band:** Quality/Ops · **Effort:** M

**Decision.** From scratch (no Railway, **no S3**): **one Lightsail VM** runs everything — the Node app
+ web *and* the Python tile server — with **slides on the box's local disk** and **CloudFront** for free
HTTPS. (Rationale in `docs/deploy-aws.md`.)

**Prepped (in repo):**
- `SERVE_WEB=1` → Express serves the web build + proxies `/slides`+`/tiles` (one service, one URL). Verified.
- `deploy/aws-setup.sh` (Node + Python + builds both repos), `deploy/pci-platform.service` +
  `deploy/pci-tileserver.service` (systemd), `server/.env.example` + `deploy/tileserver.env.example`,
  and `deploy/README.md` (Lightsail + CloudFront cache behaviors + local slides).
- Tile server runs local-only (no `AWS_BUCKET_NAME`) — `openslide-bin` bundles the native lib, so no apt.

**Remaining (needs the user's AWS account):** create the Lightsail instance, run the setup script, set
secrets (matching `UPLOAD_API_KEY` on both services), add a demo slide, create the CloudFront distribution.

**Later:** S3/RDS for durable, scalable storage (finding M10 — code already supports S3 via `AWS_BUCKET_NAME`).

**Files.** `server/src/index.ts`, `deploy/*`, `server/.env.example`, `docs/deploy-aws.md`
