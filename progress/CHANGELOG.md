# Changelog

Git history of this session, with the reasoning. Branch `main`, public repo
`github.com/Champion151947/dhias-pharmousy`.

---

## `87340a0` — Minimise render.yaml after a failed free-tier deploy

Render created the service but the deploy failed.

The application was verified healthy first: a fresh `git clone` of the pushed
`main` ran `npm ci` (exit 0), `npm run build` (exit 0, 53 files), then
`node api/src/server.js` with Render's injected environment, and served
`GET /health` with 200. So the failure was blueprint configuration, not code.

Removed every setting that can fail on the free plan:

- `region: singapore` — free instances are region-limited; now uses the default
- `autoDeploy` — deprecated field, superseded by `autoDeployTrigger`
- `value: ""` on `ADMIN_PASSWORD`, `GSTIN`, `DRUG_LICENSE_NUMBER` — empty
  strings are not safe env values, and unset already means demo mode
- `ADMIN_EMAIL`, `ADMIN_PHONE` — redundant, the app has working defaults

Down to four env vars.

**Not closed:** the actual error was never read from the Render log. The cause
was narrowed, not identified. See [PENDING.md](PENDING.md) item 1.

---

## `81d4c52` — Fix deployment instructions: `gh render` does not exist

The README and `render.yaml` instructed users to run
`gh render blueprint launch`. There is no such command — `gh` has no Render
extension, and `gh extension search render` returns only unrelated
repositories. The documented deploy path was broken.

Replaced with Render's official **Deploy to Render** button, the genuinely
one-click route: sign in with GitHub, press Deploy, and `render.yaml` supplies
every setting.

---

## `617e28f` — Run as a zero-config public demo

The previous change required a strong `ADMIN_PASSWORD` before the app would
boot in production. That made a public demo require a password decision before
anyone could click the site — friction for a throwaway showcase.

Replaced the hard failure with an explicit **demo mode**: with `ADMIN_PASSWORD`
unset, the app falls back to the published demo password, seeds both demo
accounts, and prints a `! DEMO MODE` warning at startup so the exposure is
never a surprise. A 12+ character `ADMIN_PASSWORD` turns it off and restores
the single-account behaviour.

`JWT_SECRET` deliberately stayed mandatory: a guessable signing key would let
anyone mint a valid admin session, which is a different order of risk from a
known demo password.

`render.yaml` became fully zero-config — no prompted values.

---

## `b644b8b` — Add one-click deployment config, fix empty catalogue in production

**Bug found:** `autoSeedIfEmpty()` returned early whenever
`NODE_ENV=production`, so a first production boot came up with zero products,
categories and banners — an empty site with no error to explain it. The guard
predated the credential work and had become redundant, since the seed no longer
creates demo logins in production. Removed the `config.isProd` early-return.

Also added `Dockerfile` (multi-stage, prod-only deps, non-root, `/app/data`
volume, `/health` healthcheck) and `.dockerignore`.

The image input was checked rather than assumed: `api/src/store/seed.js`
imports `api/scripts/generate-images.js`, which imports `api/scripts/artwork.js`.
A slim image omitting `api/scripts/` crashes on first seed.

**Never built** — Docker is not installed on the original machine.

---

## `8af86bc` — Require real credentials in production

The repository was to be public, and publishing a repo that hands out a working
admin login is a real problem: `api/.env.example` carried
`ADMIN_PASSWORD=Admin@12345` and `api/src/store/seed.js` hardcoded
`bcrypt.hash('Customer@123', ...)`.

- `api/src/config/env.js` — refuse to boot in production unless `JWT_SECRET` is
  32+ characters and `ADMIN_PASSWORD` is 12+ characters and not the documented
  default
- `api/src/store/seed.js` — the demo customer is never seeded outside
  development, since its password is a constant in the source
- `README.md` — documents the requirements and why GitHub Pages cannot host it

Verified all four cases: production without a password blocked; production with
the published default blocked; production with a strong password boots;
development with zero configuration still works.

**Superseded by `617e28f`**, which relaxed the `ADMIN_PASSWORD` half into demo
mode. The `JWT_SECRET` guard was kept.

---

## `e726333` — Convert to a single Node server with a JSON store

The foundational change: PostgreSQL and PGlite removed entirely.

- `api/src/store/index.js` — JSON data layer. Synchronous reads, debounced
  atomic writes (temp file then rename), a synchronous rollback `tx()`, and
  flush on shutdown
- `api/src/store/seed.js` and `seed-data.js` — a full dataset is built in
  memory, so `data/db.json` is human-readable and hand-editable
- All SQL routes rewritten against the store
- Rx prescriptions enforced server-side; COD-only checkout
- `api/src/app.js` serves `web/dist` and the API from one origin
- Deleted `api/src/db/`, `.pglite/`, `pglite-data/`, `api/uploads/`; removed
  `pg`, `@electric-sql/pglite`, `razorpay`
- `.gitattributes` added to stop line-ending churn

---

## Earlier, pre-git work

Not committed, so no history — recorded here because it explains the code.

- React error #31 on `/products` was fixed: the category dropdown rendered
  category objects as React children, and the filter compared a `category`
  field the API does not return. Now uses `c.name` / `c.slug` and
  `p.category_slug`.
- SPA static-serving fixes: the fallback no longer answers missing files with
  `index.html`; extensionless paths still get the app shell.
- Own-origin CORS: the allowlist excluded the app's own origin, so Vite's
  `crossorigin` bundle attributes caused a 500 and a blank page. Now derived
  from the request.
- `web/src/api/client.js` switched to relative `/api`; `web/vite.config.js`
  proxies to `:4000`.
- Checkout gained the prescription upload UI.
- Cart API accepted both `product_id` and `productId`; product list accepted
  both `limit` and `pageSize`; product detail resolves by id or slug.
- `npm run smoke` extended to **106 checks**, all passing.

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for the symptom-to-cause write-ups
of each of these.
