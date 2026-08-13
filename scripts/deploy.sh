#!/usr/bin/env bash
# Sync landing page and legal pages to nginx static directories on the VPS.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LANDING_DEST="${LANDING_DEST:-/var/www/eyenewz}"
LEGAL_DEST="${LEGAL_DEST:-/var/www/eyenewz-legal}"
LEGACY_LEGAL="${LEGACY_LEGAL:-/var/www/trusted-news-legal}"
TECH_DEST="${TECH_DEST:-/var/www/eyenewz-tech}"

mkdir -p "$LANDING_DEST"
rsync -a --delete \
  --exclude 'legal/' \
  --exclude 'scripts/' \
  --exclude 'README.md' \
  --exclude '.git/' \
  "$ROOT/" "$LANDING_DEST/"
cp -f "$ROOT/robots.txt" "$LANDING_DEST/robots.txt"
cp -f "$ROOT/sitemap.xml" "$LANDING_DEST/sitemap.xml"
test -f "$LANDING_DEST/assets/og-image.png"
test -f "$LANDING_DEST/js/feed.js"
test -f "$LANDING_DEST/js/api.js"
test -f "$LANDING_DEST/js/store.js"
test -f "$LANDING_DEST/js/card.js"
test -f "$LANDING_DEST/404.html"
find "$LANDING_DEST" -type f -exec chmod 644 {} \;
find "$LANDING_DEST" -type d -exec chmod 755 {} \;

mkdir -p "$LEGAL_DEST" "$LEGACY_LEGAL"
cp "$ROOT/legal/privacy.html" "$LEGAL_DEST/privacy.html"
cp "$ROOT/legal/terms.html" "$LEGAL_DEST/terms.html"
cp "$ROOT/legal/contact.html" "$LEGAL_DEST/contact.html"
cp "$ROOT/legal/about.html" "$LEGAL_DEST/about.html"
cp "$ROOT/legal/how-it-works.html" "$LEGAL_DEST/how-it-works.html"
cp "$ROOT/legal/download.html" "$LEGAL_DEST/download.html"
cp "$ROOT/legal/company.html" "$LEGAL_DEST/company.html"
cp "$ROOT/legal/publishers.html" "$LEGAL_DEST/publishers.html"
cp "$ROOT/legal/advertisers.html" "$LEGAL_DEST/advertisers.html"
cp "$ROOT/legal/press.html" "$LEGAL_DEST/press.html"
chmod 644 "$LEGAL_DEST"/*.html
cp "$LEGAL_DEST/privacy.html" "$LEGACY_LEGAL/privacy.html"
cp "$LEGAL_DEST/terms.html" "$LEGACY_LEGAL/terms.html"
chmod 644 "$LEGACY_LEGAL"/*.html

mkdir -p "$TECH_DEST/assets" "$TECH_DEST/.well-known"
rsync -a --delete \
  --exclude 'README.md' \
  "$ROOT/tech/" "$TECH_DEST/"
cp -f "$ROOT/assets/logo.svg" "$TECH_DEST/assets/logo.svg"
cp -f "$ROOT/assets/google-play-badge.svg" "$TECH_DEST/assets/google-play-badge.svg"
if [[ -f "$ROOT/assets/logo.png" ]]; then
  cp -f "$ROOT/assets/logo.png" "$TECH_DEST/assets/logo.png"
fi
if [[ -f "$ROOT/assets/og-image.png" ]]; then
  cp -f "$ROOT/assets/og-image.png" "$TECH_DEST/assets/og-image.png"
fi
test -f "$TECH_DEST/index.html"
test -f "$TECH_DEST/js/tech.js"
test -f "$TECH_DEST/css/tech.css"
test -f "$TECH_DEST/get.html"
test -f "$TECH_DEST/robots.txt"
test -f "$TECH_DEST/sitemap.xml"
find "$TECH_DEST" -type f -exec chmod 644 {} \;
find "$TECH_DEST" -type d -exec chmod 755 {} \;

echo "Landing page synced to $LANDING_DEST"
echo "Legal and marketing pages synced to $LEGAL_DEST and $LEGACY_LEGAL"
echo "EyeNewz Tech synced to $TECH_DEST"
echo "SEO: robots.txt sitemap.xml og-image.png present"
