# Deploy runbook — AWS Lightsail (everything on one box, from scratch)

One Ubuntu Lightsail instance runs **both** the Node app (API + web) **and** the Python tile server,
with **slides on the box's local disk (no S3)** and **CloudFront** for HTTPS. No Railway, no S3, no AWS keys.

```
browser ──HTTPS──▶ CloudFront (*.cloudfront.net) ──HTTP:4000──▶ Lightsail box
                                                                ├─ Express (Node) :4000  web + /api + proxy
                                                                │       /slides,/tiles ──▶ :8000
                                                                └─ FastAPI tile server :8000 (localhost only)
                                                                        OpenSlide + slides on local disk
```

## 1. Lightsail instance
- **Ubuntu 22.04**, start at **4 GB RAM** (~$24/mo — two services + slide tiling; 2 GB is tight).
- Attach a **static IP**.
- Firewall: allow **TCP 4000** only. (The tile server on 8000 stays internal — Express proxies to it.)

## 2. Set up the box
```bash
ssh ubuntu@<static-ip>
curl -fsSL https://raw.githubusercontent.com/jorgo-qirjaj/pci-platform/main/deploy/aws-setup.sh -o aws-setup.sh
bash aws-setup.sh
```
Then create the two env files (**same `UPLOAD_API_KEY` in both**):
```bash
cd ~/pci-platform && cp server/.env.example server/.env && nano server/.env
  # JWT_SECRET + UPLOAD_API_KEY  (each: openssl rand -hex 32)
  # TILE_API_TARGET=http://localhost:8000
  # CORS_ORIGIN=<your CloudFront URL>   (fill after step 4)
printf 'UPLOAD_API_KEY=<same value>\nPORT=8000\n' > ~/pci-viewer/backend/.env
```
Install + start both services:
```bash
sudo cp ~/pci-platform/deploy/pci-platform.service ~/pci-platform/deploy/pci-tileserver.service /etc/systemd/system/
sudo systemctl daemon-reload && sudo systemctl enable --now pci-tileserver pci-platform
curl -s localhost:4000/api/health    # {"ok":true,...}
curl -s localhost:8000/health         # {"status":"ok"}
```

## 3. Add a demo slide
Drop a public sample WSI into `~/pci-viewer/backend/slides/` (e.g. OpenSlide's freely-distributable
`CMU-1.svs`), **or** just upload one through the app once it's live. It then appears in the Slide viewer.

## 4. CloudFront (free HTTPS)
New distribution:
- **Origin:** the static IP · HTTP · **port 4000**
- **Viewer protocol:** Redirect HTTP → HTTPS
- **Cache behaviors:**

  | Path | Cache policy | Origin request policy |
  |---|---|---|
  | `/api/*` | CachingDisabled | AllViewer (forwards Authorization) |
  | `/slides/*` | CachingDisabled | AllViewer |
  | `/tiles/*` | CachingOptimized (tiles are immutable) | — |
  | `Default (*)` | CachingOptimized (static JS/CSS) | — |

The distribution's `https://xxxx.cloudfront.net` is your demo link. Put it in `server/.env` →
`CORS_ORIGIN`, then `sudo systemctl restart pci-platform`.

## 5. Smoke test
Open the CloudFront URL → log in (`jandersen@pcibio.com` / `123456789`) → view the slide, score a case,
open the report, try an upload.

## Notes
- **No S3, no AWS keys** — slides live on the box. (S3/RDS are the path later for durable, scalable
  storage — findings M10. The code already supports S3 by just setting `AWS_BUCKET_NAME`.)
- Both services auto-restart and survive reboots (systemd). **Update later:**
  `cd ~/pci-platform && git pull && npm run build && sudo systemctl restart pci-platform` (and similarly
  `cd ~/pci-viewer && git pull && ./venv/bin/pip install -r requirements.txt && sudo systemctl restart pci-tileserver`).
- Demo data is SQLite on the box; it reseeds if the file is removed.
