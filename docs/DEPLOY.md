# Deployment

MarkazOS is a long-running Node.js web app. It is **not** a static site and it does
**not** work on Vercel/Netlify-style serverless hosting.

Supported targets:

| Target | How |
|--------|-----|
| **Hostinger Node.js web apps** (primary) | [Option A](#option-a--hostinger-nodejs-web-apps) below |
| VPS / any Node server | [Option B](#option-b--plain-node-on-a-vps) |
| Docker | [Option C](#option-c--docker) |

---

## Option A — Hostinger Node.js web apps

Works on **Business** web hosting and **Cloud Startup / Professional / Enterprise /
Enterprise Plus**. Requires a plan with Node.js web app support. You can also do this
by uploading an archive instead of connecting Git — pick either in step 2.

### A1. Create the database (do this first)

hPanel → **Databases → Databases → Create new database**.

Note the four values it shows you: database name, username, password, and the
**MySQL hostname** (e.g. `srv1517.hstgr.io`). Hostinger runs **MariaDB** on port
`3306`; Prisma's `mysql` provider is wire-compatible with it.

Then hPanel → **Databases → Remote MySQL**:

- Add the **hosting account's own IP** to the allow list. Without this the Node app
  is refused, because it reaches the database over TCP from outside the MySQL socket.
- Add **your local public IP** too, if you want to run migrations from your own
  machine (step A4). Find it by searching "what is my IP".

> ⚠️ **Do not use `localhost` in `DATABASE_URL` for a Node.js app.**
> `localhost` works for PHP because PHP connects over a Unix socket. Node resolves
> `localhost` to the IPv6 loopback `::1` and connects over TCP instead — a path the
> database user is not granted for — and you get `ECONNREFUSED`. Use the hostname
> hPanel shows you.

### A2. Create the Node.js web app

hPanel → **Websites → Add Website → Node.js web app**.

- **Import Git repository** — connect GitHub, pick this repo. Every push to the
  selected branch then rebuilds and redeploys automatically (recommended).
- **Upload your files** — zip the project *without* `node_modules` and `.git`, then
  upload. No auto-redeploy; you must re-upload for each change.

If the domain is already added as a regular website, remove it first (back it up).

### A3. Deploy settings

Hostinger auto-detects Next.js and prefills these. Verify:

| Field | Value |
|-------|-------|
| Framework preset | `next` |
| Root directory | `/` (repo root — `package.json` is there) |
| Node.js version | `20` (LTS) or `22` |
| Install command | `npm ci` |
| Build command | `build` (runs `prisma generate && next build`) |
| Output directory | `.next` |
| **Entry file** | `server.js` ← see note below |

> **Why an entry file is required.** The project used to build with
> `output: 'standalone'`, which is a VPS/Docker-only mode: it emits a self-contained
> `.next/standalone` folder that Hostinger does not look at. Standalone output is now
> opt-in via `NEXT_OUTPUT=standalone`, so a normal build is produced on Hostinger and
> `server.js` (repo root) starts it. It binds to `0.0.0.0` and to the `PORT` the
> platform injects — listening on loopback only would give you a 502.

**Environment variables** — add these in the app's settings *before* the first deploy:

| Variable | Value | Notes |
|----------|-------|-------|
| `DATABASE_URL` | `mysql://USER:PASS@srvXXXX.hstgr.io:3306/DBNAME?connection_limit=5` | Not `localhost`. See A1. |
| `AUTH_SECRET` | `openssl rand -base64 48` | **Must** be ≥16 chars or the app throws on every request. |
| `NEXT_PUBLIC_APP_URL` | `https://yourdomain.com` | Inlined at build time — changing it needs a rebuild. |
| `SESSION_TTL` | `604800` | Optional, 7 days. |

Keep `connection_limit` low. Shared hosting allows few concurrent MySQL connections
and Prisma's default pool is larger than that.

Click **Deploy**. Watch the log under **Deployments**. Build output lands outside
`public_html` and hPanel generates a `.htaccess` in `public_html` to route requests —
a missing `.htaccess` shows up as 403.

### A4. Create the schema

The build does **not** run migrations. Do this once, after the first successful
deploy, using `prisma/migrations/0_init/migration.sql`.

**Option 1 — phpMyAdmin (easiest, no setup)**

hPanel → **Databases → phpMyAdmin** → select your database → **Import** → upload
`prisma/migrations/0_init/migration.sql` → **Go**.

**Option 2 — Prisma CLI from your machine** (keeps the migration history table in sync)

```bash
# in the project, with DATABASE_URL exported to your Hostinger MySQL
npx prisma migrate deploy
```

### A5. Seed data (optional)

```bash
npm run db:seed
```

Seeds `superadmin@markazos.app` / `admin1234` and two demo store accounts. **Change
these immediately** — or skip seeding and create your own super admin, otherwise a
public store owner can log into your platform admin panel.

### A6. Verify

- `https://yourdomain.com` → marketing landing page
- `/login` → store login
- `/admin/login` → super admin login
- `/app` while logged out → must **redirect** to `/login`

### Deploying again

Push to the connected branch and the rebuild is automatic. Two things to know:

- **Uploads are not durable.** Product images are written to `public/uploads/` on the
  server's disk. A redeploy replaces the working tree, so uploaded images are lost.
  For production, move uploads to object storage (S3/Cloudflare R2) and serve them
  from a URL.
- **Never commit `.env`.** It is gitignored; production values live in hPanel.

---

## Option B — Plain Node on a VPS

```bash
git clone <your-repo> && cd markazos
npm ci
cp .env.example .env      # then fill in real values
npm run build
node server.js            # or: npm run start
```

Requires MySQL/MariaDB (or set `provider = "postgresql"` in `prisma/schema.prisma` for
Postgres) plus `npx prisma migrate deploy` once.

Keep it alive with **PM2** and put **Nginx** in front for TLS:

```bash
npm i -g pm2
pm2 start server.js --name markazos && pm2 save && pm2 startup
```

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

Then `certbot --nginx`. For uploads, mount a volume at `./public/uploads`.

## Option C — Docker

```bash
docker build -t markazos .                                    # sets NEXT_OUTPUT=standalone
docker run -d -p 3000:3000 --env-file .env --name markazos markazos
docker run --env-file .env markazos npx prisma migrate deploy
```

The image sets `NEXT_OUTPUT=standalone`, so it ships the self-contained
`.next/standalone/server.js`. A `.dockerignore` keeps `.env` and `node_modules` out
of the build context.

---

## Local development

The schema targets MySQL, so local dev needs a MySQL/MariaDB too — SQLite is gone:

```bash
docker run -d --name markazos-db -p 3306:3306 \
  -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=markazos mysql:8
```

```bash
# .env
DATABASE_URL="mysql://root:root@127.0.0.1:3306/markazos?connection_limit=5"
```

```bash
npx prisma migrate deploy
npm run db:seed
npm run dev
```

For schema changes, `npx prisma migrate dev` (this needs a **shadow database**, which
shared hosting does not give you — so run it locally, then deploy the committed
migration).
