# Deploying Sophisticat to production

This stack is designed for a single VPS (DigitalOcean, Hetzner, Linode, a
plain EC2 box, etc.) running Docker + Docker Compose, with nginx as the only
public entry point in front of Postgres, Django/gunicorn, and Next.js.

```
Internet ──▶ nginx (:80/:443) ──▶ frontend (Next.js, :3000, internal only)
                               └─▶ backend  (gunicorn, :8000, internal only) ──▶ db (Postgres, internal only)
```

Only nginx's ports 80/443 are exposed to the internet. Everything else is
reachable only on the Docker Compose network.

## 0. Prerequisites

- A server with Docker Engine and the Docker Compose plugin installed
  (`docker compose version` should work).
- A domain name, with an **A record already pointing at the server's public
  IP** before you request a certificate (Let's Encrypt verifies this).
- Ports 80 and 443 open in your firewall/security group. Everything else
  (5432, 8000, 3000) does **not** need to be open — the prod compose file
  doesn't expose them publicly at all.

## 1. Get the code onto the server and configure environment

```bash
git clone <your-repo-url> sophisticat && cd sophisticat

cp .env.production.example .env
cp backend/.env.production.example backend/.env
```

Edit both `.env` files and fill in every placeholder — **do not deploy with
the example values**, especially `DJANGO_SECRET_KEY`, `DB_PASSWORD`, and the
payment provider keys. Generate a secret key with:

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(50))"
```

Make sure `DOMAIN` in the root `.env` and `DJANGO_ALLOWED_HOSTS` /
`CORS_ALLOWED_ORIGINS` / `CSRF_TRUSTED_ORIGINS` / `FRONTEND_URL` in
`backend/.env` all agree on the same real domain.

## 2. First boot — HTTP only, no certificate yet

`nginx/templates/default.conf.template` ships as a copy of the HTTP-only
bootstrap config, so this works out of the box the first time:

```bash
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml ps
```

Check `http://your-domain/health/` responds `{"status": "ok"}` before
continuing — if it doesn't, `docker compose -f docker-compose.prod.yml logs
backend` before touching certificates.

## 3. Issue the first TLS certificate

With the bootstrap config already serving `/.well-known/acme-challenge/`
correctly, request a real certificate:

```bash
docker compose -f docker-compose.prod.yml run --rm --entrypoint certbot certbot \
  certonly --webroot -w /var/www/certbot \
  -d your-domain.com -d www.your-domain.com \
  --email you@your-domain.com --agree-tos --no-eff-email
```

If that succeeds, certs land in the `certbot_certs` volume at
`/etc/letsencrypt/live/your-domain.com/`.

## 4. Switch nginx to the full HTTPS config

```bash
cp nginx/templates-available/production.conf.template nginx/templates/default.conf.template
docker compose -f docker-compose.prod.yml restart nginx
```

Visit `https://your-domain.com` — you should get a valid certificate and be
redirected there automatically from `http://`.

From here on, the `certbot` service (already running as part of the stack)
renews the certificate automatically every ~60 days; you don't need to
repeat steps 3–4 unless you change domains.

## 5. Set up the database

```bash
docker compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser
# optional, seeds demo catalog data:
docker compose -f docker-compose.prod.yml exec backend python manage.py seed_data
```

(Migrations already ran automatically on boot — see
`RUN_MIGRATIONS_ON_BOOT` in the root `.env` if you later move to multiple
backend replicas and want to control that manually instead.)

## 6. Ongoing operations

**Logs:**
```bash
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f nginx
```

**Deploying an update:**
```bash
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

**Database backups** — the Postgres data lives in the `postgres_data` named
volume. At minimum, cron a nightly dump:
```bash
docker compose -f docker-compose.prod.yml exec -T db \
  pg_dump -U sophisticat_user sophisticat | gzip > backup-$(date +%F).sql.gz
```
Store these somewhere off the server (S3, Backblaze, etc.) — a volume
snapshot alone doesn't protect you if the server itself is lost.

**Rotating the DB password / secrets** — update both `.env` files, then
`docker compose -f docker-compose.prod.yml up -d` to recreate the affected
containers.

## Notes

- The frontend is built with `NEXT_PUBLIC_API_URL=https://your-domain/api`
  baked in at build time (see `docker-compose.prod.yml`) — the frontend and
  API share one origin in production, which avoids CORS and the
  HTTP/HTTPS mixed-content issue entirely. If you ever split them onto
  separate domains, you'll need to revisit `CORS_ALLOWED_ORIGINS` and
  rebuild the frontend with the new API URL.
- Product/order images are served from local disk via nginx unless
  `CLOUDINARY_*` is configured in `backend/.env` — recommended for
  production so images survive volume recreation and get CDN caching.
- `docker-compose.prod.yml` is intentionally a standalone file, not an
  override of `docker-compose.yml` (the dev compose file) — see the comment
  at the top of that file for why.
