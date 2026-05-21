#!/usr/bin/env bash
# Sync Laravel public/ assets into cPanel public_html.
# App: /home/genecisu/repositories/GeneoRxMain
# Web: /home/genecisu/public_html
set -euo pipefail

CPANEL_USER="${CPANEL_USER:-genecisu}"
APP_DIR="${APP_DIR:-/home/${CPANEL_USER}/repositories/GeneoRxMain}"
PUBLIC_HTML="${PUBLIC_HTML:-/home/${CPANEL_USER}/public_html}"

if [[ ! -d "$APP_DIR/public" ]]; then
  echo "ERROR: $APP_DIR/public not found"
  exit 1
fi

mkdir -p "$PUBLIC_HTML"

# Copy web assets (.htaccess, favicon, build output, etc.) — exclude default index.php
if command -v rsync &>/dev/null; then
  rsync -a --exclude='index.php' "$APP_DIR/public/" "$PUBLIC_HTML/"
else
  find "$APP_DIR/public" -mindepth 1 -maxdepth 1 ! -name 'index.php' -exec cp -a {} "$PUBLIC_HTML/" \;
fi

# index.php loads Laravel from repositories/GeneoRxMain
if [[ -f "$APP_DIR/deploy/public_html.index.php" ]]; then
  cp "$APP_DIR/deploy/public_html.index.php" "$PUBLIC_HTML/index.php"
elif [[ ! -f "$PUBLIC_HTML/index.php" ]]; then
  echo "WARN: deploy/public_html.index.php missing"
  exit 1
fi

echo "==> Synced $APP_DIR/public → $PUBLIC_HTML"
