#!/usr/bin/env bash
# GeneoRx — post-deploy script for cPanel (Git deployment or manual SSH).
# Requires .env on the server (never committed to git).
set -euo pipefail

APP_DIR="${DEPLOYPATH:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
cd "$APP_DIR"

PHP_BIN="${PHP_BIN:-php}"
COMPOSER_BIN="${COMPOSER_BIN:-}"

echo "==> GeneoRx deploy: $APP_DIR"

if [[ ! -f .env ]]; then
  echo "ERROR: .env not found in $APP_DIR"
  echo "       Copy .env.example to .env in cPanel File Manager, then set production values."
  exit 1
fi

# --- maintenance-mode guard -------------------------------------------------
# `set -e` aborts this script the moment any step below fails. Without a guard,
# that leaves the app in maintenance mode indefinitely: a failed deploy took the
# production site down with a permanent 503 until it was cleared by hand.
# Always restore the app if we exit before reaching the `artisan up` below.
maintenance_guard() {
  local code=$?
  if [[ $code -ne 0 ]]; then
    echo "ERROR: deploy failed (exit $code) — restoring the app from maintenance mode." >&2
    $PHP_BIN artisan up 2>/dev/null || true
  fi
}

$PHP_BIN artisan down --refresh=60 --retry=60 2>/dev/null || true
trap maintenance_guard EXIT

# Locate composer. cPanel does not put it on PATH for deploy/cron shells, and the
# previous fallback ran `$PHP_BIN composer`, which fails with
# "Could not open input file: composer" — that is what aborted the deploy and
# left the site in maintenance mode. Search the known cPanel locations instead.
resolve_composer() {
  if [[ -n "${COMPOSER_BIN:-}" && "$COMPOSER_BIN" != "composer" ]]; then
    printf '%s
' "$COMPOSER_BIN"
    return 0
  fi
  if command -v composer &>/dev/null; then
    command -v composer
    return 0
  fi
  local candidate
  for candidate in /opt/cpanel/composer/bin/composer                    /opt/alt/php82/usr/bin/composer                    /opt/alt/php83/usr/bin/composer                    /usr/local/bin/composer                    "$HOME/composer.phar"                    "$APP_DIR/composer.phar"; do
    if [[ -f "$candidate" ]]; then
      printf '%s
' "$candidate"
      return 0
    fi
  done
  return 1
}

COMPOSER_CMD="$(resolve_composer || true)"
if [[ -z "$COMPOSER_CMD" ]]; then
  echo "ERROR: composer not found. Set COMPOSER_BIN=/full/path/to/composer and re-run." >&2
  exit 1
fi
echo "==> composer: $COMPOSER_CMD"

if [[ "$COMPOSER_CMD" == *.phar || ! -x "$COMPOSER_CMD" ]]; then
  $PHP_BIN "$COMPOSER_CMD" install --no-dev --optimize-autoloader --no-interaction
else
  "$COMPOSER_CMD" install --no-dev --optimize-autoloader --no-interaction
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

# Publish web files to cPanel public_html (auto when folder exists; disable with SYNC_PUBLIC_HTML=0)
CPANEL_USER="${CPANEL_USER:-$(whoami)}"
PUBLIC_HTML="/home/${CPANEL_USER}/public_html"
if [[ -f "$APP_DIR/scripts/sync-public-html.sh" ]]; then
  if [[ "${SYNC_PUBLIC_HTML:-}" != "0" ]] && [[ -d "$PUBLIC_HTML" ]]; then
    export CPANEL_USER APP_DIR PUBLIC_HTML
    bash "$APP_DIR/scripts/sync-public-html.sh"
  fi
fi

echo "==> Deploy finished successfully."
