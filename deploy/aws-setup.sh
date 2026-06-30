#!/usr/bin/env bash
# One-time setup for a fresh Ubuntu 22.04+ Lightsail instance — Phase 1 (API + web).
# Run as the 'ubuntu' user:  bash aws-setup.sh
set -euo pipefail

echo "==> Installing Node 20 + build tools (better-sqlite3 compiles a native module)…"
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs build-essential git

echo "==> Cloning / updating the repo…"
cd "$HOME"
if [ ! -d pci-platform ]; then
  git clone https://github.com/jorgo-qirjaj/pci-platform.git
fi
cd pci-platform
git pull --ff-only || true

echo "==> Installing dependencies + building (server -> dist, web -> dist)…"
npm ci
npm run build
mkdir -p server/data

cat <<'NEXT'

==> Build complete. Next steps:
  1. Create the env file:   cp server/.env.example server/.env  &&  nano server/.env
       - set JWT_SECRET and UPLOAD_API_KEY (each: openssl rand -hex 32)
       - set CORS_ORIGIN to your CloudFront URL once you have it
  2. Install + start the service:
       sudo cp deploy/pci-platform.service /etc/systemd/system/
       sudo systemctl daemon-reload && sudo systemctl enable --now pci-platform
       sudo systemctl status pci-platform        # should be active, listening on :4000
  3. Confirm locally:  curl -s localhost:4000/api/health

See deploy/README.md for the CloudFront + Railway steps.
NEXT
