# Pending Work

Ordered by what matters. Items 1 and 2 are the only real blockers.

---

## 1. Get a real public deployment — HIGHEST PRIORITY

**Status: not done. Render deploys are failing.**

Two Render services exist for this repo and neither serves the site:

| Service | Last observed | Notes |
| --- | --- | --- |
| `dhias-pharmousy.onrender.com` | HTTP 503 | First Blueprint. Service is up but unhealthy. |
| `dhias-pharmousy-wvcs.onrender.com` | connection refused | Second Blueprint, "Create all as new services". Was still building. |

**The application is not at fault.** This was proven, not assumed. From a fresh
`git clone` of the pushed `main`, using the same three commands and the same
environment variables Render injects (`NODE_ENV=production`, a generated
`JWT_SECRET`, unset `ADMIN_PASSWORD`, a random `PORT`, no `DATA_DIR`):

```
npm ci                        -> exit 0
npm run build                 -> exit 0, 53 files
node api/src/server.js        -> boots, seeds, listens
GET /health                   -> 200 {"status":"ok"}
```

`render.yaml` was already reduced to the four settings that cannot fail on the
free plan (`NODE_ENV`, `JWT_SECRET` generated, `AUTO_SEED`, `OTP_PROVIDER`),
with the `region`, the deprecated `autoDeploy` field, and all empty env values
removed.

**What to do next:** re-check both Render URLs. If still failing, open the
Render dashboard, click the red failed-deploy entry, and read the actual error.
That log is the missing piece — the cause was never identified, only
eliminated down to a smaller surface. Do not guess further without it.

Fallback if Blueprint keeps failing: create a plain **Web Service** (not a
Blueprint) with these four values:

- Build Command: `npm ci && npm run build`
- Start Command: `node api/src/server.js`
- Health Check Path: `/health`
- Env: `NODE_ENV=production`, `AUTO_SEED=true`; let Render generate
  `JWT_SECRET`; leave `ADMIN_PASSWORD` unset for demo mode

---

## 2. The public URL is a temporary tunnel — HIGH PRIORITY

The working public link is a Cloudflare quick tunnel running on the original
machine. It dies when that process stops.

Restart it:

```powershell
# 1. the app
Start-Process cmd -ArgumentList "/c","node api/src/server.js > C:\Temp\app.log 2>&1" `
  -WorkingDirectory D:\Pharmacy -WindowStyle Hidden

# 2. the tunnel (cloudflared.exe must already be downloaded)
Start-Process cloudflared.exe `
  -ArgumentList @("tunnel","--url","http://localhost:4000","--no-autoupdate","--protocol","http2") `
  -RedirectStandardError C:\Temp\tunnel.log -WindowStyle Hidden

# 3. read the assigned URL out of the log, then verify it
Select-String -Path C:\Temp\tunnel.log -Pattern 'https://[a-z0-9-]+\.trycloudflare\.com' |
  Select-Object -First 1
```

Then **verify before telling anyone the link**: `GET <url>/health` must return
200, and `GET <url>/api/products?limit=2` must return products. A tunnel can
allocate a hostname and still fail — the first attempt did exactly that
(`Unauthorized: Tunnel not found`, NXDOMAIN) and a second attempt with
`--protocol http2` worked. Never hand over an unverified URL.

This is a demo convenience, not hosting. A named Cloudflare tunnel, or a real
host, is the fix.

---

## 3. Real SMS login — MEDIUM

`OTP_PROVIDER=console` prints the OTP to the service log. Nobody can log in on
a phone until MSG91 or Twilio is configured:

- MSG91: `MSG91_AUTH_KEY`, `MSG91_TEMPLATE_ID`, `MSG91_FLOW_ID`, then
  `OTP_PROVIDER=msg91`
- Twilio: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`,
  `TWILIO_VERIFY_SERVICE_SID`, then `OTP_PROVIDER=twilio`

Password login works today and needs none of this.

## 4. Business details to fill in — LOW

`GSTIN` and `DRUG_LICENSE_NUMBER` are empty and render as blanks on invoices
and in the footer. Set real values before this is a real shop.

Also unverified: Google sign-in. `GOOGLE_CLIENT_ID` /
`GOOGLE_CLIENT_SECRET` are read by the app but the OAuth consent flow was
never exercised end to end.

## 5. Dockerfile has never been built — LOW

`Dockerfile` and `.dockerignore` are written and their inputs are verified —
notably that `api/src/store/seed.js` imports `api/scripts/generate-images.js`
which imports `api/scripts/artwork.js`, and a slim image that omits
`api/scripts/` crashes on first seed. Both files are copied.

But **Docker is not installed on this machine, so `docker build` has never
run.** Treat the image as untested. First thing to do if you pick this up:
`docker build -t pharmacy .` and `docker run` it.

## 6. Lint warnings in the web app — LOW

`npm run lint --workspace web` passes with warnings, not errors. The one added
during this work is a `set-state-in-effect` warning in
`web/src/pages/Checkout.jsx`. Harmless; clean up if you are already in the file.

## 7. Data durability, if this ever takes real orders — MEDIUM, deferred

Every free tier used during this work is ephemeral: Render's free plan has no
persistent disk and sleeps when idle, and the tunnel dies with its process. Any
order, address or prescription taken in the meantime is lost without warning.

Before real use, either move persistence off the filesystem — a hosted database
behind `api/src/store/index.js`, which is the only file that would need to
change — or deploy to a host with a real volume and set `DATA_DIR` to its mount
point. See [DEPLOYMENT.md](DEPLOYMENT.md).
