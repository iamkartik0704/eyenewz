#!/usr/bin/env bash
# Sync landing page and legal pages to nginx static directories on the VPS.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LANDING_DEST="${LANDING_DEST:-/var/www/eyenewz}"
LEGAL_DEST="${LEGAL_DEST:-/var/www/eyenewz-legal}"
LEGACY_LEGAL="${LEGACY_LEGAL:-/var/www/trusted-news-legal}"

mkdir -p "$LANDING_DEST"
rsync -a --delete \
  --exclude 'legal/' \
  --exclude 'scripts/' \
  --exclude 'README.md' \
  --exclude '.git/' \
  "$ROOT/" "$LANDING_DEST/"
find "$LANDING_DEST" -type f -exec chmod 644 {} \;
find "$LANDING_DEST" -type d -exec chmod 755 {} \;

mkdir -p "$LEGAL_DEST" "$LEGACY_LEGAL"
cp "$ROOT/legal/privacy.html" "$LEGAL_DEST/privacy.html"
cp "$ROOT/legal/terms.html" "$LEGAL_DEST/terms.html"
chmod 644 "$LEGAL_DEST"/*.html
cp "$LEGAL_DEST/privacy.html" "$LEGACY_LEGAL/privacy.html"
cp "$LEGAL_DEST/terms.html" "$LEGACY_LEGAL/terms.html"
chmod 644 "$LEGACY_LEGAL"/*.html

echo "Landing page synced to $LANDING_DEST"
echo "Legal pages synced to $LEGAL_DEST and $LEGACY_LEGAL"
