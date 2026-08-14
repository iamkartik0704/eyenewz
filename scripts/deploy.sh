#!/usr/bin/env bash
# Build the React site and sync landing, legal, and Tech to nginx dirs on the VPS.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LANDING_DEST="${LANDING_DEST:-/var/www/eyenewz}"
LEGAL_DEST="${LEGAL_DEST:-/var/www/eyenewz-legal}"
LEGACY_LEGAL="${LEGACY_LEGAL:-/var/www/trusted-news-legal}"
TECH_DEST="${TECH_DEST:-/var/www/eyenewz-tech}"
ASSETS_SRC="$ROOT/public/assets"
if [[ ! -d "$ASSETS_SRC" ]]; then
  ASSETS_SRC="$ROOT/assets"
fi
LEGAL_SRC="$ROOT/legal"
if [[ ! -d "$LEGAL_SRC" ]]; then
  LEGAL_SRC="$ROOT/public/legal"
fi

cd "$ROOT"
if [[ ! -d node_modules ]]; then
  npm ci
else
  npm ci --prefer-offline
fi
npm run build
DIST="$ROOT/dist"
test -f "$DIST/index.html"

mkdir -p "$LANDING_DEST"
rsync -a --delete \
  --exclude 'legal/' \
  "$DIST/" "$LANDING_DEST/"
cp -f "$ROOT/robots.txt" "$LANDING_DEST/robots.txt"
cp -f "$ROOT/sitemap.xml" "$LANDING_DEST/sitemap.xml"
if [[ -f "$ROOT/404.html" ]]; then
  cp -f "$ROOT/404.html" "$LANDING_DEST/404.html"
fi
if [[ -d "$ROOT/.well-known" ]]; then
  mkdir -p "$LANDING_DEST/.well-known"
  cp -a "$ROOT/.well-known/." "$LANDING_DEST/.well-known/"
fi
mkdir -p "$LANDING_DEST/css"
if [[ -f "$ROOT/public/css/legal.css" ]]; then
  cp -f "$ROOT/public/css/legal.css" "$LANDING_DEST/css/legal.css"
elif [[ -f "$ROOT/src/css/legal.css" ]]; then
  cp -f "$ROOT/src/css/legal.css" "$LANDING_DEST/css/legal.css"
fi
test -f "$LANDING_DEST/index.html"
test -f "$LANDING_DEST/assets/og-image.png"
test -f "$LANDING_DEST/robots.txt"
test -f "$LANDING_DEST/sitemap.xml"
find "$LANDING_DEST" -type f -exec chmod 644 {} \;
find "$LANDING_DEST" -type d -exec chmod 755 {} \;

mkdir -p "$LEGAL_DEST" "$LEGACY_LEGAL"
cp "$LEGAL_SRC/privacy.html" "$LEGAL_DEST/privacy.html"
cp "$LEGAL_SRC/terms.html" "$LEGAL_DEST/terms.html"
cp "$LEGAL_SRC/contact.html" "$LEGAL_DEST/contact.html"
cp "$LEGAL_SRC/about.html" "$LEGAL_DEST/about.html"
cp "$LEGAL_SRC/how-it-works.html" "$LEGAL_DEST/how-it-works.html"
cp "$LEGAL_SRC/download.html" "$LEGAL_DEST/download.html"
cp "$LEGAL_SRC/company.html" "$LEGAL_DEST/company.html"
cp "$LEGAL_SRC/publishers.html" "$LEGAL_DEST/publishers.html"
cp "$LEGAL_SRC/advertisers.html" "$LEGAL_DEST/advertisers.html"
cp "$LEGAL_SRC/press.html" "$LEGAL_DEST/press.html"
chmod 644 "$LEGAL_DEST"/*.html
cp "$LEGAL_DEST/privacy.html" "$LEGACY_LEGAL/privacy.html"
cp "$LEGAL_DEST/terms.html" "$LEGACY_LEGAL/terms.html"
chmod 644 "$LEGACY_LEGAL"/*.html

mkdir -p "$TECH_DEST/assets" "$TECH_DEST/.well-known"
rsync -a --delete \
  --exclude 'README.md' \
  "$ROOT/tech/" "$TECH_DEST/"
cp -f "$ASSETS_SRC/logo.svg" "$TECH_DEST/assets/logo.svg"
cp -f "$ASSETS_SRC/google-play-badge.svg" "$TECH_DEST/assets/google-play-badge.svg"
if [[ -f "$ASSETS_SRC/logo.png" ]]; then
  cp -f "$ASSETS_SRC/logo.png" "$TECH_DEST/assets/logo.png"
fi
if [[ -f "$ASSETS_SRC/og-image.png" ]]; then
  cp -f "$ASSETS_SRC/og-image.png" "$TECH_DEST/assets/og-image.png"
fi
test -f "$TECH_DEST/index.html"
test -f "$TECH_DEST/js/tech.js"
test -f "$TECH_DEST/css/tech.css"
test -f "$TECH_DEST/get.html"
test -f "$TECH_DEST/robots.txt"
test -f "$TECH_DEST/sitemap.xml"
find "$TECH_DEST" -type f -exec chmod 644 {} \;
find "$TECH_DEST" -type d -exec chmod 755 {} \;

echo "Landing page (Vite dist) synced to $LANDING_DEST"
echo "Legal and marketing pages synced to $LEGAL_DEST and $LEGACY_LEGAL"
echo "EyeNewz Tech synced to $TECH_DEST"
echo "SEO: robots.txt sitemap.xml present"
echo "If article URLs 404, include scripts/nginx-spa-locations.conf in the eyenewz.com server block and reload nginx."
