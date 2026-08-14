# EyeNewz i18n foundation (Phase 2)

## Status

- **v1 (now):** English UI. String catalogs exist for `en`, `de`, `ja`.
- **Not wired yet:** Feed chrome still reads English from HTML; catalogs are the source of truth for Phase 2.

## Files

| Locale | Path |
|--------|------|
| English | [`i18n/en.json`](en.json) |
| German | [`i18n/de.json`](de.json) |
| Japanese | [`i18n/ja.json`](ja.json) |

## Planned wiring

1. Load `/i18n/{locale}.json` based on `navigator.language` or `?lang=` / market selector.
2. Apply strings to `[data-i18n]` nodes in `index.html` and legal shells.
3. Pass `language=` to `/web-api/v1/feed` when content localization is ready.
4. Add `hreflang` on key pages:
   - `en` → `https://eyenewz.com/...`
   - `de` → `https://eyenewz.com/de/...` (or `?lang=de` until path routing exists)
   - `ja` → `https://eyenewz.com/ja/...`
   - `x-default` → English

## Tagline rule

**Always keep:** `Tech News & Daily Briefs` (same in all locales unless marketing explicitly translates it later).

## Next engineering step

Add a small `js/i18n.js` that fetches the catalog and replaces `data-i18n` keys; do not block English demos on full DE/JA content feeds.
