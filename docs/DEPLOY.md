# Deployment (VPS / Node server / Docker — NOT Vercel)

MarkazOS is built with `output: 'standalone'`, so it runs as a normal long-running
Node web app. Use a VPS (Hostinger, DigitalOcean, Contabo, AWS EC2, etc.) or Docker.

## Prerequisites
- Node.js 20+ on the server (or Docker)
- A PostgreSQL database (Supabase or self-hosted). SQLite is fine only for local dev.

## Option A — Plain Node on a VPS

```bash
# 1. Clone & install
git clone <your-repo> && cd markazos
npm ci

# 2. Configure env (production)
cp .env.example .env
#   set DATABASE_URL (+ DIRECT_URL for Postgres), AUTH_SECRET, NEXT_PUBLIC_APP_URL

# 3. For Postgres: switch datasource provider to "postgresql" in prisma/schema.prisma,
#    then create the schema and seed:
npx prisma migrate deploy
npm run db:seed        # optional demo data

# 4. Build
npm run build

# 5. Run the standalone server
node .next/standalone/server.js
#    (listens on PORT, default 3000)
```

Keep it alive with **PM2** or a systemd service:

```bash
npm i -g pm2
PORT=3000 pm2 start .next/standalone/server.js --name markazos
pm2 save && pm2 startup
```

Put **Nginx** in front for HTTPS:

```nginx
server {
  server_name your-domain.com;
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```
Then issue a certificate with `certbot --nginx`.

## Option B — Docker

```bash
docker build -t markazos .
docker run -d -p 3000:3000 --env-file .env --name markazos markazos
```

Run migrations once against your DB: `docker run --env-file .env markazos npx prisma migrate deploy`.

## Switching from SQLite (dev) to Postgres (prod)
1. In `prisma/schema.prisma` set `provider = "postgresql"` and add `directUrl = env("DIRECT_URL")`.
2. Set `DATABASE_URL` / `DIRECT_URL` to your Postgres/Supabase strings.
3. `npx prisma migrate deploy` (or `db push`), then `npm run db:seed`.

The app code is database-agnostic; only the datasource block changes.
