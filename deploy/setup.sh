#!/usr/bin/env bash
# One-command setup for a fresh Ubuntu server (e.g. Vultr Cloud Compute).
# Run as root:  bash <(curl -fsSL https://raw.githubusercontent.com/Cherlz/lacuno/main/deploy/setup.sh)
# Run it again any time to pull the latest code and restart.
set -euo pipefail

if ! command -v docker >/dev/null; then
  echo "==> Installing Docker"
  curl -fsSL https://get.docker.com | sh
fi
command -v git >/dev/null || apt-get install -y git

if [ -d /opt/lacuno ]; then
  echo "==> Updating code"
  git -C /opt/lacuno pull --ff-only
else
  echo "==> Downloading code"
  git clone https://github.com/Cherlz/lacuno /opt/lacuno
fi
cd /opt/lacuno/deploy

if [ ! -f .env ]; then
  read -rsp "Paste your ANTHROPIC_API_KEY (input hidden), then press Enter: " KEY </dev/tty; echo
  printf 'ANTHROPIC_API_KEY=%s\n' "$KEY" > .env
  chmod 600 .env
fi

# Without a domain yet, use <server-ip>.sslip.io, which still gets real HTTPS.
IP=$(curl -fsS https://api.ipify.org)
CURRENT=$(cat .domain 2>/dev/null || echo "$IP.sslip.io")
read -rp "Domain [$CURRENT]: " D </dev/tty
DOMAIN=${D:-$CURRENT}
echo "$DOMAIN" > .domain

echo "==> Building and starting (first time takes a few minutes)"
DOMAIN=$DOMAIN docker compose up -d --build
echo
echo "Done. Open: https://$DOMAIN"
