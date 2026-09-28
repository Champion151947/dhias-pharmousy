# Commands

Run from the repository root unless stated. Windows PowerShell.

## Setup

```bash
npm install                  # all workspaces (api, web)
```

## Run locally

| Command | What it does |
| --- | --- |
| `npm run dev` | Two processes: API on `:4000`, Vite dev server on `:5173` with hot reload and an `/api` proxy |
| `npm run serve` | **Production mode:** builds the SPA, then one server on `:4000` serving both API and site |
| `npm start` | Starts the API only, no rebuild — use after a build |
| `node api/src/server.js` | Same, invoked directly. Used by Docker and Render |

Start it detached (needed for the tunnel):

```powershell
Start-Process cmd -ArgumentList "/c","node api/src/server.js > C:\Temp\app.log 2>&1" `
  -WorkingDirectory D:\Pharmacy -WindowStyle Hidden
```

## Build

```bash
npm run build                # compiles web/dist; required before the SPA is served
```

`web/dist` is git-ignored, so a fresh clone has no `dist` until this runs.

## Test and lint

```bash
npm run smoke                              # 106-check end-to-end API suite, needs a server on :4000
npm run lint                               # api ESLint + web oxlint
npm run lint --workspace api               # api only; currently clean
npm run lint --workspace web               # web only; warnings, no errors
```

The smoke suite hits a live server, so start one first.

## Verify a deploy the way it should be verified

```bash
# 1. clean-clone pipeline - proves the committed code builds and boots
git clone https://github.com/Champion151947/dhias-pharmousy.git C:\Temp\verify
cd C:\Temp\verify; npm ci; npm run build
$env:NODE_ENV="production"; $env:JWT_SECRET=("a"*48); $env:PORT="10000"
node api/src/server.js

# 2. then, against the deployed host
curl https://<host>/health
curl https://<host>/api/products?limit=2
curl -I https://<host>/assets/index-BDr__sNj.js
```

The asset check matters most — compare status with and without an `Origin`
header. If they differ, the CORS bug in
[TROUBLESHOOTING.md](TROUBLESHOOTING.md) has returned.

## Public URL (temporary tunnel)

```powershell
$exe = "$env:TEMP\cloudflared.exe"
# one-time download if absent
if (-not (Test-Path $exe)) {
  Invoke-WebRequest -Uri "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe" `
    -OutFile $exe -UseBasicParsing
}
Start-Process $exe `
  -ArgumentList @("tunnel","--url","http://localhost:4000","--no-autoupdate","--protocol","http2") `
  -RedirectStandardError "$env:TEMP\tunnel.log" -WindowStyle Hidden

Start-Sleep 30
Select-String -Path "$env:TEMP\tunnel.log" -Pattern 'https://[a-z0-9-]+\.trycloudflare\.com' | Select-Object -First 1
```

`--protocol http2` is deliberate: the first QUIC attempt was rejected by the
edge with `Unauthorized: Tunnel not found`.

Stop it with `Get-Process cloudflared | Stop-Process`.

## Data

```bash
# reset to the seed catalogue
taskkill /F /IM node.exe && Remove-Item -Recurse -Force data
# then boot; it re-seeds automatically
```

Never commit `data/`. It holds customer data, prescription uploads and password
hashes, and `.gitignore` already excludes it.

## Git

```bash
git status
git log --oneline
git push origin main
gh repo view Champion151947/dhias-pharmousy
```

The repo is public and `gh` is already authenticated to `Champion151947`.

## Useful env overrides

```powershell
$env:NODE_ENV="production"
$env:JWT_SECRET=(node -e "console.log(require('crypto').randomBytes(48).toString('hex'))")
$env:ADMIN_PASSWORD="a-strong-password"   # 12+ chars; omit for demo mode
$env:DATA_DIR="D:\somewhere\persistent"   # point at a volume in production
$env:AUTO_SEED="false"                    # stop auto-seeding
$env:PORT="4000"
Remove-Item Env:NODE_ENV,Env:JWT_SECRET,Env:ADMIN_PASSWORD,Env:DATA_DIR,Env:AUTO_SEED,Env:PORT
```

PowerShell note: set these in the shell that launches the server. A child
process does not inherit variables set in a different shell, which is a common
cause of "the guard fired even though I set it".
