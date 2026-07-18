# EyeNewz Website

Static landing page and legal pages for [eyenewz.com](https://eyenewz.com).

## All pages

| Page | URL |
|------|-----|
| Home (landing) | https://eyenewz.com/ |
| Contact Us | https://eyenewz.com/contact-us |
| Privacy Policy | https://eyenewz.com/privacy |
| Terms & Conditions | https://eyenewz.com/terms |

## Structure

| Path | URL |
|------|-----|
| `index.html` | https://eyenewz.com/ |
| `legal/privacy.html` | https://eyenewz.com/privacy |
| `legal/terms.html` | https://eyenewz.com/terms |

## Local preview

```bash
python3 -m http.server 8080
```

Open http://localhost:8080

## Deploy to VPS

On the server (after DNS for `eyenewz.com` points to the VPS):

```bash
./scripts/deploy.sh
```

This syncs the landing page to `/var/www/eyenewz` and legal pages to `/var/www/eyenewz-legal`.

## Play Store link

The Google Play badge on the landing page and the footer “Get the app” link open:

https://play.google.com/store/apps/details?id=com.prod.contentnews

## Related repo

Android app and API: [Newscontent/trusted-news](https://github.com/Newscontent/trusted-news)
