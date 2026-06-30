# AWS deployment plan (centralized)

**Goal:** one shareable HTTPS demo link, with everything on AWS next to the existing S3 slides.

> Honest tradeoff: centralizing on AWS is more setup + ongoing ops than a push-to-deploy host
> (Render/Railway). The payoff is one roof and reusing your existing AWS account. This plan keeps it
> as simple as AWS allows.

## Why a VM (not serverless)

Our app has two **stateful** pieces that need a real server with a disk:
- the **API** stores data in **SQLite** (a file on disk), and
- the **tile server** uses **OpenSlide** (a native library) + a local slide cache.

Both rule out AWS Lambda / stateless containers. So the proven-simple AWS choice is a small
**Lightsail** instance — AWS's fixed-price "mini-server" (a VPS).

## Architecture — one Lightsail instance

```
                 your domain  ── HTTPS (Caddy auto-cert)
                       │
                  ┌────▼────┐   Lightsail Ubuntu VM
   browser ──────▶│  Caddy  │   reverse proxy + HTTPS
                  └──┬───┬──┘
        / , /api     │   │   /slides , /tiles
             ┌───────▼┐ ┌▼─────────────┐
             │Express │ │ FastAPI tile │
             │(+ web) │ │  (OpenSlide) │
             │ :4000  │ │    :8000     │
             └───┬────┘ └──────┬───────┘
            SQLite file       reads slides
            (on disk)          │
                               ▼
                          S3 (slides) ── already there
```

- **Express also serves the built web** → one origin, no CORS to fight.
- **SQLite on the instance disk** — demo data; reseeds on redeploy. Production scale → Postgres/RDS
  later (that's finding **M10**; a cheap switch via Drizzle).
- The instance reads slides from **S3** via an **IAM role** (no keys on disk).
- **Caddy** gives automatic HTTPS and routes by path.

*(More AWS-native alternative — web on S3+CloudFront, API/tile on the VM — adds pieces + CORS. Skip
for the demo; revisit if traffic grows.)*

## Phasing (recommended — a link sooner, lower risk)

1. **Phase 1:** API + web on the Lightsail VM; the **tile server stays on Railway** for now (it works).
   → a working shareable demo quickly, with the trickier Python/OpenSlide move isolated.
2. **Phase 2:** move the tile server onto the same VM (install OpenSlide) → fully on AWS.

## Cost (verify current pricing on AWS)

| Item | Rough cost |
|---|---|
| Lightsail VM (2 GB for Phase 1; 4 GB once tiling 1–2 GB slides in Phase 2) | ~$10–20/mo |
| HTTPS — a domain pointed at the VM | ~$12/yr · or CloudFront for a free `*.cloudfront.net` URL (more setup) |
| S3 (slides) | already paying |

The $5 / 1 GB instance is likely too small for slide tiling in Phase 2.

## What I prepare (in the repo)

- Express serves the production **web build** (single origin).
- **Production routing** for `/slides` + `/tiles` (Caddy proxies them to the tile server — replaces
  the Vite dev proxy we use locally).
- A `Caddyfile` (reverse proxy + auto-HTTPS).
- A `deploy/aws-setup.sh` (installs Node, Python, OpenSlide, Caddy; sets up pm2/systemd services).
- An `.env.example` (`JWT_SECRET`, `UPLOAD_API_KEY`, `CORS_ORIGIN`, `AWS_*`).
- Exact, copy-paste deploy steps.

## What you do (needs your AWS account)

- Create the Lightsail instance + attach a **static IP**.
- Point your domain's DNS at that IP (if using a domain).
- Create the **IAM role/permissions** granting S3 access to the slide bucket(s).
- SSH in, run the setup script, paste the secrets, start the services.

## Decisions to confirm before I build the config

1. **Lightsail single-VM** (recommended) — ok, or do you want a different AWS service?
2. **Phase it** (API + web first, tile server later) — ok?
3. **HTTPS** — a domain you own / will buy (~$12/yr), or a free CloudFront URL (more setup)?
4. **Instance size** — start at 2 GB (Phase 1), bump to 4 GB when the tile server moves (Phase 2)?
