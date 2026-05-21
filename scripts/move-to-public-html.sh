#!/usr/bin/env bash
# One-time (or repeat) publish GeneoRx to cPanel public_html.
# Keeps Laravel app in repositories/GeneoRxMain — only web files go to public_html.
#
# Run on server:
#   bash /home/genecisu/repositories/GeneoRxMain/scripts/move-to-public-html.sh
#
set -euo pipefail

CPANEL_USER="${CPANEL_USER:-genecisu}"
APP_DIR="${APP_DIR:-/home/${CPANEL_USER}/repositories/GeneoRxMain}"
PUBLIC_HTML="${PUBLIC_HTML:-/home/${CPANEL_USER}/public_html}"
BACKUP_DIR="${BACKUP_DIR:-/home/${CPANEL_USER}/public_html_backup_$(date +%Y%m%d_%H%M%S)}"

echo "==> GeneoRx: publish to public_html"
echo "    App:  $APP_DIR"
echo "    Web:  $PUBLIC_HTML"

if [[ ! -d "$APP_DIR" ]]; then
  echo "ERROR: App folder missing: $APP_DIR"
  echo "       Clone GitHub in cPanel Git first."
  exit 1
fi

if [[ ! -d "$APP_DIR/vendor" ]]; then
  echo "ERROR: vendor/ missing. Run first:"
  echo "  cd $APP_DIR && php /opt/cpanel/composer/bin/composer install --no-dev --optimize-autoloader"
  exit 1
fi

if [[ ! -f "$APP_DIR/.env" ]]; then
  echo "ERROR: .env missing in $APP_DIR"
  echo "       Copy .env.example to .env in File Manager."
  exit 1
fi

# Backup existing public_html (parking page, old site, etc.)
if [[ -d "$PUBLIC_HTML" ]] && [[ "$(ls -A "$PUBLIC_HTML" 2>/dev/null || true)" != "" ]]; then
  echo "==> Backing up current public_html → $BACKUP_DIR"
  cp -a "$PUBLIC_HTML" "$BACKUP_DIR"
fi

mkdir -p "$PUBLIC_HTML"

export CPANEL_USER APP_DIR PUBLIC_HTML
bash "$APP_DIR/scripts/sync-public-html.sh"

echo ""
echo "==> Done. Your site should load from public_html."
echo "    Test: https://geneorx.com/up"
echo "    Laravel code stays in: $APP_DIR"
echo "    Backup (if any): $BACKUP_DIR"
