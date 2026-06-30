# Deploy runbook — AWS (Phase 1)

Phase 1 = **API + web on one Lightsail instance**, with the **tile server staying on Railway** and
**CloudFront providing HTTPS**. No reverse proxy is needed on the box — the Express server serves the
web build *and* proxies `/slides` + `/tiles`, so it's a single service on port 4000.

```
browser ──HTTPS──▶ CloudFront (*.cloudfront.net) ──HTTP:4000──▶ Lightsail VM
                                                                 └─ Express: web + /api + proxy
                                                                              │
                                                          /slides,/tiles ─────┘──▶ Railway tile server ──▶ S3
```

## 1. Lightsail instance
- Create an **Ubuntu 22.04** instance (start at **2 GB RAM**).
- Attach a **static IP**.
- Networking → add a firewall rule allowing **TCP 4000** (CloudFront will reach the box on this port).

## 2. Set up the app (on the box)
```bash
ssh ubuntu@<static-ip>
curl -fsSL https://raw.githubusercontent.com/jorgo-qirjaj/pci-platform/main/deploy/aws-setup.sh -o aws-setup.sh
bash aws-setup.sh
cp server/.env.example server/.env && nano server/.env     # fill in secrets (see below)
sudo cp deploy/pci-platform.service /etc/systemd/system/
sudo systemctl daemon-reload && sudo systemctl enable --now pci-platform
curl -s localhost:4000/api/health                          # {"ok":true,...}
```
**Secrets in `server/.env`:** `JWT_SECRET` and `UPLOAD_API_KEY` (each `openssl rand -hex 32`),
`TILE_API_TARGET` = your Railway tile-server URL, `CORS_ORIGIN` = your CloudFront URL (fill after step 3).

## 3. CloudFront (free HTTPS URL)
Create a distribution:
- **Origin:** the static IP · **Protocol:** HTTP only · **Port:** 4000
- **Viewer protocol policy:** Redirect HTTP → HTTPS
- **Cache behaviors** (this is the important part — don't cache dynamic paths):

  | Path pattern | Cache policy | Origin request policy |
  |---|---|---|
  | `/api/*` | **CachingDisabled** | **AllViewer** (forwards Authorization) |
  | `/slides/*` | CachingDisabled | AllViewer |
  | `/tiles/*` | CachingOptimized (tiles are immutable — cache them) | — |
  | `Default (*)` | CachingOptimized (static JS/CSS) | — |

The distribution domain (`https://xxxx.cloudfront.net`) is your demo link. Put it in `CORS_ORIGIN`
in `server/.env`, then `sudo systemctl restart pci-platform`.

## 4. Tile server (Railway)
- Redeploy **pci-viewer** with the latest code (brings the 415/validation/auth fixes).
- Set **`UPLOAD_API_KEY`** on Railway to the **same value** as the box — otherwise uploads stay disabled (503).

## 5. Smoke test
Open the CloudFront URL → log in (`jandersen@pcibio.com` / `123456789`) → open a case, view the slide,
score it, open the report. Uploads should work once step 4's keys match.

## Notes
- **Phase 1 needs no AWS credentials on the box** — the Railway tile server still handles S3.
- Demo data is SQLite on the box; it reseeds if removed. Persistent data / scale → Postgres (finding M10).
- **Phase 2** (move the tile server onto the box: install OpenSlide, give the box S3 access) is a
  separate runbook — do it once Phase 1 is live.
