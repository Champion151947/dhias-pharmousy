# Progress / Handoff

Documentation for picking up this project in a fresh session, with a different
model, or after a break. **Read this file first**, then follow the links.

## What this project is

An online pharmacy storefront — product catalogue, cart, cash-on-delivery
checkout, phone-OTP login, prescription (Rx) uploads, order tracking, and an
admin back office. It runs as **one Node process with no database**: Express
serves both a JSON API and the built React SPA from a single origin.

The whole PostgreSQL/PGlite stack was deliberately removed. The dataset is a
single editable JSON file.

## Status at a glance

| Area | State |
| --- | --- |
| App code | Complete and working |
| Tests | 106/106 API checks passing |
| Local run | Works — `npm run serve`, then `http://localhost:4000` |
| Public URL (tunnel) | **Live now** — see [CURRENT_STATE.md](CURRENT_STATE.md) |
| Public URL (Render) | **Not working** — deploy failing, see [PENDING.md](PENDING.md) |
| Docker image | Written but **never built** — Docker not installed |
| Repo | `github.com/Champion151947/dhias-pharmousy`, public, branch `main` |

## Files here

| File | Read it when |
| --- | --- |
| [CURRENT_STATE.md](CURRENT_STATE.md) | You need to know what works *right now* and what is live |
| [ARCHITECTURE.md](ARCHITECTURE.md) | You are changing code and need to understand the design |
| [PENDING.md](PENDING.md) | You are picking up the remaining work |
| [DEPLOYMENT.md](DEPLOYMENT.md) | You are deploying, or the live link is down |
| [TROUBLESHOOTING.md](TROUBLESHOOTING.md) | Something is broken and you hit an error message |
| [COMMANDS.md](COMMANDS.md) | You need the exact command for something |
| [CHANGELOG.md](CHANGELOG.md) | You want to know why the code looks the way it does |

## The three things a new session must know

1. **Run exactly one process.** The store is held in memory and written to a
   file. A second process serves stale data and can overwrite the file. Never
   cluster it or run two instances against the same `DATA_DIR`.

2. **`data/db.json` is the database.** It is git-ignored on purpose so customer
   data and password hashes never reach GitHub. Deleting it resets the app to
   the seed catalogue on next boot. `data/uploads/` holds prescription files and
   is lost with it.

3. **The live public URL is a temporary tunnel, not a deployment.** It only
   works while the tunnel process is running on the original machine. If the
   link is dead, the site is not broken — see [DEPLOYMENT.md](DEPLOYMENT.md).
