#!/usr/bin/env bash
# GeneoRx — post-deploy script for cPanel (Git deployment or manual SSH).
# Requires .env on the server (never committed to git).
set -euo pipefail

APP_DIR="${DEPLOYPATH:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
cd "$APP_DIR"

PHP_BIN="${PHP_BIN:-php}"
COMPOSER_BIN="${COMPOSER_BIN:-composer}"

echo "==> GeneoRx deploy: $APP_DIR"

if [[ ! -f .env ]]; then
  echo "ERROR: .env not found in $APP_DIR"
  echo "       Copy .env.example to .env in cPanel File Manager, then set production values."
  exit 1
fi

$PHP_BIN artisan down --refresh=60 --retry=60 2>/dev/null || true

if command -v "$COMPOSER_BIN" &>/dev/null; then
  "$COMPOSER_BIN" install --no-dev --optimize-autoloader --no-interaction
else
  $PHP_BIN "$COMPOSER_BIN" install --no-dev --optimize-autoloader --no-interaction
fi

$PHP_BIN artisan migrate --force --no-interaction
$PHP_BIN artisan storage:link --force 2>/dev/null || true

$PHP_BIN artisan config:cache
$PHP_BIN artisan route:cache
$PHP_BIN artisan view:cache
$PHP_BIN artisan event:cache 2>/dev/null || true

chmod -R ug+rwx storage bootstrap/cache 2>/dev/null || true

$PHP_BIN artisan queue:restart 2>/dev/null || true
$PHP_BIN artisan up 2>/dev/null || true

echo "==> Deploy finished successfully."
