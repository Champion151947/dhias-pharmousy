# Deployment

## What works today

A Cloudflare quick tunnel exposes the local app at a public HTTPS URL. Verified
working; see [CURRENT_STATE.md](CURRENT_STATE.md) for the current address.

**It is not a deployment.** The site lives on one Windows machine, and the URL
dies with the tunnel process. Use it to show the app to someone. Restart
instructions are in [PENDING.md](PENDING.md) item 2.

## Why GitHub is not hosting

GitHub cannot run this app, and no configuration change will change that:

- **GitHub Pages** serves static files only. It cannot run Express, so the API,
  cart, checkout, prescription uploads and login are all unavailable.
- **GitHub Actions** runs jobs to completion and exits. It is CI, not a host.
- The repository at `github.com/Champion151947/dhias-pharmousy` holds the
  source. That is all GitHub is doing here.

## Host options, honestly assessed

Checked against current 2026 pricing, not memory.

| Host | Cost | Persistent disk | Verdict |
| --- | --- | --- | --- |
| **Oracle Cloud Always Free** | $0 | **Yes** — 200 GB block storage | Best free option that keeps data. Needs a card; capacity is sometimes unavailable, and you administer the Linux box yourself. |
| **Google Cloud Free Tier** | $0 in `us-west1` | **Yes** — 30 GB on `e2-micro` | Same trade. Needs a card. |
| Render (free) | $0 | **No** | Easiest, but no disk and sleeps after ~15 min. Data resets on every deploy. |
| Railway | ~$5/mo | Volumes are metered | Not free. |
| Fly.io | ~$1.94/mo | Volumes are metered | Free tier retired Oct 2024. |
| Heroku | ~$5/mo | No | Free tier removed Nov 2022. |
| Vercel / Netlify / Cloudflare | $0 | No | Serverless functions, not a long-running Express server. |

The uncomfortable conclusion: **"free" and "keeps my data" are only both true
on a free-tier VM you administer yourself.** Every free managed platform either
has no persistent disk or scales to zero and destroys it.

For a demo, Render free or the tunnel is fine. For a shop that holds real
orders, use a VM with a volume, or move persistence to a hosted database.

## Render (the deploy that keeps failing)

`render.yaml` is committed and is minimal on purpose — only settings that are
definitely valid on the free plan.

```yaml
services:
  - type: web
    name: dhias-pharmousy
    runtime: node
    plan: free
    buildCommand: npm ci && npm run build
    startCommand: node api/src/server.js
    healthCheckPath: /health
    envVars:
      - key: NODE_ENV
        value: production
      - key: JWT_SECRET
        generateValue: true
      - key: AUTO_SEED
        value: "true"
      - key: OTP_PROVIDER
        value: console
```

Deploy via the **Deploy to Render** button in the main `README.md`, or in the
dashboard: **New → Blueprint → Connect → Create all as new services → Deploy
Blueprint**.

`ADMIN_PASSWORD` is deliberately omitted, so demo mode is on and nobody has to
set a password. Add it (12+ chars) to turn demo mode off.

**Current failure and what was ruled out:** two services exist, one returning
503 and one not resolving. The app was proven healthy from a clean clone using
Render's injected environment, so this is configuration, not code. See
[PENDING.md](PENDING.md) item 1 for how to get the real error out of the Render
logs. Do not repeat the guess-and-check; read the log.

## Docker

`Dockerfile` is a two-stage build: install all workspaces and build the SPA,
then a runtime stage with production dependencies only, the API, `api/scripts/`,
and `web/dist`. It runs as the non-root `node` user, declares `/app/data` as a
volume, and has a `/health` healthcheck.

**It has never been built — Docker is not installed on the original machine.**
Treat it as unverified.

```bash
docker build -t pharmacy .
docker run -d -p 80:4000 -v pharmacy-data:/app/data \
  -e JWT_SECRET=$(openssl rand -hex 48) \
  -e OTP_PROVIDER=console pharmacy
```

Capture the admin password if you set one, since it is generated:

```bash
docker inspect pharmacy --format '{{range .Config.Env}}{{println .}}{{end}}' | grep ADMIN_PASSWORD
```

## Any host, in three commands

Works anywhere with a Node runtime and a writable disk.

```bash
git clone https://github.com/Champion151947/dhias-pharmousy.git && cd dhias-pharmousy
npm ci && npm run build
NODE_ENV=production \
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(48).toString('hex'))") \
DATA_DIR=/var/lib/pharmacy \
node api/src/server.js
```

Put nginx or Caddy in front for TLS. `ecosystem.config.js` is a PM2 reference.

The app reads `PORT` from the environment, binds all interfaces (not localhost),
and sets `Secure` cookies in production. Those are the three things platforms
commonly break.

## Requirements checklist for any host

1. **One instance.** Never cluster, never run two against the same `DATA_DIR`.
2. **A persistent, writable `DATA_DIR`.** Otherwise every restart wipes all data.
3. **`JWT_SECRET` set** to 32+ random characters. The app refuses to boot
   otherwise, by design.
4. **Not serverless.** A long-running process holding a port is required.
