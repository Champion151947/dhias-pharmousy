# Current State

Last updated: 2026-09-28. Repo commit `87340a0` (branch `main`, public, in sync
with `origin/main`, working tree clean).

## Live public URL

**https://emissions-bargains-july-ram.trycloudflare.com**

Verified working end to end through this URL:

| Check | Result |
| --- | --- |
| `GET /health` | 200 |
| `GET /` | 200, React app mounts |
| `GET /assets/index-BDr__sNj.js` | 200, `text/javascript`, correct CORS header |
| `GET /assets/index-rur1hIV-.css` | 200, `text/css`, correct CORS header |
| `GET /api/products?limit=2` | 200, 2 of 43 products |
| `POST /api/auth/login` (demo admin) | 200, role `admin` |
| `GET /products` (SPA deep route) | 200, `#root` present |

> **This URL is temporary.** It is a Cloudflare quick tunnel running on the
> original Windows machine. If that machine sleeps, the process stops, or the
> session ends, the link goes dead. It is fine for showing the site to people
> right now; it is not a deployment. See [DEPLOYMENT.md](DEPLOYMENT.md).

If the link is dead, check `PENDING.md` for how to restart it.

## Demo accounts

Work in every environment, including production and the tunnel above.

| Role | Identifier | Password |
| --- | --- | --- |
| Admin | `admin@dhiaspharmousy.in` | `Admin@12345` |
| Customer | `customer@example.com` | `Customer@123` |

The admin login endpoint expects the field `identifier`, **not** `email`:

```bash
curl -X POST https://<host>/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"identifier":"admin@dhiaspharmousy.in","password":"Admin@12345"}'
```

## Local run

```bash
npm install          # once
npm run serve        # builds the SPA, then starts the server
```

- Storefront + API: `http://localhost:4000`
- Health: `http://localhost:4000/health`
- Dev mode with hot reload: `npm run dev` (storefront `:5173`, API `:4000`)

Node `v24.13.0`, npm `11.6.2`. Root `package.json` declares
`engines.node >= 20.11.0`.

## Verification status

| Check | Command | Result |
| --- | --- | --- |
| API lint | `npm run lint --workspace api` | clean |
| Web lint | `npm run lint --workspace web` | warnings only, no errors |
| Production build | `npm run build` | passes, 53 files in `web/dist` |
| End-to-end API suite | `npm run smoke` | **106 passed, 0 failed** |
| Clean-clone pipeline | `npm ci && npm run build && node api/src/server.js` | passes, `/health` 200 |
| Docker image | `docker build` | **not tested — Docker is not installed** |

The clean-clone test is the important one: it was run against a fresh
`git clone` of the pushed `main` using the same three commands and the same
environment variables Render injects. It confirms the failure on Render is
deployment configuration, not application code.

## Credential behaviour

The app runs in **demo mode** by default: no `ADMIN_PASSWORD` means the
published demo logins above work, and the server prints a `! DEMO MODE`
warning at startup.

Set `ADMIN_PASSWORD` to any 12+ character value to turn demo mode off. The app
then uses that password and stops creating the demo accounts.

`JWT_SECRET` is the one setting that is never optional in production. The app
refuses to boot without a 32+ character value, because a guessable signing key
would let anyone mint a valid admin session. Render generates it automatically.

## Seed data

Bootstrapped automatically when the store is empty, in development *and*
production: 43 products, 9 categories, 14 brands, 10 conditions, 3 banners,
3 coupons, and the accounts above. Set `AUTO_SEED=false` to disable.

## Known non-blocking issues

- The `web` lint run reports warnings, including a `set-state-in-effect`
  warning in `web/src/pages/Checkout.jsx`. No errors, and the build is clean.
- `web/dist` is git-ignored, so a fresh clone must run `npm run build` before
  the SPA is served.
- OTP logins use `OTP_PROVIDER=console`, which prints the code to the service
  log instead of sending SMS. Real phone logins need MSG91 or Twilio
  credentials. Password login is unaffected.
