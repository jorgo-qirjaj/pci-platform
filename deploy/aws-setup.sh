#!/usr/bin/env bash
# From-scratch setup for a fresh Ubuntu 22.04+ Lightsail instance.
# Runs BOTH services on this one box: the Node app (API + web) and the Python tile
# server (OpenSlide; slides on local disk — no S3). Run as 'ubuntu':  bash aws-setup.sh
set -euo pipefail

echo "==> System packages (Node 20, build tools for better-sqlite3, Python)…"
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs build-essential git python3 python3-venv python3-pip

cd "$HOME"

echo "==> Platform: API + web…"
[ -d pci-platform ] || git clone https://github.com/jorgo-qirjaj/pci-platform.git
( cd pci-platform && (git pull --ff-only || true) && npm ci && npm run build && mkdir -p server/data )

echo "==> Tile server: Python + OpenSlide (openslide-bin bundles the native lib — no apt needed)…"
[ -d pci-viewer ] || git clone https://github.com/jorgo-qirjaj/pci-viewer.git
cd pci-viewer
git pull --ff-only || true
python3 -m venv venv
./venv/bin/pip install --upgrade pip
./venv/bin/pip install -r requirements.txt
mkdir -p backend/slides        # local slide storage (no S3)

cat <<'NEXT'

==> Build complete. Next steps:

  1. Create the env files — use the SAME UPLOAD_API_KEY in both:
       cd ~/pci-platform && cp server/.env.example server/.env && nano server/.env
         # JWT_SECRET + UPLOAD_API_KEY  ->  each: openssl rand -hex 32
         # TILE_API_TARGET=http://localhost:8000   (tile server is on this box)
         # CORS_ORIGIN=<your CloudFront URL>        (fill in after the CloudFront step)
       printf 'UPLOAD_API_KEY=<same value as above>\nPORT=8000\n' > ~/pci-viewer/backend/.env

  2. Install + start both services:
       sudo cp ~/pci-platform/deploy/pci-platform.service   /etc/systemd/system/
       sudo cp ~/pci-platform/deploy/pci-tileserver.service /etc/systemd/system/
       sudo systemctl daemon-reload
       sudo systemctl enable --now pci-tileserver pci-platform
       curl -s localhost:4000/api/health    # {"ok":true,...}
       curl -s localhost:8000/health         # {"status":"ok"}

  3. Add a demo slide (optional): drop a .svs into ~/pci-viewer/backend/slides/, or
     upload one through the app once it's live.

See deploy/README.md for the CloudFront (HTTPS) step.
NEXT
