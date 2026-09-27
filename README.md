# Dhiya's Pharmousy

An online pharmacy storefront: product catalogue, cart, COD checkout, phone-OTP
login, prescription (Rx) uploads, order tracking, and an admin back office.

The whole thing runs as **one Node process** with **no database to provision**.
Express serves both the JSON API and the built React single-page app from a
single origin.

---

## Why there is no database

The dataset lives in a plain JSON file (`data/db.json`) plus an uploads folder
(`data/uploads/`). That means a fresh clone runs immediately with a seeded
demo catalogue and zero configuration.

The tradeoff is important, so read [Running in production](#running-in-production)
before deploying: the store is held in memory and written to disk, so **the
process must not be replicated, and the data directory must be persistent**.

---

## Quick start (development)

```bash
npm install
npm run dev
```

- Storefront: http://localhost:5173
- API: http://localhost:4000

The Vite dev server proxies `/api` to the API process, so the browser only ever
talks to one origin.

For the single-process production mode:

```bash
npm run serve     # builds the SPA, then starts the server
```

Then open http://localhost:4000

### Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@dhiaspharmousy.in` | `Admin@12345` |
| Customer | `customer@example.com` | `Customer@123` |

These are development conveniences. The customer account is **never** seeded
when `NODE_ENV=production`, and the admin password below is rejected in
production. See [Security in production](#security-in-production).

---

## Configuration

Every variable has a safe development default, so nothing is required locally.
Copy `api/.env.example` to `api/.env` to override.

| Variable | Default | Notes |
| --- | --- | --- |
| `PORT` | `4000` | |
| `DATA_DIR` | `<repo>/data` | Point at a mounted volume in production, e.g. `/data` |
| `JWT_SECRET` | insecure dev value | **required in production**, 32+ characters |
| `ADMIN_EMAIL` | `admin@dhiaspharmousy.in` | |
| `ADMIN_PASSWORD` | `Admin@12345` | **required in production**, 12+ characters |
| `AUTO_SEED` | `true` | Seeds the demo catalogue when the store is empty |
| `OTP_PROVIDER` | `console` | Prints OTPs to the log. Use `msg91`/`twilio` for real SMS |
| `GSTIN`, `DRUG_LICENSE_NUMBER` | empty | Shown on invoices and in the footer |

Generate secrets with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

---

## Demo mode

By default the app runs as a **public demo**: no password to configure, and the
accounts above work everywhere, including on a deployed URL.

In this mode anyone can sign in as admin and change the data. That is the
intended trade for a demo, and the server prints a `! DEMO MODE` warning at
startup so it is never a surprise.

To turn it off, set `ADMIN_PASSWORD` to any 12+ character value. The app then
uses your password and stops creating the demo accounts.

`JWT_SECRET` is the one thing that is never optional in production: a
guessable signing key would let anyone mint a valid admin session, so the app
refuses to start without a 32+ character value. Render generates it for you.

Payments are **cash on delivery only**; there is no payment gateway and no
card data is ever collected. Orders containing Rx items are rejected by the
server unless the signed-in user has an approved prescription on file.

---

## Running in production

### Requirements

1. A **single** instance. The store is in-memory, so a second process would
   serve stale data and overwrite the file. Do not use clustering or multiple
   replicas.
2. A **persistent, writable** directory for `DATA_DIR`.
3. `JWT_SECRET` and `ADMIN_PASSWORD` set to real values.

### The data-durability problem — please read

On most free or trial hosting platforms the container filesystem is
**ephemeral**. `data/db.json` and `data/uploads/` are lost on every deploy,
restart, crash, or idle spin-down, and the app silently re-seeds an empty
catalogue. For a pharmacy holding real orders, patient addresses, and
prescription uploads, that is silent data loss.

Always mount a persistent volume and point `DATA_DIR` at it:

```bash
DATA_DIR=/var/lib/pharmacy
```

If your host cannot give you a persistent volume, this JSON store is the wrong
choice — put a real database behind `api/src/store/index.js` instead.

---

## Deploying

### As a public demo (one command, no card, no password)

```bash
gh render blueprint launch
```

`render.yaml` is fully zero-config: Render generates `JWT_SECRET` and every
other variable has a default, so nothing is prompted. The command prints your
live `onrender.com` URL when the build finishes, and the demo accounts above
work on it immediately.

The free plan has no persistent disk and sleeps when idle, so data resets on
each deploy. That is fine for a demo, and is why demo mode is the default here.

### Free hosting that keeps your data

The only genuinely free options that also provide a **persistent disk** are
free-tier virtual machines:

- **Oracle Cloud Always Free** — 2 ARM instances and 200 GB of block storage,
  free indefinitely. Best free option; needs a card at signup.
- **Google Cloud Free Tier** — one `e2-micro` with 30 GB disk, free in
  `us-west1`. Needs a card.

On either, the deployment is the standard Node service:

```bash
git clone <your-repo-url> pharmacy && cd pharmacy
npm ci && npm run build
NODE_ENV=production JWT_SECRET=... ADMIN_PASSWORD=... DATA_DIR=/var/lib/pharmacy \
  node api/src/server.js
```

Put nginx or Caddy in front for TLS. See `ecosystem.config.js` for a PM2
reference.

### Free hosting without a persistent disk (data will be lost)

Render, Railway and similar platforms have free Node tiers, but the free tiers
have no persistent volume and spin down when idle. Fine for a demo, **not** for
live orders.

### GitHub Pages will not work

GitHub Pages serves static files only and cannot run Express, so the API,
cart, checkout and uploads are all unavailable there. GitHub holds the source;
it cannot host this app.

---

## Testing

```bash
npm run smoke   # 106-check end-to-end API suite against a running server
npm run lint    # ESLint (api) + oxlint (web)
```

---

## Project layout

```
api/                Express server, JSON store, routes
  src/store/        JSON data layer, seed data, seeding
  src/routes/       auth, products, cart, orders, prescriptions, admin
  scripts/          image generation helpers
web/                React SPA (Vite)
scripts/smoke.mjs   End-to-end API test suite
data/               db.json + uploads (git-ignored, regenerated by the seed)
```
