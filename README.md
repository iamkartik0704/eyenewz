# EyeNewz website (`eyenewz-website`)

Public site for **eyenewz.com**. This is **not** the admin CMS (`eyenewz-admin`) and **not** the news API (`eyenewz-backend`).

**Who clones this:** frontend / website developers  
**Live:** https://eyenewz.com  
**Start here for the whole product:** [eyenewz-docs](https://github.com/Newscontent/eyenewz-docs)

## Day-1 setup

```bash
git clone git@github.com:Newscontent/eyenewz-website.git
cd eyenewz-website
npm install
npm run dev
```

Open http://localhost:3000

`npm run dev` proxies `/web-api` to production so the feed loads real stories. Production nginx injects the API key; never put a key in frontend JS.

## Pages

| Page | URL |
|------|-----|
| Home | https://eyenewz.com/ |
| Story | https://eyenewz.com/a/{id} |
| EyeNewz Tech | https://tech.eyenewz.com/ |
| Tech download / group share | https://tech.eyenewz.com/get |
| Contact | https://eyenewz.com/contact-us |
| Privacy | https://eyenewz.com/privacy |
| Terms | https://eyenewz.com/terms |

## Deploy

On the VPS (DNS for `eyenewz.com` already points here):

```bash
./scripts/deploy.sh
```

Runs `npm ci && npm run build`, then syncs `dist/` to `/var/www/eyenewz`, legal HTML to `/var/www/eyenewz-legal`, Tech to `/var/www/eyenewz-tech`.

Article routes (`/a/…`, `/article/…`) need an nginx fallback to `index.html`. Include `scripts/nginx-spa-locations.conf` in the eyenewz.com server block (before `location /`), then `nginx -t && systemctl reload nginx`.

Play Store badge: https://play.google.com/store/apps/details?id=com.prod.contentnews

## Related repos

| Repo | Role |
|------|------|
| [eyenewz-docs](https://github.com/Newscontent/eyenewz-docs) | Map and onboarding |
| [eyenewz-android](https://github.com/Newscontent/eyenewz-android) | Play Store app |
| [eyenewz-backend](https://github.com/Newscontent/eyenewz-backend) | News API |
| [eyenewz-admin](https://github.com/Newscontent/eyenewz-admin) | Admin UI |

Old GitHub name: `Frontend-website` (redirects here).
