# 604 — Deploy a hosted demo (AWS Lightsail, from scratch)

**Status:** ✅ Done — live at https://d1fdfdzi31rjlv.cloudfront.net (2026-07-01) · **Band:** Quality/Ops · **Effort:** M

**Decision.** From scratch (no Railway, **no S3**): **one Lightsail VM** runs everything — the Node app
+ web *and* the Python tile server — with **slides on the box's local disk** and **CloudFront** for free
HTTPS. (Rationale in `docs/deploy-aws.md`.)

**Prepped (in repo):**
- `SERVE_WEB=1` → Express serves the web build + proxies `/slides`+`/tiles` (one service, one URL). Verified.
- `deploy/aws-setup.sh` (Node + Python + builds both repos), `deploy/pci-platform.service` +
  `deploy/pci-tileserver.service` (systemd), `server/.env.example` + `deploy/tileserver.env.example`,
  and `deploy/README.md` (Lightsail + CloudFront cache behaviors + local slides).
- Tile server runs local-only (no `AWS_BUCKET_NAME`) — `openslide-bin` bundles the native lib, so no apt.

**Deployed (2026-07-01).** Ubuntu Lightsail box (static IP `3.128.207.152`) runs both services via
systemd; `helmet` CSP tuned so assets load over plain HTTP behind CloudFront (dropped
`upgrade-insecure-requests`, allowed inline styles + cdnjs icons). CloudFront distribution `pci-demo`
(`d1fdfdzi31rjlv.cloudfront.net`): **Other** origin → `3-128-207-152.sslip.io` HTTP:4000, Redirect
HTTP→HTTPS, methods incl. POST/DELETE, **CachingDisabled + AllViewer** (transparent proxy), free-plan
WAF in **monitor mode**, rate-limiting **off** (tile bursts would false-positive). `CORS_ORIGIN` set to
the CloudFront URL on the box. **Verified over HTTPS:** login, slide view, scoring/reports.

**Later:**
- S3/RDS for durable, scalable storage (finding M10 — code already supports S3 via `AWS_BUCKET_NAME`).
- Before an external pilot: flip WAF out of monitor mode + tune a rate limit that accounts for tile traffic.
- Large uploads should go direct-to-box (scp), not through CloudFront (~30–60s origin timeout).

**Files.** `server/src/index.ts`, `deploy/*`, `server/.env.example`, `docs/deploy-aws.md`
